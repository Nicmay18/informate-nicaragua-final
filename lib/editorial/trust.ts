/**
 * Capa de confianza editorial — independiente del score MENI.
 *
 * Clasifica las afirmaciones de una nota en categorías semánticas
 * auditables y produce por nota:
 *   - factores causales de la confianza (SOURCE_MISSING, etc.)
 *   - diagnóstico pregunta→respuesta con honestidad (UNKNOWN /
 *     NOT_AVAILABLE / HUMAN_REVIEW_REQUIRED)
 *   - qué falta para subir confianza
 *
 *   HECHOS               afirmaciones presentadas como factual
 *   ATRIBUCIONES         afirmaciones atribuidas a persona/institución/fuente
 *   INFORMACION_NO_CONFIRMADA  lenguaje provisional
 *   INFORMACION_NO_DISPONIBLE  información honestamente no disponible
 *   RIESGO_EDITORIAL     afirmación sensible sin atribución en contexto
 *   CONTRADICCION        señales incompatibles dentro del texto
 *   FUENTE               entidades de origen detectadas
 *
 * Determinista y conservador: lo que no puede afirmar lo marca para
 * revisión humana. La atribución se evalúa a nivel de párrafo (una fuente
 * citada en la oración anterior también atribuye la provisional).
 */

import {
  OFFICIAL_SOURCE_CS_RE,
  OFFICIAL_SOURCE_CS_GLOBAL_RE,
  NICARAGUA_PLACE_CS_GLOBAL_RE,
} from './known-sources';

export type TrustLevel = 'ALTA' | 'MEDIA' | 'BAJA';

export interface TrustFinding {
  text: string;
  detail?: string;
  atribuida?: boolean;
}

export type TrustFactor =
  | 'SOURCE_MISSING'
  | 'TEMPORAL_CONTEXT_MISSING'
  | 'ATTRIBUTION_MISSING'
  | 'PROVISIONAL_CLAIM'
  | 'ENTITY_UNVERIFIED'
  | 'CONTRADICTION'
  | 'LOW_EDITORIAL_EVIDENCE';

export interface TrustDiagnosis {
  /** Qué afirma la nota (titular + primera oración sustantiva). */
  afirmacionPrincipal: string;
  /** Afirmaciones totales clasificadas. */
  afirmaciones: number;
  atribuidas: number;
  conFuenteNombrada: number;
  provisionales: number;
  provisionalesSinFuente: number;
  provisionalesPresentadasComoHecho: number;
  noDisponibles: number;
  /** Respuestas honestas del diagnóstico. */
  tieneFecha: 'YES' | 'NO' | 'UNKNOWN';
  tieneUbicacion: 'YES' | 'NO' | 'UNKNOWN';
  entidadesIdentificables: string[];
  fuentesDetectadas: string[];
  /** Qué falta para subir la confianza. */
  queFalta: string[];
}

export interface TrustReport {
  hechos: TrustFinding[];
  atribuciones: TrustFinding[];
  noConfirmada: TrustFinding[];
  noDisponible: TrustFinding[];
  riesgos: TrustFinding[];
  contradicciones: TrustFinding[];
  fuentes: string[];
  factores: TrustFactor[];
  diagnostico: TrustDiagnosis;
  nivel: TrustLevel;
  requiereRevisionHumana: boolean;
  resumen: string;
}

