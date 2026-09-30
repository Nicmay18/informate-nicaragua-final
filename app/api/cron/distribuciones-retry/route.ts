import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  enviarTelegram, enviarFacebook, enviarIndexNow, enviarPush, enviarTwitter,
  yaDistribuido, type Noticia, type ChannelResult,
} from '@/lib/distribution/channels';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Consumidor de la cola `distribuciones_pendientes` (P1-5).
 * La cola existía pero nadie la procesaba: los canales fallidos quedaban
 * escritos y jamás se reintentaban. Este cron:
 * - procesa SOLO pendientes recientes (<7 días, los 11 históricos de julio
 *   quedan marcados 'legacy' y fuera del retry automático);
 * - máximo 1 reintento por doc (reintentos >= 1 → 'fallo_definitivo');
 * - reutiliza los senders compartidos (sin duplicar sendTelegram);
 * - idempotencia: verifica yaDistribuido antes de reenviar.
 */
const MAX_REINTENTOS = 1;
const LEGACY_DAYS = 7;
const BATCH = 20;

const SENDERS: Record<string, (n: Noticia, db: ReturnType<typeof getAdminDb>) => Promise<ChannelResult>> = {
  telegram: (n, db) => enviarTelegram(n, db),
  facebook: (n) => enviarFacebook(n),
  indexnow: (n) => enviarIndexNow(n),
  push: (n) => enviarPush(n),
  twitter: (n) => enviarTwitter(n),
};

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const token =
    request.headers.get('x-cron-secret') ||
    request.headers.get('x-admin-token') ||
    bearer ||
    new URL(request.url).searchParams.get('token');
  if (!verifyAdminOrCronToken(token)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const ahora = new Date();
    const legacyCutoff = new Date(ahora.getTime() - LEGACY_DAYS * 864e5).toISOString();

    const snap = await db
      .collection('distribuciones_pendientes')
      .where('proximoIntento', '<=', ahora.toISOString())
      .limit(BATCH)
      .get();

    const resultados: Array<{ slug: string; estado: string; detalle?: Record<string, unknown> }> = [];

    for (const docSnap of snap.docs) {
      const p = docSnap.data();
      const reintentos = typeof p.reintentos === 'number' ? p.reintentos : 0;

      // Históricos: clasificar LEGACY y sacarlos del retry automático.
      if (!p.fecha || p.fecha < legacyCutoff || p.estado === 'legacy') {
        if (p.estado !== 'legacy') {
          await docSnap.ref.update({ estado: 'legacy' });
        }
        resultados.push({ slug: p.slug, estado: 'legacy' });
        continue;
      }

      if (reintentos >= MAX_REINTENTOS) {
        await docSnap.ref.update({ estado: 'fallo_definitivo', resueltoAt: ahora.toISOString() });
        resultados.push({ slug: p.slug, estado: 'fallo_definitivo' });
        continue;
      }

      const noticiaSnap = await db.collection('noticias').where('slug', '==', p.slug).limit(1).get();
      if (noticiaSnap.empty) {
        await docSnap.ref.update({ estado: 'fallo_definitivo', motivo: 'noticia_no_existe', resueltoAt: ahora.toISOString() });
        resultados.push({ slug: p.slug, estado: 'noticia_no_existe' });
        continue;
      }
      const noticia = noticiaSnap.docs[0].data() as Noticia;

      const detalle: Record<string, unknown> = {};
      for (const canal of p.canalesFallidos || []) {
        const sender = SENDERS[canal];
        if (!sender) { detalle[canal] = 'canal_desconocido'; continue; }
        if (await yaDistribuido(db, p.slug, canal)) { detalle[canal] = 'ya_enviado'; continue; }
        const r = await sender(noticia, db);
        detalle[canal] = r.ok ? (r.skipped ? 'ya_enviado' : 'reenviado') : `fallo:${r.error || ''}`.slice(0, 120);
        if (r.ok) {
          await db.collection('distribuciones').add({
            slug: p.slug,
            titulo: noticia.titulo,
            canales: [canal],
            resultados: { [canal]: r },
            fecha: ahora.toISOString(),
            origen: 'retry',
          });
        }
      }

      const quedanFallos = Object.values(detalle).some((v) => String(v).startsWith('fallo'));
      await docSnap.ref.update({
        reintentos: reintentos + 1,
        estado: quedanFallos ? 'procesado_con_fallos' : 'procesado',
        ultimoIntento: detalle,
        resueltoAt: ahora.toISOString(),
      });
      resultados.push({ slug: p.slug, estado: quedanFallos ? 'procesado_con_fallos' : 'procesado', detalle });
    }

    await recordCronHeartbeat('/api/cron/distribuciones-retry', { durationMs: Date.now() - startedAt });
    return NextResponse.json({ success: true, procesados: resultados.length, resultados });
  } catch (e) {
    logger.error('[cron/distribuciones-retry]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
