import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { RateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Endpoint público sin autenticación que escribe en Firestore: sin límite,
// un bot podía generar escrituras ilimitadas (costo + spam en la colección).
// Mismo patrón que /api/telemetry/* y /api/support/track.
// LIMITACIÓN REAL: el limiter vive en memoria de cada instancia serverless —
// protege contra abuso casual por IP dentro de una instancia, NO es un límite
// distribuido global (cold starts lo resetean; N instancias = N× el límite
// efectivo). La defensa de costo real sigue siendo validación + write mínimo.
const limiter = new RateLimiter({ intervalMs: 60_000, maxRequests: 5 });
const MAX_BODY_BYTES = 4 * 1024;
// Email válido real (el check anterior `includes('@')` aceptaba cualquier texto).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const limit = limiter.check(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
      );
    }

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    await adminDb.collection('newsletter').add({
      email,
      fecha: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('[newsletter]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
