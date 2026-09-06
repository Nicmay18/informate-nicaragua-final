/**
 * Canonical word count for the Informate Nicaragua project.
 *
 * Rules:
 * - Strips HTML tags.
 * - Replaces HTML entities with a space.
 * - Collapses any whitespace to a single space.
 * - Splits on whitespace and counts non-empty tokens.
 *
 * This function is the single source of truth for word counting
 * across NIOS, MENI, dashboards and editorial tooling.
 */
export function countWords(text = ''): number {
  const normalized = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:[a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

/** Alias for modules that already import cleanWordCount. */
export function cleanWordCount(text = ''): number {
  return countWords(text);
}
