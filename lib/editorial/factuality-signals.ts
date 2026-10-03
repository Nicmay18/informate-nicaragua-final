/**
 * BARRERA FACTUAL MÍNIMA (Fase 5)
 * Detector de señales de riesgo factual — NO decide publicación.
 * Produce SIGNALS que alimentan la autoridad editorial existente:
 *   detector → signal → makeEditorialDecision (Supervisor)
 *
 * Reglas derivadas del corpus real (evaluación de 10 noticias, 2026-09-25):
 * - iPhone Duo: afirmación extraordinaria + entidad sin evidencia + marcador IA → 95 ORO.
 * - Meta gafas: specs detalladas (precio/batería/fecha) sin una sola atribución → 92.
 * - Tribunal migrantes: cifra 22,000 sin fuente estructurada → 90.
 *
 * Principio: señalar AFIRMACIONES QUE NECESITAN EVIDENCIA, no juzgar verdad.
 * Un texto bien atribuido o con research no genera señales aunque sea extraordinario.
 */

import { OFFICIAL_SOURCE_CI_RE, OFFICIAL_SOURCE_CS_RE, hasConcretePlace } from './known-sources';

export type FactualitySeverity = 'CRITICAL' | 'IMPORTANT';

export interface FactualitySignal {
  code: string;
  severity: FactualitySeverity;
  /** Fragmento o patrón concreto que disparó la señal (trazabilidad). */
  evidence: string;
  desc: string;
}

export interface FactualityInput {
  titulo?: string;
  resumen?: string;
  contenido: string;
  /** Evidencia disponible: fuentes declaradas, research, story */
  fuentesComplementarias?: string[];
  research?: unknown;
  story?: unknown;
  /** true si el input traía marcadores de IA ya removidos (provenance). */
  aiArtifactsRemoved?: boolean;
}

/** Marcadores de atribución observados en el corpus real. */
const ATTRIBUTION_RE =
  /\b(según|de acuerdo (?:a|con)|conforme a|informó|informaron|indicó|indicaron|declaró|declararon|confirmó|confirmaron|dijo|dijeron|señaló|señalaron|reportó|reportaron|reveló|comunicado|fuente[s]?\s+(?:de|oficial|oficiales|policial|policiales|cercana|confiable)|agencia\s+(?:EFE|AFP|AP|Reuters)|\bEFE\b|\bAFP\b|\bAP\b|Reuters|portavoz|vocero|vocería|autoridad(?:es)?\s+(?:de|del|confirmaron|informaron)|según datos|reporte de|estudio (?:de|realizado))\b/i;

/** Cifras materiales: cantidades, porcentajes, montos, specs. */
const MATERIAL_FIGURE_RE =
  /\b\d[\d.,]*\s*(?:%|por ciento|millones|mil(?:es)?|dólares|córdobas|euros|personas|lesionados|heridos|muertos|fallecidos|detenidos|víctimas|desaparecidos|años|meses|kg|kilómetros|GB|TB|mAh|megapíxeles|pulgadas|watts|vehículos|departamentos|municipios|casos|tramos|viviendas|hectáreas|operativos|unidades)\b/gi;

/** Afirmaciones extraordinarias que requieren fuente explícita. */
const EXTRAORDINARY_RE =
  /\b(primer[ao]?(?:s)?\s+(?:modelo|producto|dispositivo|teléfono|plegable|avi[oó]n|misil|medicamento|vacuna|de la historia|en la historia)|por primera vez en (?:la )?historia|sin precedentes|r[ée]cord (?:mundial|hist[oó]rico|absoluto)|el (?:m[aá]s|mejor|peor) \w+ de la historia|el (?:m[aá]s|mejor|peor) \w+ del mundo|revoluciona(?:ria|rio)?|descubrimiento hist[oó]rico|cura (?:para|del|de) el c[aá]ncer)\b/i;

/** Verbos de lanzamiento/presentación de producto + entidad propia. */
const PRODUCT_LAUNCH_RE =
  /\b(presenta|presentó|lanza|lanzó|anuncia|anunció|revela|reveló|debuta)\b/i;
