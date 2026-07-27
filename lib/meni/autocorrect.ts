import type { NoticiaInput } from './types';
import type { MeniResult } from './types';
import type { EntityMap } from './quality-gate/types';

const DEFAULT_MAX_TITLE = 60;
const MIN_META = 120;
const MAX_META = 160;

export interface AutoCorrection {
  campo: string;
  antes: string;
  despues: string;
  descripcion: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function shortenTitle(title: string, max: number = DEFAULT_MAX_TITLE): string {
  if (title.length <= max) return title;
  const slice = title.slice(0, max + 1);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > 0 ? lastSpace : max;
  const shortened = title.slice(0, cut).trim();
  if (shortened.length < 10) return title.slice(0, max).trim();
  return shortened.replace(/[\s,;:]+$/g, '');
}

export function clampMeta(resumen: string, contenido: string): string {
  const text = resumen?.trim() ? stripHtml(resumen) : '';
  if (!text) {
    const first = stripHtml(contenido).split(/[.!?]/, 2).join('.').trim();
    const fallback = first.length > 100 ? first : stripHtml(contenido).slice(0, 220);
    return fallback.slice(0, MAX_META).trim();
  }
  if (text.length > MAX_META) {
    const slice = text.slice(0, MAX_META + 1);
    const lastSpace = slice.lastIndexOf(' ');
    const cut = lastSpace > 0 ? lastSpace : MAX_META;
    return text.slice(0, cut).trim().replace(/[\s,;:]+$/g, '');
  }
  if (text.length < MIN_META) {
    const plain = stripHtml(contenido);
    const extra = plain.slice(0, MAX_META - text.length - 1).trim();
    if (extra.length > 20) {
      return `${text} ${extra}`.slice(0, MAX_META).trim();
    }
  }
  return text;
}

function countOccurrences(html: string, pattern: RegExp): number {
  return (html.match(pattern) || []).length;
}

export function ensureStrongTags(html: string, entidades: EntityMap | undefined): string {
  const strongCount = countOccurrences(html, /<strong\b/gi);
  if (strongCount >= 2) return html;

  const nombres = entidades?.nombres?.slice(0, 3) || [];
  const lugares = entidades?.lugares?.slice(0, 2) || [];
  const instituciones = entidades?.instituciones?.slice(0, 2) || [];
  const targets = [...nombres, ...lugares, ...instituciones].filter(Boolean);

  let result = html;
  let wrapped = 0;

  // First sentence of the first paragraph
  result = result.replace(/(<p[^>]*>\s*)([^<.!?]{20,200}[.!?])/i, function (_match, open, sentence) {
    wrapped++;
    return `${open}<strong>${sentence}</strong>`;
  });

  for (const target of targets) {
    const safe = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|>|[\\s,;:])(${safe})(?=[\\s,;:.<])`, 'i');
    if (regex.test(result)) {
      result = result.replace(regex, '$1<strong>$2</strong>');
      wrapped++;
      if (wrapped >= 4) break;
    }
  }

  return result;
}

export function ensureH2(html: string, _categoria: string): string {
  const h2Count = countOccurrences(html, /<h2\b/gi);
  if (h2Count > 0) return html;

  const parts = html.split(/<\/p>/i);
  if (parts.length < 4) return html;

  const headings = [
    'Contexto',
    'Detalles del hecho',
    'Reacciones y antecedentes',
    'Datos y fuentes',
    'Lo que se sabe hasta ahora',
  ];

  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i > 0 && i % 2 === 0 && i / 2 - 1 < headings.length) {
      result.push(`<h2>${headings[i / 2 - 1]}</h2>`);
    }
    result.push(parts[i] + (i < parts.length - 1 ? '</p>' : ''));
  }
  return result.join('');
}

export function buildKeywords(meni: MeniResult): string[] {
  const fromSeo = meni.seo?.keywords || [];
  const fromCat = [meni.categoria].filter(Boolean);
  const unique = [...new Set([...fromCat, ...fromSeo])];
  return unique.slice(0, 8).map((k) => String(k));
}

function normalizeKeywords(input: NoticiaInput, meni: MeniResult): string[] | undefined {
  const existing = input.palabrasClave || (typeof input.keywords === 'string' ? input.keywords.split(',').map((k) => k.trim()).filter(Boolean) : input.keywords);
  if (existing && existing.length >= 3) return existing;
  const built = buildKeywords(meni);
  return built.length ? built : existing;
}

export function autoCorrectNoticia(input: NoticiaInput, meni: MeniResult): { input: NoticiaInput; corrections: AutoCorrection[] } {
  const corrections: AutoCorrection[] = [];
  const corrected: NoticiaInput = { ...input };

  // Content quality gate already corrected
  const baseContenido = meni.qualityGate?.textoCorregido || input.contenido || '';
  if (baseContenido && baseContenido !== input.contenido) {
    corrections.push({
      campo: 'contenido',
      antes: 'texto original',
      despues: 'texto corregido',
      descripcion: 'Aplicadas correcciones automáticas de lenguaje, terminología y párrafos.',
    });
  }
  corrected.contenido = baseContenido || input.contenido;

  // Title
  const newTitle = shortenTitle(corrected.titulo);
  if (newTitle !== corrected.titulo) {
    corrections.push({
      campo: 'titulo',
      antes: corrected.titulo,
      despues: newTitle,
      descripcion: `Título acortado de ${corrected.titulo.length} a ${newTitle.length} caracteres.`,
    });
    corrected.titulo = newTitle;
  }

  // Meta description
  const newResumen = clampMeta(corrected.resumen, corrected.contenido);
  const oldResumen = stripHtml(corrected.resumen || '');
  const newResumenText = stripHtml(newResumen);
  if (newResumenText !== oldResumen && newResumenText.length <= MAX_META) {
    corrections.push({
      campo: 'resumen',
      antes: corrected.resumen || '',
      despues: newResumen,
      descripcion: `Resumen ajustado a ${newResumenText.length} caracteres.`,
    });
    corrected.resumen = newResumen;
  }

  // Strong tags
  const withStrong = ensureStrongTags(corrected.contenido, meni.qualityGate?.entidades);
  if (withStrong !== corrected.contenido) {
    corrections.push({
      campo: 'contenido',
      antes: 'sin énfasis',
      despues: 'con <strong>',
      descripcion: 'Añadidos énfasis automáticos en entidades clave.',
    });
    corrected.contenido = withStrong;
  }

  // H2 headings
  const withH2 = ensureH2(corrected.contenido, meni.categoria);
  if (withH2 !== corrected.contenido) {
    corrections.push({
      campo: 'contenido',
      antes: 'sin subtítulos',
      despues: 'con subtítulos <h2>',
      descripcion: 'Añadidos subtítulos descriptivos para mejorar estructura.',
    });
    corrected.contenido = withH2;
  }

  // Keywords
  const newKeywords = normalizeKeywords(corrected, meni);
  if (newKeywords && (!input.palabrasClave || input.palabrasClave.length < newKeywords.length)) {
    corrections.push({
      campo: 'keywords',
      antes: (input.palabrasClave || []).join(', '),
      despues: newKeywords.join(', '),
      descripcion: 'Keywords completadas automáticamente.',
    });
    corrected.palabrasClave = newKeywords;
    corrected.keywords = newKeywords;
  }

  return { input: corrected, corrections };
}
