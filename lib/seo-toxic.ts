/**
 * SEO TOXIC SLUG DETECTOR
 * Detecta slugs con palabras sensibles para AdSense / desindexación.
 * Fecha: 2026-05-16
 */

export const TOXIC_WORDS = [
  'muere',
  'muerte',
  'tragedia',
  'homicidio',
  'asesinato',
  'fallece',
  'fallecimiento',
  'fallecimientos',
  'funeral',
  'sepelio',
  'matanza',
  'masacre',
  'suicidio',
  'linchamiento',
  'asesinado',
  'asesinada',
  'muerto',
  'muerta',
  'morir',
  'murio',
  'murió',
  'violacion',
  'violación',
  'abuso',
  'tortura',
  'secuestro',
  'secuestrado',
];

/** Slugs exactos conocidos a bloquear (410 o noindex) */
export const BLOCKED_SLUGS: string[] = [
  'tragedia-en-ee-uu-joven-de-rio-san-juan-muere-en-accidente',
  'conductor-se-fuga-tras-causar-muerte-de-joven-en',
  'homicidio-jinotega',
  'muertes-accidentes-abril',
];

/** Retorna true si el slug contiene palabras tóxicas */
export function isToxicSlug(slug: string): boolean {
  if (!slug) return false;
  const lower = slug.toLowerCase();
  // Slugs exactos bloqueados
  if (BLOCKED_SLUGS.includes(lower)) return true;
  // Palabras tóxicas dentro del slug
  return TOXIC_WORDS.some(word => lower.includes(word));
}
