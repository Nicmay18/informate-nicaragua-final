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
 * Convierte URLs de imágenes a formato optimizado:
 * - GitHub raw URLs: directo (disponible inmediatamente, sin caché de jsDelivr)
 * - Firebase Storage: directo (token requerido)
 * - Otras externas: proxy weserv.nl para redimensionar
 */
export function getResponsiveImageUrl(url: string, width?: number, height?: number): string {
  if (!url) return url;

  // Si es data URI, ruta local, o Firebase Storage (token requerido), no aplicar proxy
  if (url.startsWith('data:') || url.startsWith('/') || url.includes('firebasestorage.googleapis.com')) {
    return url;
  }

  // GitHub raw URLs: siempre directo, el proxy no puede acceder a GitHub raw
  if (url.includes('githubusercontent.com')) {
    return url;
  }

  // Otras imágenes externas: proxy weserv.nl para redimensionar
  if (width || height) {
    const params = new URLSearchParams();
    params.set('url', url);
    if (width) params.set('w', String(width));
    if (height) params.set('h', String(height));
    params.set('fit', 'cover');
    params.set('output', 'webp');
    params.set('q', '80');
    return `https://images.weserv.nl/?${params.toString()}`;
  }

  return url;
}

/**
 * Genera srcSet con múltiples tamaños para imágenes responsivas.
 * Para GitHub raw y otras externas usa weserv.nl.
 * Para Firebase devuelve solo la URL original (no se puede redimensionar vía proxy).
 */
export function getSrcSet(url: string, widths: number[] = [400, 800, 1200]): string {
  if (!url) return url;
  // Firebase, local, data URI, GitHub: no se pueden redimensionar vía proxy
  if (url.startsWith('data:') || url.startsWith('/') || url.includes('firebasestorage.googleapis.com') || url.includes('githubusercontent.com')) {
    return url;
  }
  return widths
    .map((w) => {
      const resized = getResponsiveImageUrl(url, w);
      return `${resized} ${w}w`;
    })
    .join(', ');
}
