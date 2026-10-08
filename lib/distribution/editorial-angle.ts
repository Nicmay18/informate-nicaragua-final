/**
 * ÁNGULO EDITORIAL — capa común de extracción para distribución social.
 *
 * Determinista y basada en reglas: NUNCA inventa información.
 * Solo lee titulo/resumen/contenido/categoria de la noticia.
 * Cada canal (Telegram/Facebook/WhatsApp) consume el mismo ángulo
 * y lo presenta distinto: informar / atraer / compartir.
 */

export type NewsKind =
  | 'suceso'
  | 'historia_humana'
  | 'nacional'
  | 'deporte'
  | 'internacional'
  | 'utilidad'
  | 'espectaculo'
  | 'tecnologia'
  | 'general';

export interface EditorialAngle {
  kind: NewsKind;
  emoji: string;
  /** true si la noticia involucra muerte/tragedia → tono sobrio, sin exclamaciones */
  grave: boolean;
  /** lugar detectado (departamento/ciudad NI o país) si aparece en el texto */
  lugar?: string;
  /** 1-2 oraciones del resumen/contenido — contexto real, nunca inventado */
  contexto: string;
  /** oración con cifra/dato concreto si existe */
  datoClave?: string;
  /** pregunta natural de cobertura según el tipo (framing, no afirmación) */
  pregunta: string;
}

const KIND_BY_CATEGORY: Record<string, NewsKind> = {
  Sucesos: 'suceso',
  Nacionales: 'nacional',
  Deportes: 'deporte',
  Internacionales: 'internacional',
  'Espectáculos': 'espectaculo',
  'Tecnología': 'tecnologia',
  'Economía': 'nacional',
};

const EMOJI_BY_KIND: Record<NewsKind, string> = {
  suceso: '🚨',
  historia_humana: '🇳🇮',
  nacional: '🇳🇮',
  deporte: '⚽',
  internacional: '🌍',
  utilidad: 'ℹ️',
  espectaculo: '🎬',
  tecnologia: '💻',
  general: '📰',
};

const GRAVE_RE =
  /\b(muere|murió|murio|fallec|homicidio|asesinat|asesinado|asesinada|víctima|victima|cadáver|accidente fatal|tragedia|sepultar|repatriar|velorio|luto)\b/i;

const HISTORIA_HUMANA_RE =
  /\b(familia|familiares|repatriar|repatriación|ayuda|solidaridad|recaudar|rescatad[oa]s?|sobreviviente|historia)\b/i;

const UTILIDAD_RE =
  /\b(trámite|tramite|requisito|precio|costo|salario|boleto|horario|feria|vacuna|campaña|subsidio|pensión|cómo|guía)\b/i;

const DEPORTE_RESULT_RE =
  /\b(ganó|gano|venció|vencio|empató|clasific|campeón|campeona|medalla|récord|record|título|titulo|derrot)\b/i;

/** Lugares frecuentes en cobertura: departamentos/capitales NI + países vecinos. */
const LUGARES: string[] = [
  'Managua', 'León', 'Granada', 'Masaya', 'Chinandega', 'Matagalpa', 'Estelí',
  'Jinotega', 'Rivas', 'Carazo', 'Boaco', 'Chontales', 'Nueva Segovia',
  'Madriz', 'Bluefields', 'Bilwi', 'Puerto Cabezas', 'Siuna', 'Juigalpa',
  'San Carlos', 'Ocotal', 'Somoto', 'Tipitapa', 'Masatepe', 'Diriamba',
  'La Libertad', 'Wiwilí', 'El Rama', 'Corn Island', 'Ometepe',
  'Costa Rica', 'Honduras', 'Estados Unidos', 'México', 'Guatemala',
  'El Salvador', 'Panamá', 'Colombia', 'España', 'Cuba', 'Venezuela',
  'Argentina', 'Brasil', 'Chile', 'Perú', 'Japón', 'Indonesia',
];

