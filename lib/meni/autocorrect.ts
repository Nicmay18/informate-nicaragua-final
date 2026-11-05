import type { NoticiaInput } from './types';
import type { MeniResult } from './types';
import type { EntityMap } from './quality-gate/types';
import { extractKeywords } from './utils/keywords';

const DEFAULT_MAX_TITLE = 60;
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

export function clampMeta(resumen: string, _contenido: string): string {
  // MENI 4.0 — nunca se completa el resumen con fragmentos del cuerpo:
  // inyectar texto del artículo para alcanzar un mínimo de caracteres
  // incorpora contenido sin verificación de contexto ni atribución.
  // Un resumen corto se reporta como sugerencia, no se "repara" fabricando.
  const text = resumen?.trim() ? stripHtml(resumen) : '';
  if (!text) return '';
  if (text.length > MAX_META) {
    const slice = text.slice(0, MAX_META + 1);
    const lastSpace = slice.lastIndexOf(' ');
    const cut = lastSpace > 0 ? lastSpace : MAX_META;
    return text.slice(0, cut).trim().replace(/[\s,;:]+$/g, '');
  }
  return text;
}

/** Hechos verificables extraíbles: cifras y nombres propios. */
function hechosDe(texto: string): Set<string> {
  const plain = stripHtml(texto);
  const facts = new Set<string>();
  for (const m of plain.matchAll(/\b\d[\d.,:%]*\b/g)) facts.add(m[0]);
  for (const m of plain.matchAll(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})*/g)) {
    facts.add(m[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
  }
  return facts;
}

/** Hechos presentes en `despues` que no existían en `antes`. */
export function hechosNuevos(antes: string, despues: string): string[] {
  const a = hechosDe(antes);
  return [...hechosDe(despues)].filter((f) => !a.has(f));
}

function countOccurrences(html: string, pattern: RegExp): number {
  return (html.match(pattern) || []).length;
}

export function ensureStrongTags(html: string, entidades: EntityMap | undefined): string {
  const strongCount = countOccurrences(html, /<strong\b/gi);
  if (strongCount >= 3) return html;

  const nombres = entidades?.nombres?.slice(0, 3) || [];
  const lugares = entidades?.lugares?.slice(0, 2) || [];
  const instituciones = entidades?.instituciones?.slice(0, 2) || [];
  const targets = [...nombres, ...lugares, ...instituciones].filter(Boolean);

  let result = html;
  let wrapped = 0;

  // El énfasis automático se reserva para entidades/datos concretos.
  // No envolvemos frases completas ni párrafos: evita sobreformatear el artículo.
  for (const target of targets) {
    const safe = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|>|[\\s,;:])(${safe})(?=[\\s,;:.<])`, 'i');
    if (regex.test(result)) {
      result = result.replace(regex, '$1<strong>$2</strong>');
      wrapped++;
      if (wrapped >= 3) break;
    }
  }

  return result;
}

export function ensureH2(html: string, _categoria: string): string {
  // MENI 4.0 — no se insertan encabezados genéricos ("Detalles del hecho",
  // "Datos y fuentes", "Reacciones y antecedentes"): prometen contenido que
  // el párrafo siguiente no necesariamente contiene. La estructura se
  // recomienda al editor, no se fabrica.
  return html;
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

/**
 * Resolución canónica de keywords para persistencia. Misma regla que la
 * auto-corrección: las del editor ganan si son suficientes (>=3); si no,
 * se MEZCLAN las existentes con las generadas por MENI (extractKeywords
 * directo — `meni.seo.keywords` hace echo del input cuando hay keywords,
 * por lo que no sirve para completar un set insuficiente).
 * `undefined` si no hay nada que persistir.
 */
export function resolveKeywords(input: NoticiaInput, meni: MeniResult): string[] | undefined {
  const existing = input.palabrasClave || (typeof input.keywords === 'string' ? input.keywords.split(',').map((k) => k.trim()).filter(Boolean) : input.keywords);
  if (existing && existing.length >= 3) return existing;
  const generated = extractKeywords(`${input.titulo} ${input.contenido}`, 12);
  const merged = [...new Set([...(existing || []), ...buildKeywords(meni), ...generated])].slice(0, 8);
  return merged.length ? merged : existing;
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

  // MENI 4.0 — validación de preservación factual: ninguna corrección
  // puede introducir cifras o nombres propios que no existían en el
  // original. Si el texto corregido añade hechos, se revierte el contenido
  // y se reporta — el editor decide, el sistema no inventa datos.
  const hechosAgregados = hechosNuevos(input.contenido || '', corrected.contenido || '');
  if (hechosAgregados.length > 0) {
    corrections.push({
      campo: 'contenido',
      antes: 'corrección aplicada',
      despues: 'corrección revertida',
      descripcion: `Corrección revertida: incorporaba datos sin respaldo (${hechosAgregados.slice(0, 5).join(', ')}).`,
    });
    corrected.contenido = input.contenido || '';
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
