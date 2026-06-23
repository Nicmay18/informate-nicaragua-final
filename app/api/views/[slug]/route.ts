import { NextResponse } from 'next/server';
import { incrementViewsBySlug } from '@/lib/db/homepage';
import { defaultRateLimiter } from '@/lib/rate-limit';

const SLUG_RE = /^[a-zA-Z0-9_-]+$/;
const SLUG_MAX_LEN = 200;

function getClientIP(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

function validateSlug(slug: string): { valid: boolean; reason?: string } {
  if (!slug || typeof slug !== 'string') return { valid: false, reason: 'Slug requerido' };
  if (slug.length > SLUG_MAX_LEN) return { valid: false, reason: 'Slug excede 200 caracteres' };
  if (!SLUG_RE.test(slug)) return { valid: false, reason: 'Slug contiene caracteres inválidos' };
  return { valid: true };
}

/**
 * Route Handler: incrementa vistas de una noticia de forma atómica.
 * POST /api/views/[slug]
 *
 * Protecciones:
 * - Rate limiting por IP (10 req/min)
 * - Validación estricta de slug (alfanumérico + guiones, max 200)
 * - Rechazo de métodos no POST con HTTP 405
 * - Errores sanitizados (sin stack traces al cliente)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIP(request);
  const rate = defaultRateLimiter.check(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas peticiones. Intente más tarde.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': String(rate.remaining),
          'X-RateLimit-Reset': String(rate.resetAt),
        },
      }
    );
  }

  try {
    const { slug } = await params;
    const v = validateSlug(slug);
    if (!v.valid) {
      return NextResponse.json({ error: v.reason }, { status: 400 });
    }

    // Extraer referrer y otros datos del body si existen
    let referrer = '';
    try {
      const body = await request.json();
      referrer = body.referrer || '';
    } catch { /* ignore if no body */ }

    const ua = request.headers.get('user-agent') || 'unknown';

    const newViews = await incrementViewsBySlug(slug, { referrer, ua, ip });
    if (newViews === null) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, slug, vistas: newViews });
  } catch (error) {
    console.error('[views/[slug]] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Método no permitido. Use POST.' }, { status: 405, headers: { Allow: 'POST' } });
}

export async function PUT() {
  return NextResponse.json({ error: 'Método no permitido. Use POST.' }, { status: 405, headers: { Allow: 'POST' } });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Método no permitido. Use POST.' }, { status: 405, headers: { Allow: 'POST' } });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Método no permitido. Use POST.' }, { status: 405, headers: { Allow: 'POST' } });
}
