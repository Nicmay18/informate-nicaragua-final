/**
 * MIDDLEWARE - Eliminación de resultados tóxicos de Google
 * Intercepta URLs con slugs tóxicos y devuelve 410 Gone.
 * Vercel/Next.js App Router compatible.
 * Fecha: 2026-05-16
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isToxicSlug } from './lib/seo-toxic';

/** Slugs tóxicos hardcodeados que deben devolver 410 Gone */
const TOXIC_PATHS = [
  '/noticias/tragedia-en-ee-uu-joven-de-rio-san-juan-muere-en-accidente',
  '/noticias/conductor-se-fuga-tras-causar-muerte-de-joven-en',
];

/** Bots parasitarios que queman CPU y cuota sin aportar tráfico real */
const BLOCKED_BOTS = [
  'GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot',
  'anthropic-ai', 'Cohere-ai', 'Bytespider', 'ImagesiftBot', 'YouBot',
  'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'DataForSeoBot',
  'BLEXBot', 'SeznamBot',
];

/** Crawlers legítimos que merecen cache agresiva */
const ALLOWED_CRAWLERS = [
  'Googlebot', 'Bingbot', 'Slurp',
  'DuckDuckBot', 'Baiduspider', 'YandexBot',
];

function goneResponse(): NextResponse {
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

/** Rutas API legacy que deben devolver 404 (eliminadas para ahorrar invocaciones) */
const BLOCKED_API_PATHS = ['/api/audio', '/api/view', '/api/views'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get('user-agent') || '';

  // 0. Bloquear endpoints API legacy eliminados → 404 inmediato, sin invocar Function
  if (BLOCKED_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return new NextResponse(null, { status: 404 });
  }

  // 1. Bloquear bots parasitarios inmediatamente
  if (BLOCKED_BOTS.some((bot) => ua.includes(bot))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 2. Forzar no-cache en panel.html (archivo estático cacheado por Vercel)
  if (pathname === '/panel.html') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0');
    response.headers.set('CDN-Cache-Control', 'no-store');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }

  // 3. URLs tóxicas hardcodeadas → 410 Gone
  if (TOXIC_PATHS.includes(pathname)) {
    return goneResponse();
  }

  // 4. Rutas de noticias con slugs tóxicos
  if (pathname.startsWith('/noticias/')) {
    const slug = pathname.replace('/noticias/', '');
    if (isToxicSlug(slug)) {
      return goneResponse();
    }
  }

  const response = NextResponse.next();

  // 5. Seguridad básica en todas las respuestas
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.delete('X-Powered-By');

  // 6. Crawlers legítimos: cache agresiva en rutas dinámicas
  const isCrawler = ALLOWED_CRAWLERS.some((bot) => ua.includes(bot));
  if (isCrawler && (pathname.startsWith('/noticias/') || pathname.startsWith('/categoria/'))) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap).*)',
  ],
};
