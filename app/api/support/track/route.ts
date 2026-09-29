import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { RateLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

// P1-2: endpoint público — consumidor legítimo es SupportMedium
// (1 impresión + 1 click por vista de artículo). 20/min por IP cubre
// lectura normal con margen; el spam se corta sin afectar lectores.
const limiter = new RateLimiter({ intervalMs: 60_000, maxRequests: 20 });
const MAX_BODY_BYTES = 2048;

const VALID_EVENTS = new Set(['impression', 'click']);

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const limit = limiter.check(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
      );
    }

    // Payload gigante → rechazo antes de parsear.
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { event, slug } = body as Record<string, unknown>;
    if (typeof event !== 'string' || !VALID_EVENTS.has(event)) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }
    // slug opcional pero acotado; campos extra se ignoran, no se persisten.
    const safeSlug =
      typeof slug === 'string' ? slug.slice(0, 120).replace(/[^\w\-.áéíóúñ]/gi, '') : '';

    const db = getAdminDb();
    await db.collection('support_analytics').doc().set({
      event,
      slug: safeSlug,
      timestamp: new Date().toISOString(),
      userAgent: (request.headers.get('user-agent') || '').slice(0, 200),
      referrer: (request.headers.get('referer') || '').slice(0, 300),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('[support/track] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
