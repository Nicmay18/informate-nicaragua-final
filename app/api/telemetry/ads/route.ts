import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { AUSPICIADORES_COLLECTION, ADS_DAILY_COLLECTION, adsDailyId } from '@/lib/ads/auspiciadores';

export const dynamic = 'force-dynamic';

/**
 * Telemetría de auspiciadores: impresiones y clics.
 * Privacidad: NO se guarda IP, UA completo ni identificadores personales.
 * sessionId (hash anónimo de sesión del sitio) solo sirve para deduplicar
 * impresiones en ventana corta en memoria — nunca se persiste.
 * El país agregado (header x-vercel-ip-country) se guarda solo a nivel diario.
 */

const eventSchema = z.object({
  sponsorId: z.string().trim().min(1).max(128),
  tipo: z.enum(['impresion', 'clic']),
  slug: z.string().trim().max(200).optional(),
  sessionId: z.string().trim().max(100).optional(),
});

// Dedup en memoria: 1 impresión por sesión+anuncio cada 10 min (best-effort,
// suficiente para métricas agregadas de cortesía comercial).
const seen = new Map<string, number>();
const DEDUP_MS = 10 * 60 * 1000;

function dedupe(key: string): boolean {
  const now = Date.now();
  const prev = seen.get(key);
  if (prev && now - prev < DEDUP_MS) return false;
  seen.set(key, now);
  if (seen.size > 5000) {
    for (const [k, t] of seen) if (now - t > DEDUP_MS) seen.delete(k);
  }
  return true;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { sponsorId, tipo, slug, sessionId } = parsed.data;

  if (tipo === 'impresion' && sessionId && !dedupe(`${sponsorId}:${sessionId}`)) {
    return NextResponse.json({ ok: true, dedup: true });
  }

  const country = (request.headers.get('x-vercel-ip-country') || '').slice(0, 8) || undefined;
  const db = getAdminDb();
  const campo = tipo === 'impresion' ? 'impresiones' : 'clics';
  const dateId = adsDailyId(sponsorId);

  try {
    const sponsorRef = db.collection(AUSPICIADORES_COLLECTION).doc(sponsorId);
    const sponsorSnap = await sponsorRef.get();
    if (!sponsorSnap.exists) return NextResponse.json({ ok: false }, { status: 404 });

    const batch = db.batch();
    batch.set(sponsorRef, { [campo]: FieldValue.increment(1) }, { merge: true });
    const dailyPayload: Record<string, unknown> = {
      sponsorId,
      date: dateId.slice(-10),
      [campo]: FieldValue.increment(1),
      updatedAt: new Date().toISOString(),
    };
    // El slug es clave de campo en Firestore: solo slugs sintácticos
    // (a-z0-9-) evitan romper el field-path; el resto agrega bajo 'otros'.
    if (slug) dailyPayload[`articulos.${/^[a-z0-9-]+$/.test(slug) ? slug : 'otros'}.${campo}`] = FieldValue.increment(1);
    if (country) dailyPayload[`paises.${country}`] = FieldValue.increment(1);
    batch.set(db.collection(ADS_DAILY_COLLECTION).doc(dateId), dailyPayload, { merge: true });
    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('[telemetry/ads] persist failed:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}