function stripHtmlLite(html: string): string {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentences(text: string, maxChars: number): string {
  const limpio = stripHtmlLite(text);
  if (!limpio) return '';
  const oraciones = limpio.match(/[^.!?]+[.!?]+/g) || [];
  let out = '';
  for (const o of oraciones) {
    const l = o.trim();
    if (out.length + l.length + 1 > maxChars && out.length > 0) break;
    out += (out ? ' ' : '') + l;
  }
  if (!out) {
    out = limpio.substring(0, maxChars).trim();
    const esp = out.lastIndexOf(' ');
    if (esp > maxChars * 0.6) out = out.substring(0, esp);
  }
  return out;
}

/** Primera oración que contiene un dígito o dato cuantificable. */
function datoConCifra(texto: string): string | undefined {
  const oraciones = stripHtmlLite(texto).match(/[^.!?]+[.!?]+/g) || [];
  for (const o of oraciones) {
    const l = o.trim();
    if (/\d/.test(l) && l.length >= 30 && l.length <= 220) return l;
  }
  return undefined;
}

function detectLugar(texto: string): string | undefined {
  const lower = texto.toLowerCase();
  for (const lugar of LUGARES) {
    if (lower.includes(lugar.toLowerCase())) return lugar;
  }
  return undefined;
}

const PREGUNTA_BY_KIND: Record<NewsKind, string> = {
  suceso: '¿Qué se conoce hasta ahora del caso?',
  historia_humana: '¿Qué ocurrió y cómo se puede apoyar?',
  nacional: '¿Qué cambia con esto y a quién afecta?',
  deporte: '¿Qué significa este resultado para Nicaragua?',
  internacional: '¿Por qué importa y qué puede venir?',
  utilidad: '¿Qué debe saber para aprovecharlo o prepararse?',
  espectaculo: '¿Qué pasó y qué sigue?',
  tecnologia: '¿Qué cambia y para quién?',
  general: '¿Qué debe saber sobre esto?',
};

export interface AngleInput {
  titulo: string;
  resumen?: string;
  contenido?: string;
  metaDescription?: string;
  categoria?: string;
}

/**
 * Extrae el ángulo editorial de una noticia. Solo usa datos presentes;
 * si no hay contexto seguro, `contexto` queda vacío y el canal decide
 * publicar solo el titular.
 */
export function extractEditorialAngle(input: AngleInput): EditorialAngle {
  const titulo = stripHtmlLite(input.titulo);
  const fuente = [titulo, input.resumen || '', input.contenido || '']
    .map(stripHtmlLite)
    .join(' ')
    .trim();

  let kind: NewsKind = KIND_BY_CATEGORY[input.categoria || ''] || 'general';

  // Refinamientos por contenido (la categoría gana salvo evidencia fuerte)
  if (kind === 'general' && UTILIDAD_RE.test(fuente)) kind = 'utilidad';
  if ((kind === 'suceso' || kind === 'nacional' || kind === 'internacional') && HISTORIA_HUMANA_RE.test(fuente)) {
    kind = 'historia_humana';
  }
  if (kind === 'deporte' && !DEPORTE_RESULT_RE.test(fuente)) {
    // Deporte sin resultado claro: se mantiene deporte pero sin pregunta de resultado
  }

  const grave = GRAVE_RE.test(fuente);
  const lugar = detectLugar(fuente);
  const contexto =
    firstSentences(input.resumen || '', 200) ||
    firstSentences(input.metaDescription || '', 200) ||
    firstSentences(stripHtmlLite(input.contenido || ''), 200);
  const datoClave = datoConCifra(input.resumen || input.contenido || '');

  return {
    kind,
    emoji: EMOJI_BY_KIND[kind],
    grave,
    lugar,
    contexto,
    datoClave,
    pregunta: PREGUNTA_BY_KIND[kind],
  };
}
