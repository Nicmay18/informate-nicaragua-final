/**
 * MIDDLEWARE - Eliminación de resultados tóxicos de Google
 * Intercepta URLs con slugs tóxicos y devuelve 410 Gone.
 * Vercel/Next.js App Router compatible.
 * Fecha: 2026-05-16
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isToxicSlug } from './lib/seo-toxic';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo interceptar rutas de noticias
  if (pathname.startsWith('/noticias/')) {
    const slug = pathname.replace('/noticias/', '');
    if (isToxicSlug(slug)) {
      // 410 Gone = Google elimina del índice en 24-72 horas
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="es-NI">
<head>
  <meta charset="utf-8">
  <title>Contenido no disponible | Nicaragua Informate</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="googlebot" content="noindex, nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body{font-family:system-ui,sans-serif;max-width:600px;margin:80px auto;padding:20px;text-align:center;color:#555;}h1{color:#1a1a2e;}a{color:#c41e3a;text-decoration:none;}</style>
</head>
<body>
  <h1>Contenido no disponible</h1>
  <p>Este contenido ha sido removido permanentemente.</p>
  <p><a href="https://nicaraguainformate.com/">Volver al inicio de Nicaragua Informate</a></p>
</body>
</html>`,
        {
          status: 410,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Robots-Tag': 'noindex, nofollow',
            'Cache-Control': 'public, max-age=0, must-revalidate',
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/noticias/:slug*'],
};
