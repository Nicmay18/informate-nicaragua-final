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

export default function weservLoader({ src, width, quality = 80 }: ImageLoaderProps): string {
  // URLs ya optimizadas o servidas por CDN confiable — no re-procesar
  if (
    src.includes('images.weserv.nl') ||
    src.includes('cloudinary') ||
    src.includes('imgix') ||
    src.includes('cdn.jsdelivr.net') ||
    src.includes('raw.githubusercontent.com')
  ) {
    return src;
  }

  // Imágenes locales: servir directamente via Next.js image optimization (sin proxy externo)
  if (src.startsWith('/')) {
    return src;
  }

  // Solo proxyear imágenes externas via weserv.nl
  const params = new URLSearchParams();
  params.set('url', src);
  params.set('w', width.toString());
  params.set('q', quality.toString());
  params.set('fit', 'cover');
  params.set('n', '-1');
  params.set('output', 'webp');

  return `https://images.weserv.nl/?${params.toString()}`;
}
