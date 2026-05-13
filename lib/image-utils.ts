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
 * - raw.githubusercontent.com → cdn.jsdelivr.net (mejor caché CDN)
 * - Aplica proxy weserv.nl para redimensionar según el viewport
 */
export function getResponsiveImageUrl(url: string, width?: number, height?: number): string {
  if (!url) return url;

  // Convertir raw.githubusercontent.com → jsDelivr CDN
  let cdnUrl = url;
  if (cdnUrl.includes('raw.githubusercontent.com')) {
    cdnUrl = cdnUrl.replace(
      /https:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.*)/,
      'https://cdn.jsdelivr.net/gh/$1/$2@$3/$4'
    );
  }

  // Si es data URI o ruta local, no aplicar proxy
  if (cdnUrl.startsWith('data:') || cdnUrl.startsWith('/')) {
    return cdnUrl;
  }

  // Usar weserv.nl como proxy de redimensionamiento para imágenes externas
  if (width || height) {
    const params = new URLSearchParams();
    params.set('url', cdnUrl);
    if (width) params.set('w', String(width));
    if (height) params.set('h', String(height));
    params.set('fit', 'cover');
    params.set('output', 'webp');
    params.set('q', '80');
    return `https://images.weserv.nl/?${params.toString()}`;
  }

  return cdnUrl;
}
