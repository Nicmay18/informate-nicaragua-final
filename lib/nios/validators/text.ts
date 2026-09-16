// lib/nios/validators/text.ts
// Helpers de texto puros para los validators de NIOS.
// No mutan entrada; no dependen de estado.

import {
  AUXILIARY_VERBS,
  EMOJI_REGEX,
  FUNCTION_WORDS,
  NON_VERB_TOKENS,
} from './consts';

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&quot;|&lt;|&gt;|&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  const cleaned = stripHtml(text)
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .trim();
  if (!cleaned) return [];
  return cleaned.split(/\s+/).filter(Boolean);
}

export function wordCount(text: string): number {
  return tokenize(text).length;
}

export function splitSentences(text: string): string[] {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

export function sentenceCount(text: string): number {
  return splitSentences(text).length;
}

export function normalizeText(text: string): string {
  return stripHtml(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(normalizeText(a).split(/\s+/).filter(Boolean));
  const setB = new Set(normalizeText(b).split(/\s+/).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function hasEntity(text: string): boolean {
  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.slice(1).some((t) => {
    const w = t.replace(/[\p{P}]/gu, '');
    if (w.length < 3) return false;
    if (!/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/u.test(w)) return false;
    return !/^[A-Z]+$/u.test(w);
  });
}

function hasTokenFromSet(text: string, set: Set<string>): boolean {
  const tokens = tokenize(text);
  return tokens.some((t) => set.has(t));
}

export function hasQué(text: string): boolean {
  return hasTokenFromSet(text, new Set([
    'qué', 'que', 'ocurrió', 'ocurrio', 'sucedió', 'sucedio', 'pasó', 'paso',
    'trata', 'consiste', 'anunció', 'anuncio', 'informó', 'informo', 'explicó', 'explico',
    'detalló', 'detallo', 'confirmó', 'confirmo', 'indicó', 'indico', 'señaló', 'senaló',
    'reportó', 'reporto', 'presentó', 'presento', 'destacó', 'destaco',
  ]));
}

export function hasCuándo(text: string): boolean {
  return hasTokenFromSet(text, new Set([
    'hoy', 'ayer', 'mañana', 'manana', 'ahora', 'tarde', 'temprano',
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre',
    'octubre', 'noviembre', 'diciembre',
    'lunes', 'martes', 'miercoles', 'miércoles', 'jueves', 'viernes', 'sabado', 'sábado', 'domingo',
    'semana', 'mes', 'año', 'años', 'día', 'dias', 'dia', 'hora', 'horas',
    'pasado', 'pasada', 'próximo', 'proximo', 'último', 'ultimo', 'pasados', 'pasadas',
  ]));
}

export function hasDónde(text: string): boolean {
  return hasTokenFromSet(text, new Set([
    'managua', 'nicaragua', 'norte', 'sur', 'este', 'oeste', 'centro', 'capital',
    'frontera', 'fronteriza', 'departamento', 'municipio', 'comunidad', 'barrio', 'calle',
    'avenida', 'carretera', 'ciudad', 'pueblo', 'poblado', 'zona', 'sector', 'region', 'región',
    'país', 'pais', 'interior', 'exterior', 'localidad', 'provincia', 'distrito', 'parque', 'plaza',
    'mercado', 'hospital', 'escuela', 'universidad', 'colegio', 'centro',
    'san', 'santa', 'santo', 'benito', 'boaco', 'jinotega', 'estelí', 'esteli', 'granada', 'masaya',
    'matagalpa', 'chontales', 'rivas', 'madriz', 'segovia', 'raccs', 'raan', 'racs',
    'costa', 'rica', 'honduras', 'salvador', 'guatemala',
  ]));
}

// Detector morfológico de formas verbales finitas en español.
// No se basa exclusivamente en una lista cerrada: usa terminaciones flexivas.
export function isFiniteVerb(token: string): boolean {
  const w = token.toLowerCase();
  if (w.length < 3) return false;
  if (NON_VERB_TOKENS.has(w)) return false;

  // Terminaciones finitivas reconocibles (acentuadas, pretérito, imperfecto,
  // futuro/condicional, formas compuestas -ndo/-do)
  const finiteEndings = [
    'é', 'és', 'á', 'ás', 'í', 'ís', 'ó', 'ús',
    'amos', 'áis', 'emos', 'éis', 'imos', 'ís',
    'an', 'en', 'as', 'es',
    'aste', 'iste', 'aron', 'ieron',
    'aba', 'abas', 'abamos', 'abais', 'aban',
    'ía', 'ías', 'íamos', 'íais', 'ían',
    'ando', 'iendo',
    'ado', 'ido',
    'nte', 'nes',
  ];

  if (AUXILIARY_VERBS.has(w)) return true;
  if (w.endsWith('sé') || w.endsWith('ve')) return true;

  return finiteEndings.some((ending) => w.endsWith(ending));
}

export function hasPredicative(sentence: string): boolean {
  const tokens = tokenize(sentence);
  return tokens.some((t) => isFiniteVerb(t) && !FUNCTION_WORDS.has(t));
}

export function hasContentToken(sentence: string): boolean {
  const tokens = tokenize(sentence);
  return tokens.some((t) => !FUNCTION_WORDS.has(t) && t.length > 2);
}

export function hasEmoji(text: string): boolean {
  EMOJI_REGEX.lastIndex = 0;
  return EMOJI_REGEX.test(text);
}

export function extractParagraphs(html: string): string[] {
  if (!html) return [];
  const matches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  if (!matches) return [];
  return matches
    .map((p) => stripHtml(p).trim())
    .filter((p) => p.length > 0);
}

export function firstParagraph(html: string): string {
  const paragraphs = extractParagraphs(html);
  if (paragraphs.length > 0) return paragraphs[0] as string;
  const sentences = splitSentences(stripHtml(html));
  return sentences[0] ?? '';
}

export function extractH2s(html: string): string[] {
  if (!html) return [];
  const matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  if (!matches) return [];
  return matches.map((h) => stripHtml(h).trim());
}

export function countH2(html: string): number {
  return extractH2s(html).filter(Boolean).length;
}

export function isValidUrl(s: string): boolean {
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isInternalLink(href: string): boolean {
  if (!href) return false;
  if (href.startsWith('/noticias/')) return true;
  try {
    const url = new URL(href);
    return /^\/noticias\//.test(url.pathname);
  } catch {
    return false;
  }
}

export function extractInternalLinks(html: string): string[] {
  if (!html) return [];
  const hrefs = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1] as string);
  return hrefs.filter(isInternalLink);
}
