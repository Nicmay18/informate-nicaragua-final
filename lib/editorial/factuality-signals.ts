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
  if (makesFactualClaims && !hasAttribution && !hasExternalEvidence && text.length > 300) {
    signals.push({
      code: 'NO_ATTRIBUTION',
      severity: 'IMPORTANT',
      evidence: 'cero marcadores de atribución en texto con afirmaciones factuales',
      desc: 'afirmaciones factuales sin atribución, fuentes ni research',
    });
  }

  return signals;
}
