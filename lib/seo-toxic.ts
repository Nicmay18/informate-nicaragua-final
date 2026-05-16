/**
 * SEO TOXIC SLUG DETECTOR
 * Bloquea ÚNICAMENTE slugs exactos listados manualmente.
 * NO usa detección por palabras clave para evitar bloquear noticias legítimas.
 * Fecha: 2026-05-16
 */

/** Slugs exactos a bloquear (410 o noindex). Añadir manualmente según sea necesario. */
export const BLOCKED_SLUGS: string[] = [
  'tragedia-en-ee-uu-joven-de-rio-san-juan-muere-en-accidente',
  'conductor-se-fuga-tras-causar-muerte-de-joven-en',
];

/** Retorna true solo si el slug está en la lista exacta de bloqueados */
export function isToxicSlug(slug: string): boolean {
  if (!slug) return false;
  return BLOCKED_SLUGS.includes(slug.toLowerCase());
}