// Verbos/expresiones de atribución periodística. La lista anterior omitía
// formas frecuentes ("relataron testigos", "aseguró", "manifestó",
// "según vecinos") y producía falsos positivos de atribución faltante.
// Cobertura de tiempos verbales: pretérito + presente + participio.
// Antes solo se reconocían pretéritos ("señaló", "informaron"); formas como
// "han señalado", "señalan" o "datos difundidos" quedaban sin atribuir y
// producían falsos PROVISIONAL_CLAIM sobre notas correctamente atribuidas.
const RE_ATRIBUCION = /\b(según|de acuerdo con|informó|informaron|informa|informan|informad[oa]s?|confirmó|confirmaron|confirma|confirman|confirmad[oa]s?|dijo|dijeron|dice|dicen|dich[oa]s?|señaló|señalaron|señala|señalan|señalad[oa]s?|reportó|reportaron|reporta|reportan|reportad[oa]s?|afirmó|afirmaron|afirma|afirman|afirmad[oa]s?|declaró|declararon|declara|declaran|declarad[oa]s?|explicó|explicaron|explica|explican|explicad[oa]s?|indicó|indicaron|indica|indican|indicad[oa]s?|precisó|precisaron|precisan|detalló|detallaron|detalla|detallan|detallad[oa]s?|anunció|anunciaron|anuncia|anuncian|anunciad[oa]s?|relató|relataron|relata|relatan|relatad[oa]s?|contó|contaron|aseguró|aseguraron|asegura|aseguran|asegurad[oa]s?|manifestó|manifestaron|manifiesta|manifiestan|manifestad[oa]s?|expresó|expresaron|expresa|expresan|expresad[oa]s?|admitió|admitieron|admite|admiten|admitid[oa]s?|reveló|revelaron|revela|revelan|revelad[oa]s?|difundió|difundieron|difunde|difunden|difundid[oa]s?|publicó|publicaron|publica|publican|publicad[oa]s?|destacó|destacaron|destaca|destacan|destacad[oa]s?|sostuvo|sostuvieron|sostiene|sostienen|denunció|denunciaron|denuncia|denuncian|denunciad[oa]s?|testificó|testificaron|testifica|testifican|testificad[oa]s?|testigos|vecinos|familiares|residentes|pobladores|comunicado|boletín|informe)\b/i;
const RE_NO_CONFIRMADA = /\b(presuntamente|al parecer|reportes no confirmados|trascendió|versiones preliminares|se rumora|habría|supuestamente|aparentemente|preliminarmente|según versiones)\b/i;
const RE_NO_DISPONIBLE = /\b(se investiga|investigación en curso|se desconoce|no se sabe|no han informado|sin pronunciamiento|aún no se ha confirmado|pendiente de confirmar|no proporcionaron|no se ha revelado|hasta el momento no)\b/i;
const RE_SUCESO = /\b(asesin|homicidio|falleci|muert|deten|arrest|acusad|señalad|sospech|víctima|delito|robo|violencia|balacera|apuñal|atropell)\w*/i;
// Límites explícitos de letra (incl. acentos): \b falla con "robóticos"
// porque "ó" no es \w — "robó" coincidía dentro de "robóticos" (falso
// positivo). Con clases de letras explícitas "robó" solo casa como palabra.
const RE_DELITO_AFIRMADO = /(^|[^a-záéíóúñü])(asesinó|mató|robó|violó|estafó|secuestró|atropelló)(?![a-záéíóúñü])/i;
const RE_NOMBRE_PROPIO = /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,2}\b/g;
// Fuentes nombradas: catálogo canónico compartido (./known-sources) —
// antes era una lista local más pobre que la del extractor, lo que marcaba
// SOURCE_MISSING sobre fuentes institucionales reales (SINAPRED, MINED,
// Ejército, Cruz Roja…). Case-sensitive a propósito: solo la forma
// capitalizada cuenta como fuente nombrada; el sustantivo común ("policía",
// "hospital", "gobierno") no debe inflar el set de fuentes detectadas.
// RE_FUENTE_CS: para .test() (no-global evita estado de lastIndex).
const RE_FUENTE = OFFICIAL_SOURCE_CS_GLOBAL_RE;
const RE_FUENTE_CS = OFFICIAL_SOURCE_CS_RE;
// Contexto temporal real: fecha numérica O expresión temporal relativa que
// ubica el hecho en el tiempo ("este miércoles", "durante la noche",
// "el pasado fin de semana"). Un detector que no las reconoce produce
// falsos positivos de TEMPORAL_CONTEXT_MISSING — corregido, no relajado.
const RE_FECHA = /\b(\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|(este|el|la|pasad[oa]s?|próxim[oa]s?)?\s*(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b|ayer|anteayer|hoy|esta (mañana|tarde|noche|madrugada|semana)|durante (la|el) (noche|madrugada|mañana|tarde|fin de semana|día)|(el|este|fin de) (fin de semana|año|mes)|recientemente|en horas de la (madrugada|mañana|tarde|noche)|últim[oa]s? (días|horas|semanas)|últimas \d+ horas|últimos \d+ (días|años)|hace \w+ (días|horas|semanas|meses|años)|\d{4})\b/i;
// Lugares: catálogo canónico compartido (./known-sources).
const RE_LUGAR = NICARAGUA_PLACE_CS_GLOBAL_RE;

function paragraphs(html: string): string[] {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .split(/<\/p>|<br\s*\/?>|\n{2,}/i)
    .map(p => p.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 0);
}

function splitSentences(parrafo: string): string[] {
  return parrafo.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 25);
}

/**
 * Analiza una nota y produce el reporte de confianza editorial.
 * La atribución se evalúa en contexto de párrafo: una fuente citada en
 * una oración vecina atribuye también a las provisionales del párrafo.
 */
