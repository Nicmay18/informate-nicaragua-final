import { NextResponse } from 'next/server';

const SLUG_RE = /^[a-zA-Z0-9_-]+$/;
const SLUG_MAX_LEN = 200;

function validateSlug(slug: string): { valid: boolean; reason?: string } {
  if (!slug || typeof slug !== 'string') return { valid: false, reason: 'Slug requerido' };
  if (slug.length > SLUG_MAX_LEN) return { valid: false, reason: 'Slug excede 200 caracteres' };
  if (!SLUG_RE.test(slug)) return { valid: false, reason: 'Slug contiene caracteres inválidos' };
  return { valid: true };
}

/**
 * Route Handler: VISTAS DESHABILITADAS temporalmente para reducir consumo.
 * POST /api/views/[slug]
 * 
 * NOTA: El tracking de vistas está pausado para conservar recursos de Firestore
 * y Vercel Functions. Reactivar cuando el tráfico sea estable y rentable.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const v = validateSlug(slug);
    if (!v.valid) {
      return NextResponse.json({ error: v.reason }, { status: 400 });
    }

    // Ignorar body para evitar procesamiento innecesario
    try { await request.json(); } catch { /* ignore */ }

    // Respuesta simulada: no toca Firestore, no consume recursos
    return NextResponse.json({ ok: true, slug, vistas: 0, disabled: true });
  } catch (error) {
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
