// tests/nios/validators/adversarial-helpers.ts
// Helpers puramente sintéticos para la suite adversarial de validators.
// No dependen de datos de producción ni de Firestore.

import type { Noticia } from '@/lib/types';
import { PREPOSITIONS, CONJUNCTIONS } from '@/lib/nios/validators/consts';

export function baseNoticia(partial: Partial<Noticia> = {}): Noticia {
  return {
    id: 'test-001',
    slug: 'test-001',
    titulo: 'Antorcha Centroamericana recorrerá Nicaragua del 10 al 13',
    resumen: 'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre y será entregada a Costa Rica.',
    contenido: '',
    categoria: 'Nacionales',
    imagen: 'https://cdn.example/antorcha.jpg',
    fecha: new Date().toISOString(),
    estado: 'publicado',
    ...partial,
  } as Noticia;
}

function normalizeForEnd(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function isBadEnd(word: string): boolean {
  const n = normalizeForEnd(word);
  return n.length > 0 && (PREPOSITIONS.has(n) || CONJUNCTIONS.has(n));
}

export function safeEnd(words: string[], safeBank: string[]): string[] {
  if (words.length === 0) return words;
  const last = words[words.length - 1] ?? '';
  if (isBadEnd(last)) {
    const replacement = safeBank[(words.length - 1) % safeBank.length] ?? 'antorcha';
    return [...words.slice(0, -1), replacement];
  }
  return words;
}

export function capitalize(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function takeWords(bank: string[], n: number, start = 0): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(bank[(start + i) % bank.length] ?? '');
  }
  return out;
}

export function distribute(total: number, parts: number, min = 1): number[] {
  if (parts <= 0 || total <= 0) return [];
  parts = Math.min(parts, total);
  const result = new Array(parts).fill(min);
  let remaining = total - parts * min;
  let i = 0;
  while (remaining > 0) {
    result[i % parts] += 1;
    remaining -= 1;
    i += 1;
  }
  return result;
}

function makeSentenceFromWords(words: string[], terminal = '.'): string {
  if (words.length === 0) return '';
  const first = capitalize(words[0] ?? '');
  const rest = words.slice(1).join(' ');
  return rest ? `${first} ${rest}${terminal}` : `${first}${terminal}`;
}

const SAFE_END_LEAD = [
  'Antorcha', 'Nicaragua', 'Costa', 'Rica', 'septiembre', 'recorrerá', 'será',
  'centroamericanos', 'población', 'días', 'logística', 'autoridades', 'trayecto',
  'municipios', 'país', 'colegios', 'universidades',
];

const LEAD_SEQ = [
  'La', 'Antorcha', 'Centroamericana', 'recorrerá', 'Nicaragua', 'del', '10', 'al', '13', 'de',
  'septiembre', 'y', 'será', 'entregada', 'a', 'Costa', 'Rica', 'en', 'Peñas', 'Blancas',
  'El', 'recorrido', 'busca', 'fortalecer', 'la', 'unión', 'de', 'los', 'pueblos', 'centroamericanos',
  'Autoridades', 'locales', 'y', 'estudiantes', 'acompañarán', 'la', 'antorcha', 'en', 'cada', 'etapa',
  'del', 'trayecto', 'nacional', 'La', 'ceremonia', 'incluirá', 'actos', 'culturales', 'en', 'varios',
  'municipios', 'del', 'país', 'Los', 'organizadores', 'invitaron', 'a', 'la', 'población', 'a',
  'participar', 'en', 'las', 'actividades', 'previstas', 'para', 'los', 'próximos', 'días',
  'Las', 'autoridades', 'educativas', 'coordinan', 'la', 'logística', 'del', 'evento', 'La', 'Policía',
  'Nacional', 'acompañará', 'el', 'trayecto', 'El', 'objetivo', 'es', 'fortalecer', 'la', 'hermandad',
  'y', 'paz', 'Cada', 'país', 'recorre', 'un', 'tramo', 'del', 'trayecto', 'antes', 'de', 'entregar',
  'el', 'fuego', 'al', 'siguiente', 'destino',
];

