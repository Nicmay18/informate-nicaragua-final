/**
 * Canonical word count for the Informate Nicaragua project.
 *
 * Rules:
 * - Strips HTML tags AND non-visible content (comments, <script>,
 *   <style>, <noscript>, <template>).
 * - Decodes HTML entities (&amp;, &oacute;, &#233;, &nbsp;…) before
 *   counting — entities no longer glue or split words incorrectly.
 * - Counts whitespace-separated tokens of the visible text.
 *
 * This function is the single source of truth for word counting
 * across NIOS, MENI, dashboards and editorial tooling.
 * Implementation: lib/utils/html-text.ts (countVisibleWords).
 */
import { countVisibleWords } from './html-text';

export function countWords(text = ''): number {
  return countVisibleWords(text);
}

/** Alias for modules that already import cleanWordCount. */
export function cleanWordCount(text = ''): number {
  return countWords(text);
}
