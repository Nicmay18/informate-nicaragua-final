/**
 * Image loader usando images.weserv.nl como proxy de optimización.
 * Convierte automáticamente a WebP, redimensiona y comprime imágenes externas.
 *
 * ¿Por qué weserv.nl?
 * - Gratuito, sin límite de uso para sitios públicos
 * - Soporte WebP/AVIF automático según el navegador
 * - Cache global via Cloudflare
 * - Funciona con cualquier URL pública de imagen
 */

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function weservLoader({ src, width, quality = 70 }: ImageLoaderProps): string {
  // URLs ya optimizadas o de servicios de optimización — no re-procesar
  if (
    src.includes('images.weserv.nl') ||
    src.includes('cloudinary') ||
    src.includes('imgix')
  ) {
    return src;
  }

  // Para imágenes locales (public/*) y externas:
  // pasarlas por weserv.nl para optimización on-the-fly (WebP, resize, compress)
  const absoluteUrl = src.startsWith('/')
    ? `https://nicaraguainformate.com${src}`
    : src;

  const params = new URLSearchParams();
  params.set('url', absoluteUrl);
  params.set('w', width.toString());
  params.set('q', quality.toString());
  params.set('fit', 'cover');
  params.set('n', '-1');

  // Forzar WebP (el navegador puede pedir AVIF si está soportado)
  params.set('output', 'webp');

  return `https://images.weserv.nl/?${params.toString()}`;
}
