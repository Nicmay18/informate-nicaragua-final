/**
 * Utilidades generales de MENI
 */

export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

export function safeSlice(texto: string, max: number, sufijo = '...'): string {
  const t = texto || '';
  if (t.length <= max) return t;
  return t.slice(0, max - sufijo.length).trim() + sufijo;
}

export function toTitleCase(phrase: string): string {
  return phrase
    .toLowerCase()
    .replace(/(^|\s)\S/g, (l) => l.toUpperCase());
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function countWords(texto: string): number {
  return (texto || '').split(/\s+/).filter(Boolean).length;
}

export function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
