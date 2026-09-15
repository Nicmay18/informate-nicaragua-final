import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * ONE-TIME repair de fechas corruptas en `noticias`.
 *
 * Contexto: guardar-directo pisaba `fecha` con Timestamp.now() al re-guardar
 * sin body.fecha, y dejaba docs publicados sin `publishedAt` → notas viejas
 * mostradas como "hace X horas".
 *
 * GET  → dry-run: lista docs a reparar sin escribir.
 * POST → aplica los cambios.
 *
 * Reglas (conservadoras):
 *  1. fecha string → Timestamp (mismo valor, normaliza tipo).
 *  2. publishedAt ausente + doc publicado → backfill desde fecha o createTime.
 *  3. fecha > publishedAt + 24h → fecha fue pisada → fecha = publishedAt.
 *  4. publishedAt ausente + fecha > createTime + 24h → ambas = createTime.
 */
function isAuthorized(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toMillis(v: unknown): number | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'object' && v !== null && '_seconds' in (v as object)) {
    return (v as { _seconds: number })._seconds * 1000;
  }
  if (typeof v === 'string') {
    const t = new Date(v).getTime();
    return isNaN(t) ? null : t;
  }
  return null;
}

interface Fix {
  id: string;
  slug: string;
  reason: string;
  changes: Record<string, unknown>;
}

async function collectFixes(): Promise<{ scanned: number; fixes: Fix[] }> {
  const db = getAdminDb();
  const snap = await db.collection('noticias').get();
  const fixes: Fix[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const slug = data.slug || doc.id;
    const isPublished = data.publicado === true || data.estado === 'publicado';
    const fechaMs = toMillis(data.fecha);
    const publishedAtMs = toMillis(data.publishedAt);
    const createMs = doc.createTime ? doc.createTime.toMillis() : null;
    const changes: Record<string, unknown> = {};
    const reasons: string[] = [];

    if (typeof data.fecha === 'string' && fechaMs !== null) {
      changes.fecha = Timestamp.fromMillis(fechaMs);
      reasons.push('fecha:string->Timestamp');
    }

    if (publishedAtMs !== null && fechaMs !== null && fechaMs > publishedAtMs + DAY_MS) {
      changes.fecha = Timestamp.fromMillis(publishedAtMs);
      reasons.push('fecha:clobbered->publishedAt');
    }

    if (isPublished && publishedAtMs === null) {
      const fechaAfter = (changes.fecha as Timestamp | undefined)?.toMillis() ?? fechaMs;
      if (createMs !== null && fechaAfter !== null && fechaAfter > createMs + DAY_MS) {
        changes.fecha = doc.createTime;
        changes.publishedAt = doc.createTime;
        reasons.push('fecha+publishedAt:clobbered->createTime');
      } else if (fechaAfter !== null) {
        changes.publishedAt = Timestamp.fromMillis(fechaAfter);
        reasons.push('publishedAt:backfill<-fecha');
      } else if (createMs !== null) {
        changes.publishedAt = doc.createTime;
        reasons.push('publishedAt:backfill<-createTime');
      }
    }

    if (Object.keys(changes).length > 0) {
      fixes.push({ id: doc.id, slug, reason: reasons.join(' | '), changes });
    }
  }

  return { scanned: snap.size, fixes };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const { scanned, fixes } = await collectFixes();
    return NextResponse.json({
      mode: 'dry-run',
      scanned,
      toRepair: fixes.length,
      fixes: fixes.map((f) => ({
        slug: f.slug,
        reason: f.reason,
        fields: Object.keys(f.changes),
      })),
    });
  } catch (err) {
    logger.error('[repair-fechas] GET error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const { scanned, fixes } = await collectFixes();

    const BATCH = 400;
    let written = 0;
    for (let i = 0; i < fixes.length; i += BATCH) {
      const batch = db.batch();
      for (const f of fixes.slice(i, i + BATCH)) {
        batch.update(db.collection('noticias').doc(f.id), f.changes);
      }
      await batch.commit();
      written += Math.min(BATCH, fixes.length - i);
    }

    return NextResponse.json({
      mode: 'applied',
      scanned,
      repaired: written,
      fixes: fixes.map((f) => ({ slug: f.slug, reason: f.reason })),
    });
  } catch (err) {
    logger.error('[repair-fechas] POST error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