// Incluye marcas camelCase reales del corpus (iPhone, iPad, PlayStation, eSIM).
const PROPER_ENTITY_RE = /\b(?:[A-ZÁÉÍÓÚ][a-záéíóúñ]+|[A-Z]{2,}|[a-záéíóúñ]+[A-Z][a-zA-Z0-9]*)(?:\s+(?:[A-ZÁÉÍÓÚ][a-záéíóúñ0-9]+|[A-Z0-9]{2,}|[a-záéíóúñ]+[A-Z][a-zA-Z0-9]*))+/;

/** Métricas de víctimas para contradicción interna. */
const COUNT_METRICS = ['muertos', 'fallecidos', 'lesionados', 'heridos', 'detenidos', 'víctimas', 'desaparecidos'] as const;

function extractCountClaims(text: string): Map<string, Set<string>> {
  const claims = new Map<string, Set<string>>();
  const metrics = COUNT_METRICS.join('|');
  // "10 lesionados" | "lesionados: 10" | "dejó 94 detenidos"
  const re = new RegExp(`\\b(\\d[\\d.,]*)\\s+(${metrics})\\b|\\b(${metrics})\\b[^\\d]{0,15}\\b(\\d[\\d.,]*)\\b`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const metric = (m[2] || m[3] || '').toLowerCase();
    const value = (m[1] || m[4] || '').replace(/[.,]/g, '');
    if (!claims.has(metric)) claims.set(metric, new Set());
    if (value) claims.get(metric)!.add(value);
  }
  return claims;
}

function hasEvidence(input: FactualityInput): boolean {
  return (
    (input.fuentesComplementarias?.length ?? 0) > 0 ||
    input.research != null ||
    input.story != null
  );
}

/**
 * Atribución CONCRETA: institución, agencia o persona identificable.
 * "según la Policía Nacional" ≠ "según medios locales".
 * El segundo no se puede verificar — ver VAGUE_ATTRIBUTION_PROPOSAL.md.
 *
 * Instituciones: catálogo canónico compartido (./known-sources) — el mismo
 * que usa el extractor. Antes esta lista era propia y más pobre: SINAPRED,
 * MINED, Ejército, Cruz Roja, Medicina Legal, etc. se marcaban como vagas
 * aunque son fuentes institucionales reales.
 */
const CONCRETE_INSTITUTION_RE = OFFICIAL_SOURCE_CI_RE;

// Marcador de atribución case-INSENSITIVE (corrige "Según X" al inicio de
// oración, antes ignorado por la regex case-sensitive) + nombre propio
// capitalizado verificado aparte, porque con /i global el set [A-Z] casaría
// minúsculas y "según el viceministro" pasaría como persona identificada.
const ATTRIBUTION_MARKER_CI_RE =
  /\b(según|de acuerdo (?:a|con)|informó|dijo|confirmó|declaró|reveló|precisó|declaraciones de|portavoz de|vocero de|comunicado de[l]?)\s+(?:la |el |los |las )?/gi;
const PROPER_NAME_START_RE = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/;

/** ¿Hay al menos una atribución a persona identificable por nombre? */
function hasConcreteNamedSource(text: string): boolean {
  for (const m of text.matchAll(ATTRIBUTION_MARKER_CI_RE)) {
    const rest = text.slice((m.index ?? 0) + m[0].length);
    if (PROPER_NAME_START_RE.test(rest)) return true;
  }
  return false;
}

/**
 * FIELD_REPORT — reporting de campo propio / testimonios desde el lugar.
 * Distinto de fuente institucional Y de atribución vaga:
 *   "de acuerdo con reportes recibidos desde la comunidad de X, Siuna"
 *   "según habitantes de la comunidad de El Inocente N.º 2"
 *   "información obtenida en el lugar"
 * Requiere DOS componentes: (a) lenguaje de reporte de campo y
 * (b) ubicación concreta del hecho. "según testigos" o "según medios
 * locales" sin contexto territorial siguen siendo VAGUE — no promocionan.
 */
