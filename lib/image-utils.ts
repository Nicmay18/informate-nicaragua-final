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
 * Genera URL optimizada para el hero/LCP (imagen principal).
 * Usa weserv.nl para redimensionar imágenes a 1200px (mínimo para Google Discover),
 * reduciendo ~60% el peso vs la imagen original a resolución completa.
 * Esto mejora directamente el LCP y cumple requisitos de Google Discover.
 */
export function getHeroImageUrl(url: string, width = 1200): string {
  if (!url || url === 'null' || url === 'undefined' || url === 'NaN') return FALLBACK_IMAGE;

  const responsiveUrl = getResponsiveImageUrl(url);
  if (responsiveUrl.includes('images.weserv.nl') || responsiveUrl.startsWith('data:')) {
    return responsiveUrl;
  }

  // Imágenes locales: servir directamente sin proxy externo (mejor LCP)
  if (responsiveUrl.startsWith('/')) {
    return responsiveUrl;
  }

  // Imágenes ya servidas por CDN confiable: devolver directo (evita doble proxy y esqueletos grises)
  if (responsiveUrl.includes('cdn.jsdelivr.net') || responsiveUrl.includes('raw.githubusercontent.com') || responsiveUrl.includes('firebasestorage.googleapis.com') || responsiveUrl.includes('storage.googleapis.com')) {
    return responsiveUrl;
  }

  // Para otras URLs externas: pasar por weserv.nl a 1200px (cubre desktop + mobile + Google Discover)
  const params = new URLSearchParams();
  params.set('url', responsiveUrl);
  params.set('w', width.toString());
  params.set('q', '60');
  params.set('fit', 'cover');
  params.set('n', '-1');
  params.set('output', 'webp');

  return `https://images.weserv.nl/?${params.toString()}`;
}

/**
 * Normaliza URLs de imágenes:
 * - Data URI, local, jsDelivr → directo (ya optimizadas)
 * - Unsplash/YouTube → limpia query params
 * - URLs absolutas https/http → devuelve directo (el loader de next/image
 *   o getHeroImageUrl se encarga de weserv.nl)
 *
 * NOTA: Ya NO genera URLs weserv.nl. Eso lo maneja el loader global de next/image
 * (lib/image-loader.ts) para evitar pre-procesar URLs con width fijo, lo cual
 * rompe el srcset de next/image.
 */
export function getResponsiveImageUrl(url: string, _width?: number, _height?: number): string {
  if (!url || url === 'null' || url === 'undefined' || url === 'NaN') return FALLBACK_IMAGE;

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
