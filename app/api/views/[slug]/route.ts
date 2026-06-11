import { NextResponse } from 'next/server';
import { incrementViewsBySlug } from '@/lib/db/homepage';
import { rateLimit } from '@/lib/rate-limit';

// Validación estricta de slug: alfanumérico, guiones, guiones bajos; máx 200 chars
const SLUG_RE = /^[a-zA-Z0-9_-]+$/;
const SLUG_MAX_LEN = 200;

function validateSlug(slug: string): { valid: boolean; reason?: string } {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, reason: 'Slug requerido' };
  }
  if (slug.length > SLUG_MAX_LEN) {
    return { valid: false, reason: 'Slug excede 200 caracteres' };
  }
  if (!SLUG_RE.test(slug)) {
    return { valid: false, reason: 'Slug contiene caracteres inválidos' };
  }
  return { valid: true };
}

/**
 * Route Handler: incrementa vistas de una noticia de forma atómica.
 * POST /api/views/[slug]
 *
 * Protecciones aplicadas:
 * - Rate limiting por IP (30 req/min)
 * - Validación estricta de slug (alfanumérico + guiones, max 200)
 * - Rechazo de métodos no POST con HTTP 405
 * - Errores sanitizados (sin exposición de stack traces)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const limit = rateLimit(request, 30, 60_000);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Demasiadas peticiones. Intente más tarde.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit.limit),
          'X-RateLimit-Remaining': String(limit.remaining),
          'X-RateLimit-Reset': String(limit.reset),
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

    const newViews = await incrementViewsBySlug(slug);

    if (newViews === null) {
      return NextResponse.json(
        { error: 'Noticia no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, slug, vistas: newViews });
  } catch (error) {
    // Error sanitizado: nunca exponemos detalles internos al cliente
    console.error('[views/[slug]] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/** Rechaza cualquier método HTTP que no sea POST con 405 */
export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
