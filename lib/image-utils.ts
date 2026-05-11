/**
 * Limpia URLs de imágenes externas para que Next.js Image Optimizer
 * pueda descargarlas sin conflictos de query params.
 * (e.g. Unsplash ?w=800 → sin query string)
 */
export function cleanImageUrl(url: string): string {
  if (!url) return url;
  if (url.includes('images.unsplash.com') || url.includes('i.ytimg.com')) {
    return url.split('?')[0];
  }
  return url;
}
