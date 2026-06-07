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

export default function weservLoader({ src, width, quality = 75 }: ImageLoaderProps): string {
  // Imágenes locales (public/*) — Next.js las maneja directamente
  if (src.startsWith('/')) {
    return src;
  }

  // URLs ya optimizadas o de servicios de optimización — no re-procesar
  // jsDelivr ya sirve .webp optimizadas; pasar por weserv.nl solo ralentiza LCP
  if (
    src.includes('images.weserv.nl') ||
    src.includes('cdn.jsdelivr.net') ||
    src.includes('cloudinary') ||
    src.includes('imgix')
  ) {
    return src;
  }

  // Para imágenes externas (JSDelivr, Firebase, GitHub raw, etc.)
  // pasarlas por weserv.nl para optimización on-the-fly
  const params = new URLSearchParams();
  params.set('url', src);
  params.set('w', width.toString());
  params.set('q', quality.toString());
  params.set('fit', 'cover');
  params.set('n', '-1');

  // Forzar WebP (el navegador puede pedir AVIF si está soportado)
  params.set('output', 'webp');

  return `https://images.weserv.nl/?${params.toString()}`;
}