export function makeResumen(n: number, sentences = 1): string {
  if (n <= 0) return '';
  let words = takeWords(LEAD_SEQ, n);
  words = safeEnd(words, SAFE_END_LEAD);
  const counts = distribute(n, sentences, 1);
  const parts: string[] = [];
  let idx = 0;
  for (const c of counts) {
    const slice = words.slice(idx, idx + c);
    idx += c;
    parts.push(makeSentenceFromWords(slice));
  }
  return parts.join(' ');
}

const SAFE_END_PUNTO = [
  'Antorcha', 'Nicaragua', 'septiembre', 'recorrerá', 'Rica', 'autoridades', 'pueblo', 'trayecto',
  'país', 'evento', 'hermandad', 'paz', 'colegios', 'universidades', 'tramo',
];

const PUNTO_SEQ = [
  'La', 'Antorcha', 'recorrerá', 'Nicaragua', 'en', 'septiembre', 'y', 'será', 'entregada', 'a',
  'Costa', 'Rica', 'junto', 'a', 'autoridades', 'locales', 'y', 'estudiantes', 'del', 'país',
  'El', 'recorrido', 'busca', 'fortalecer', 'la', 'unión', 'de', 'los', 'pueblos', 'centroamericanos',
  'Las', 'autoridades', 'educativas', 'coordinan', 'la', 'logística', 'del', 'evento', 'La', 'Policía',
  'Nacional', 'acompañará', 'el', 'trayecto', 'El', 'objetivo', 'es', 'fortalecer', 'la', 'hermandad',
  'y', 'paz', 'Cada', 'país', 'recorre', 'un', 'tramo', 'del', 'trayecto', 'antes', 'de', 'entregar',
  'el', 'fuego', 'al', 'siguiente', 'destino',
];

export function makePunto(n: number): string {
  if (n <= 0) return '';
  let words = takeWords(PUNTO_SEQ, n);
  words = safeEnd(words, SAFE_END_PUNTO);
  return makeSentenceFromWords(words);
}

const CONTENT_BANK = [
  'la', 'antorcha', 'centroamericana', 'recorrerá', 'nicaragua', 'país', 'pueblo', 'pueblos',
  'hermandad', 'paz', 'educación', 'estudiantes', 'docentes', 'autoridades', 'locales', 'municipio',
  'departamento', 'comunidad', 'escuela', 'colegio', 'universidad', 'mercado', 'plaza', 'parque',
  'avenida', 'carretera', 'frontera', 'norte', 'sur', 'este', 'oeste', 'capital', 'septiembre',
  'octubre', 'viernes', 'sábado', 'semana', 'día', 'mañana', 'tarde', 'gobernador', 'alcalde',
  'diputado', 'delegado', 'organizador', 'policía', 'joven', 'bandera', 'símbolo', 'fuego', 'llama',
  'unión', 'compromiso', 'iniciativa', 'cultura', 'historia', 'tradición', 'memoria', 'futuro',
  'presente', 'pasado', 'esperanza', 'solidaridad', 'cooperación', 'desarrollo', 'progreso', 'justicia',
];

export function makeParagraph(totalWords: number, sentences: number): string {
  const counts = distribute(totalWords, sentences, 4);
  let idx = 0;
  const sentenceList: string[] = [];
  for (const c of counts) {
    const words = takeWords(CONTENT_BANK, c, idx);
    idx += c;
    sentenceList.push(makeSentenceFromWords(words));
  }
  return `<p>${sentenceList.join(' ')}</p>`;
}

export function makeContent(totalWords: number, sentencesPerParagraph = 3): string {
  if (totalWords <= 0) return '';
  const paraCount = Math.max(1, Math.floor(totalWords / 30));
  const counts = distribute(totalWords, paraCount, sentencesPerParagraph * 4);
  let idx = 0;
  const paragraphs: string[] = [];
  for (const c of counts) {
    const sentenceList: string[] = [];
    const sentenceCounts = distribute(c, sentencesPerParagraph, 4);
    for (const sc of sentenceCounts) {
      const words = takeWords(CONTENT_BANK, sc, idx);
      idx += sc;
      sentenceList.push(makeSentenceFromWords(words));
    }
    paragraphs.push(`<p>${sentenceList.join(' ')}</p>`);
  }
  return paragraphs.join('\n');
}