const FIELD_REPORT_LANG_RE =
  /\b(reportes?|informaci[oó]n|versiones?|testimonios?|relatos?|im[aá]genes)\s+(recibid\w+|obtenid\w+|provenientes?|recolectad\w+|proporcionad\w+|difundid\w+)?\s*(desde|en|de)\s+(la|el|una)\s+(comunidad|zona|lugar|aldea|municipio|sitio|sector)\b|\bseg[uú]n\s+(habitantes|pobladores|residentes|comunitarios|vecinos|familiares|testigos|lugareños)\s+(de|del|en)\s+(la\s+)?(comunidad|zona|aldea|municipio|localidad|sector)\b|\b(desde|en)\s+el\s+(lugar|sitio)\s+(de\s+(la|los|el)\s+)?(hechos?|incidente|siniestro|accidente|emergencia|tragedia)\b|\b(corresponsal|enviado\s+especial|en\s+terreno|cobertura\s+(de\s+)?Nicaragua\s+Informate)\b|\b(Nicaragua\s+Informate|este\s+medio|nuestro\s+(equipo|corresponsal|reportero))\s+(conoció|confirmó|verificó|document[óa]|estuvo|obtuvo|visit[óo])\b/i;

function hasFieldReport(text: string): boolean {
  return FIELD_REPORT_LANG_RE.test(text) && hasConcretePlace(text);
}

/**
 * Detecta señales de riesgo factual. Pure function, sin IO.
 * La decisión sobre qué hacer con ellas pertenece al Supervisor.
 */