export function analyzeTrust(input: {
  titulo: string;
  cuerpo: string;
  categoria?: string;
  /** Fuentes estructuradas del documento (fuente, fuentesComplementarias,
   * enlaces a medios). Sin este campo, una nota CON fuente persistida podia
   * recibir SOURCE_MISSING porque el detector solo miraba el texto. */
  fuentesExternas?: string[];
}): TrustReport {
  const paras = paragraphs(input.cuerpo);
  const tituloSents = splitSentences(input.titulo);

  const hechos: TrustFinding[] = [];
  const atribuciones: TrustFinding[] = [];
  const noConfirmada: TrustFinding[] = [];
  const noDisponible: TrustFinding[] = [];
  const riesgos: TrustFinding[] = [];
  const contradicciones: TrustFinding[] = [];
  const fuentes = new Set<string>();
  const entidades = new Set<string>();
  for (const ext of input.fuentesExternas ?? []) {
    const trimmed = (ext ?? '').trim();
    if (trimmed) fuentes.add(trimmed);
  }

  let totalSents = 0;
  let provisionalesSinFuente = 0;
  let provisionalesPresentadasComoHecho = 0;

  const evalSentence = (s: string, parrafoAtribuido: boolean) => {
    totalSents++;
    const atribuida = RE_ATRIBUCION.test(s) || parrafoAtribuido;
    const provisional = RE_NO_CONFIRMADA.test(s);
    const noDisponibleHit = RE_NO_DISPONIBLE.test(s);
    const esSuceso = RE_SUCESO.test(s);
    const fuenteLocal = s.match(RE_FUENTE) ?? [];

    for (const m of s.matchAll(RE_FUENTE)) fuentes.add(m[0]);
    // Fuente explícita no catalogada: si la oración atribuye a un nombre
    // propio ('según el Colegio Teresiano Managua', 'informó el INDES'),
    // esa entidad ES la fuente citada — no exigir el catálogo oficial.
    // Regla general: marcador de atribución + nombre propio en la misma
    // oración = fuente nombrada.
    if (RE_ATRIBUCION.test(s)) {
      for (const m of s.matchAll(RE_NOMBRE_PROPIO)) fuentes.add(m[0]);
    }
    for (const m of s.matchAll(RE_NOMBRE_PROPIO)) entidades.add(m[0]);

    if (noDisponibleHit) {
      // Información honestamente no disponible: se registra, nunca se penaliza.
      noDisponible.push({ text: s.slice(0, 160), atribuida });
      return;
    }
    if (provisional) {
      noConfirmada.push({ text: s.slice(0, 160), atribuida });
      // Provisional + atribuida (oración o párrafo) = formulación editorial
      // correcta. Solo provisional SIN fuente en todo el párrafo = riesgo.
      if (!atribuida) {
        provisionalesSinFuente++;
        riesgos.push({ text: s.slice(0, 160), detail: 'afirmación provisional sin fuente', atribuida: false });
        // Provisional presentada como hecho: provisional + afirmación de delito.
        if (RE_DELITO_AFIRMADO.test(s)) provisionalesPresentadasComoHecho++;
      }
      return;
    }
    if (atribuida) {
      atribuciones.push({ text: s.slice(0, 160), atribuida: true });
    } else {
      hechos.push({ text: s.slice(0, 160) });
    }

    // Riesgo editorial: delito afirmado sobre persona identificada sin atribución.
    if (esSuceso && !atribuida && RE_DELITO_AFIRMADO.test(s)) {
      const nombres = fuenteLocal.length > 0 ? [] : (s.match(RE_NOMBRE_PROPIO) ?? []);
      riesgos.push({
        text: s.slice(0, 160),
        detail: nombres.length > 0
          ? `delito afirmado sobre ${nombres[0]} sin atribución`
          : 'delito afirmado sin atribución ni víctima/atribución clara',
      });
    }

    // Contradicción real: una afirmación YA confirmada por una fuente y la
    // misma materia declarada bajo investigación abierta en la misma oración.
    // "Corresponde confirmar a la investigación" NO es contradicción (es
    // incertidumbre honesta) — por eso exigimos confirmación en pasado y
    // una frase de investigación en curso, no la mera palabra "investigación".
    if (/confirm(ó|aron)\b|ha(n)? confirmado/i.test(s) && /(se investiga|investigación en curso|continúa la investigación|sigue bajo investigación|aún se investiga)/i.test(s)) {
      contradicciones.push({ text: s.slice(0, 160), detail: 'hecho confirmado y bajo investigación abierta en la misma oración' });
    }
  };

  for (const s of tituloSents) evalSentence(s, RE_ATRIBUCION.test(input.titulo));
  for (const p of paras) {
    const parrafoAtribuido = RE_ATRIBUCION.test(p) || RE_FUENTE_CS.test(p);
    for (const s of splitSentences(p)) evalSentence(s, parrafoAtribuido);
  }

  const fullText = `${input.titulo} ${input.cuerpo}`;
  const hasFecha = RE_FECHA.test(fullText);
  const lugares = fullText.match(RE_LUGAR) ?? [];
  const esSucesoNota = RE_SUCESO.test(fullText) || /sucesos/i.test(input.categoria ?? '');

  // Riesgos agregados de la nota
  if (esSucesoNota && atribuciones.length === 0 && fuentes.size === 0 && totalSents > 3) {
    riesgos.push({ text: input.titulo.slice(0, 120), detail: 'nota de sucesos sin ninguna atribución de fuente' });
  }
  if (!hasFecha) {
    riesgos.push({ text: input.titulo.slice(0, 120), detail: 'sin referencia temporal detectable' });
  }

  // ── Factores causales ──
  const factores: TrustFactor[] = [];
  if (fuentes.size === 0) factores.push('SOURCE_MISSING');
  if (!hasFecha) factores.push('TEMPORAL_CONTEXT_MISSING');
  if (atribuciones.length === 0 && totalSents > 3) factores.push('ATTRIBUTION_MISSING');
  if (provisionalesSinFuente > 0) factores.push('PROVISIONAL_CLAIM');
  if (riesgos.some(r => /delito afirmado/.test(r.detail ?? ''))) factores.push('ENTITY_UNVERIFIED');
  if (contradicciones.length > 0) factores.push('CONTRADICTION');
  if (totalSents <= 3 || (hechos.length === 0 && atribuciones.length === 0 && totalSents > 0)) {
    factores.push('LOW_EDITORIAL_EVIDENCE');
  }

  // ── Qué falta para subir confianza ──
  const queFalta: string[] = [];
  if (fuentes.size === 0) queFalta.push('nombrar la fuente institucional o periodística');
  if (atribuciones.length === 0) queFalta.push('atribuir afirmaciones clave (según/informó/confirmó + fuente)');
  if (!hasFecha) queFalta.push('referencia temporal (fecha o día)');
  if (provisionalesSinFuente > 0) queFalta.push('fuente para las afirmaciones provisionales');
  if (lugares.length === 0 && esSucesoNota) queFalta.push('ubicación del hecho');
  if (contradicciones.length > 0) queFalta.push('resolver la contradicción interna');

  const nivel: TrustLevel =
    riesgos.length > 0 ? 'BAJA'
    : atribuciones.length === 0 && fuentes.size === 0 ? 'BAJA'
    : atribuciones.length >= 1 && (hasFecha || lugares.length > 0) ? 'ALTA'
    : 'MEDIA';

  const diagnostico: TrustDiagnosis = {
    afirmacionPrincipal: `${input.titulo} — ${(tituloSents[0] ?? paras[0] ?? '').slice(0, 140)}`.slice(0, 200),
    afirmaciones: totalSents,
    atribuidas: atribuciones.length,
    conFuenteNombrada: fuentes.size,
    provisionales: noConfirmada.length,
    provisionalesSinFuente,
    provisionalesPresentadasComoHecho,
    noDisponibles: noDisponible.length,
    tieneFecha: hasFecha ? 'YES' : 'NO',
    tieneUbicacion: lugares.length > 0 ? 'YES' : (totalSents === 0 ? 'UNKNOWN' : 'NO'),
    entidadesIdentificables: [...entidades].slice(0, 15),
    fuentesDetectadas: [...fuentes],
    queFalta,
  };

  return {
    hechos,
    atribuciones,
    noConfirmada,
    noDisponible,
    riesgos,
    contradicciones,
    fuentes: [...fuentes],
    factores,
    diagnostico,
    nivel,
    requiereRevisionHumana: riesgos.length > 0 || contradicciones.length > 0,
    resumen:
      `${totalSents} afirmaciones | ${atribuciones.length} atribuidas | ` +
      `${noConfirmada.length} sin confirmar | ${noDisponible.length} no disponibles | ` +
      `${riesgos.length} riesgos | ${contradicciones.length} contradicciones | fuentes: ${fuentes.size}`,
  };
}
