import { NextResponse } from 'next/server';

export const maxDuration = 5;

/**
 * HONEYPOT: Este endpoint fue eliminado permanentemente.
 *
 * El tracking de vistas ahora se hace directamente desde el cliente
 * usando Firestore client-side (ver components/ArticlePage.tsx).
 *
 * Cualquier invocación a este endpoint viene de:
 * 1. Caché de navegadores con versión vieja del frontend
 * 2. Bots / scrapers que descubrieron la URL
 * 3. Scripts de terceros
 *
 * Devolvemos 410 Gone para que caches y bots dejen de intentarlo.
 */
async function logUnexpected(request: Request, slug: string) {
  const headers = Object.fromEntries(request.headers);
  console.error('HONEYPOT /api/views/[slug] CALL:', {
    timestamp: new Date().toISOString(),
    slug,
    method: request.method,
    url: request.url,
    referer: headers.referer || '',
    origin: headers.origin || '',
    'user-agent': headers['user-agent'] || '',
    'x-forwarded-for': headers['x-forwarded-for'] || '',
    'cf-connecting-ip': headers['cf-connecting-ip'] || '',
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await logUnexpected(request, slug);
  return NextResponse.json(
    { error: 'Gone. Use client-side Firestore tracking.' },
    { status: 410 }
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await logUnexpected(request, slug);
  return NextResponse.json(
    { error: 'Gone. Use client-side Firestore tracking.' },
    { status: 410 }
  );
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await logUnexpected(request, slug);
  return NextResponse.json({ error: 'Gone' }, { status: 410 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await logUnexpected(request, slug);
  return NextResponse.json({ error: 'Gone' }, { status: 410 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await logUnexpected(request, slug);
  return NextResponse.json({ error: 'Gone' }, { status: 410 });
}