export function detectFactualitySignals(input: FactualityInput): FactualitySignal[] {
  const signals: FactualitySignal[] = [];
  const text = [input.titulo, input.resumen, input.contenido].filter(Boolean).join('\n');
  if (!text.trim()) return signals;

  const hasAttribution = ATTRIBUTION_RE.test(text);
  const hasExternalEvidence = hasEvidence(input);

  // ── E. Provenance: el input traía artefactos de generación IA ──
  if (input.aiArtifactsRemoved) {
    signals.push({
      code: 'AI_PROVENANCE_ARTIFACT',
      severity: 'CRITICAL',
      evidence: 'input contenía marcadores de cita IA (:contentReference/oaicite)',
      desc: 'El texto proviene de una salida de IA con marcadores residuales; su contenido puede incluir afirmaciones fabricadas',
    });
  }

  // ── B. Cifras materiales sin respaldo ──
  const figures = text.match(MATERIAL_FIGURE_RE) ?? [];
  const distinctFigures = new Set(figures.map(f => f.toLowerCase().replace(/\s+/g, ' ')));
  if (distinctFigures.size >= 2 && !hasAttribution && !hasExternalEvidence) {
    signals.push({
      code: 'UNSOURCED_MATERIAL_FIGURES',
      severity: 'IMPORTANT',
      evidence: [...distinctFigures].slice(0, 4).join('; '),
      desc: `${distinctFigures.size} cifras materiales sin atribución ni evidencia disponible`,
    });
  }

  // ── C. Afirmación extraordinaria sin evidencia ──
  const extraordinary = text.match(EXTRAORDINARY_RE);
  if (extraordinary && !hasAttribution && !hasExternalEvidence) {
    signals.push({
      code: 'EXTRAORDINARY_UNSOURCED_CLAIM',
      severity: 'CRITICAL',
      evidence: extraordinary[0],
      desc: 'afirmación extraordinaria sin fuente explícita ni evidencia',
    });
  }

  // ── A. Entidad central sin evidencia ──
  // Título afirma un hecho sobre una entidad propia (producto/persona/organismo)
  // mediante un verbo de lanzamiento, sin atribución en todo el texto.
  if (input.titulo && PRODUCT_LAUNCH_RE.test(input.titulo) && PROPER_ENTITY_RE.test(input.titulo)) {
    const entities = input.titulo.match(new RegExp(PROPER_ENTITY_RE.source, 'g')) ?? [];
    const entityInBody = entities.filter(e =>
      new RegExp(e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(input.contenido),
    );
    if (entityInBody.length > 0 && !hasAttribution && !hasExternalEvidence) {
      signals.push({
        code: 'UNEVIDENCED_ENTITY',
        severity: 'IMPORTANT',
        evidence: entityInBody[0],
        desc: 'afirmación central sobre una entidad sin evidencia/atribución disponible',
      });
    }
  }

  // ── D. Contradicción interna ──
  // Misma métrica de víctimas con valores distintos dentro del texto.
  const countClaims = extractCountClaims(text);
  for (const [metric, values] of countClaims) {
    if (values.size > 1) {
      signals.push({
        code: 'INTERNAL_CONTRADICTION',
        severity: 'CRITICAL',
        evidence: `${metric}: ${[...values].join(' vs ')}`,
        desc: `el texto afirma valores contradictorios para "${metric}"`,
      });
      break; // una contradicción basta
    }
  }

  // ── E2. Afirmaciones factuales sin atribución (amplio) ──
  // Texto sustancial con afirmaciones materiales pero cero marcadores de
  // atribución y cero evidencia estructurada.
  const makesFactualClaims = distinctFigures.size >= 1 || !!extraordinary || EXTRAORDINARY_RE.test(input.titulo || '');
  // Una fuente concreta identificable en el texto satisface la cláusula
  // "fuentes" de esta señal: el texto NO está "sin fuentes" aunque no use
  // verbos de atribución (crónica deportiva: "la AMB lo colocó séptimo en
  // su clasificación"). Case-sensitive a propósito — misma doctrina que
  // trust.ts: solo la forma capitalizada cuenta como fuente nombrada; el
  // sustantivo común ("al hospital", "la policía") no desactiva la barrera.
  const hasConcreteSource =
    OFFICIAL_SOURCE_CS_RE.test(text) || hasConcreteNamedSource(text);
  if (makesFactualClaims && !hasAttribution && !hasExternalEvidence && !hasConcreteSource && text.length > 300) {
    signals.push({
      code: 'NO_ATTRIBUTION',
      severity: 'IMPORTANT',
      evidence: 'cero marcadores de atribución en texto con afirmaciones factuales',
      desc: 'afirmaciones factuales sin atribución, fuentes ni research',
    });
  }

  // ── F. Clasificación de la atribución ──
  // Tiene lenguaje atributivo (por eso las señales B–E2 no dispararon) pero
  // NINGUNA fuente concreta identificable + ≥2 cifras materiales.
  // Se distinguen dos clases:
  //   FIELD_REPORT — reporting de campo con ubicación concreta (testimonios
  //     de la comunidad X, información obtenida en el lugar). No es fuente
  //     institucional, pero tampoco agregación vaga. Sigue siendo IMPORTANT:
  //     el Supervisor decide (INVESTIGAR_MAS) — la clasificación corrige el
  //     diagnóstico, no relaja la barrera.
  //   VAGUE_ATTRIBUTION — atribución colectiva sin territorialidad ni
  //     primera mano ("según medios", "reportes", "autoridades").
  if (
    hasAttribution &&
    !hasExternalEvidence &&
    !CONCRETE_INSTITUTION_RE.test(text) &&
    !hasConcreteNamedSource(text) &&
    distinctFigures.size >= 2
  ) {
    if (hasFieldReport(text)) {
      signals.push({
        code: 'FIELD_REPORT',
        severity: 'IMPORTANT',
        evidence: 'reportes/testimonios desde el lugar con ubicación concreta, sin fuente institucional nombrada',
        desc: 'la nota se sostiene en reporting de campo (información o testimonios desde el lugar del hecho); falta confirmación de fuente institucional o persona identificable',
      });
    } else {
      signals.push({
        code: 'VAGUE_ATTRIBUTION',
        severity: 'IMPORTANT',
        evidence: 'atribución colectiva sin fuente nombrada ("medios", "reportes", "autoridades")',
        desc: 'afirmaciones atribuidas solo a fuentes vagas; no hay institución, agencia ni persona identificable',
      });
    }
  }

  return signals;
}
