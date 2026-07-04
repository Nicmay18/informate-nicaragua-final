/**
 * MIDDLEWARE - Eliminación de resultados tóxicos de Google + Protección Admin API
 * Intercepta URLs con slugs tóxicos y devuelve 410 Gone.
 * Protege /api/admin/* con auth + rate limit centralizado.
 * Vercel/Next.js App Router compatible.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isToxicSlug } from './lib/seo-toxic';

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING EN MEMORIA — Panel Admin (bajo tráfico)
// ═══════════════════════════════════════════════════════════════
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const LIMITS = {
  heavy: { max: 5, windowMs: 60_000 },   // 5 req/min — IA, generación
  read: { max: 60, windowMs: 60_000 },   // 60 req/min — listados, consultas
  default: { max: 30, windowMs: 60_000 }, // 30 req/min — resto
};

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip === '127.0.0.1' || ip === '::1' ? 'dev-local' : ip;
}

function checkRateLimit(identifier: string, max: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: max - 1, resetTime: now + windowMs };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, resetTime: entry.resetTime };
}

// Cleanup cada 5 minutos para evitar memory leak
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) rateLimitMap.delete(key);
    }
  }, 300_000);
}

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

  // ═══════════════════════════════════════════════════════════════
  // ADMIN API PROTECTION — Auth + Rate Limit centralizado
  // ═══════════════════════════════════════════════════════════════
  if (pathname.startsWith('/api/admin/')) {
    // 1. Auth
    const adminToken = request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '';
    const cronSecret = request.headers.get('x-cron-secret') || '';
    const validAdminKey = process.env.ADMIN_API_KEY || '';
    const validCronSecret = process.env.CRON_SECRET || '';

    const isValidAdmin = validAdminKey && adminToken === validAdminKey;
    const isValidCron = validCronSecret && cronSecret === validCronSecret;

    if (!isValidAdmin && !isValidCron) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_AUTH' },
        { status: 401 }
      );
    }

    // 2. Rate limit por tipo de endpoint
    let limitConfig = LIMITS.default;
    const pathLower = pathname.toLowerCase();
    if (pathLower.includes('generar') || pathLower.includes('expandir') || pathLower.includes('rescribir') || pathLower.includes('gemini') || pathLower.includes('deepseek') || pathLower.includes('groq')) {
      limitConfig = LIMITS.heavy;
    } else if (pathLower.includes('listar') || pathLower.includes('stats') || pathLower.includes('dashboard') || pathLower.includes('buscar') || pathLower.includes('metricas')) {
      limitConfig = LIMITS.read;
    }

    const ip = getClientIP(request);
    const identifier = `${ip}:${pathname}`;
    const { allowed, remaining, resetTime } = checkRateLimit(identifier, limitConfig.max, limitConfig.windowMs);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMITED',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limitConfig.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Continuar al endpoint con headers de rate limit
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limitConfig.max.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());
    return response;
  }

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
