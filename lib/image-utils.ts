import { FALLBACK_IMAGE } from './types';

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

/**
 * Normaliza URLs de imágenes:
 * - Firebase Storage → ruta local /images/ (evita tokens expirados)
 * - Data URI, local, jsDelivr → directo (ya optimizadas)
 * - Unsplash/YouTube → limpia query params
 *
 * NOTA: Ya NO genera URLs weserv.nl. Eso lo maneja el loader global de next/image
 * (lib/image-loader.ts) para evitar pre-procesar URLs con width fijo, lo cual
 * rompe el srcset de next/image.
 */
export function getResponsiveImageUrl(url: string, _width?: number, _height?: number): string {
  if (!url || url === 'null' || url === 'undefined' || url === 'NaN') return FALLBACK_IMAGE;

  // Normalizar Firebase Storage URLs a rutas locales ANTES de cualquier otro procesamiento
  if (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com')) {
    try {
      const u = new URL(url);
      const pathMatch = u.pathname.match(/\/(?:v0\/b\/[^/]+\/o\/)?(?:images%2F)?(.+)$/);
      if (pathMatch) {
        const decoded = decodeURIComponent(pathMatch[1]);
        const filename = decoded.split('/').pop()?.trim();
        if (filename && filename.length > 1) return `/images/${filename}`;
      }
      const segments = u.pathname.split('/').filter(Boolean);
      const last = segments.pop();
      if (last && last.length > 1) return `/images/${last}`;
    } catch {}
    const raw = url.split('/').pop()?.split('?')[0]?.trim();
    if (raw && raw.length > 1) return `/images/${raw}`;
    return FALLBACK_IMAGE;
  }

  // Data URI, ruta local, o jsDelivr (ya optimizado): devolver directo
  if (url.startsWith('data:') || url.startsWith('/') || url.includes('cdn.jsdelivr.net')) {
    return url;
  }

  // Unsplash / YouTube: limpiar query params
  if (url.includes('images.unsplash.com') || url.includes('i.ytimg.com')) {
    return url.split('?')[0];
  }

  return url;
}
