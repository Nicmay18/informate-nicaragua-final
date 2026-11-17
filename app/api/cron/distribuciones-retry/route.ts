import { NextRequest, NextResponse } from 'next/server';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  enviarTelegram, enviarFacebook, enviarIndexNow, enviarPush, enviarTwitter,
  yaDistribuido, type Noticia, type ChannelResult,
} from '@/lib/distribution/channels';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';
import { normalizeTelegramSlug } from '@/lib/distribution/telegram';

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
// Estados terminales: nunca se reprocesan. Sin este filtro, un doc ya
// resuelto volvía a entrar en la query (proximoIntento no se actualizaba)
// y 'requiere_verificacion'/'procesado' se sobrescribían a
// 'fallo_definitivo' en el siguiente tick — se perdía la señal humana.
const TERMINAL_STATES = new Set([
  'legacy', 'fallo_definitivo', 'requiere_verificacion',
  'procesado', 'procesado_con_fallos', 'noticia_no_existe',
]);
const TERMINAL_RETRY_AT = '9999-12-31T00:00:00.000Z';

const SENDERS: Record<string, (n: Noticia, db: ReturnType<typeof getAdminDb>) => Promise<ChannelResult>> = {
  // Telegram usa el claim atómico del sender; forceRetry solo permite
  // reclamar claims 'failed' (verificados). Claims 'unknown' se filtran
  // antes de llegar aquí — nunca se reintentan ciegamente.
  telegram: (n, db) => enviarTelegram(n, db, { forceRetry: true }),
  facebook: (n) => enviarFacebook(n),
  indexnow: (n) => enviarIndexNow(n),
  push: (n) => enviarPush(n),
  twitter: (n) => enviarTwitter(n),
};

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const { token, via } = extractRequestSecret(request);
  if (via === 'query') {
    logger.warn(`[cron/distribuciones-retry] ${QUERY_SECRET_DEPRECATION_NOTE}`);
  }
  if (!verifyAdminOrCronToken(token)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: NO_STORE_401_HEADERS });
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

      // Estado terminal → fuera de la ventana de la query, sin reprocesar.
      if (TERMINAL_STATES.has(String(p.estado || ''))) {
        await docSnap.ref.update({ proximoIntento: TERMINAL_RETRY_AT });
        continue;
      }

      // Históricos: clasificar LEGACY y sacarlos del retry automático.
      if (!p.fecha || p.fecha < legacyCutoff || p.estado === 'legacy') {
        if (p.estado !== 'legacy') {
          await docSnap.ref.update({ estado: 'legacy', proximoIntento: TERMINAL_RETRY_AT });
        }
        resultados.push({ slug: p.slug, estado: 'legacy' });
        continue;
      }

      if (reintentos >= MAX_REINTENTOS) {
        await docSnap.ref.update({ estado: 'fallo_definitivo', proximoIntento: TERMINAL_RETRY_AT, resueltoAt: ahora.toISOString() });
        resultados.push({ slug: p.slug, estado: 'fallo_definitivo' });
        continue;
      }

      const noticiaSnap = await db.collection('noticias').where('slug', '==', p.slug).limit(1).get();
      if (noticiaSnap.empty) {
        await docSnap.ref.update({ estado: 'fallo_definitivo', motivo: 'noticia_no_existe', proximoIntento: TERMINAL_RETRY_AT, resueltoAt: ahora.toISOString() });
        resultados.push({ slug: p.slug, estado: 'noticia_no_existe' });
        continue;
      }
      const noticia = noticiaSnap.docs[0].data() as Noticia;

      const detalle: Record<string, unknown> = {};
      for (const canal of p.canalesFallidos || []) {
        const sender = SENDERS[canal];
        if (!sender) { detalle[canal] = 'canal_desconocido'; continue; }
        if (await yaDistribuido(db, p.slug, canal)) { detalle[canal] = 'ya_enviado'; continue; }

        // Telegram: resultados ambiguos no se reintentan automáticamente.
        // claim 'unknown' = Telegram pudo haber recibido el mensaje →
        // duplicaría. Requiere verificación humana vía /api/telegram resolve.
        if (canal === 'telegram') {
          try {
            const claimSnap = await db.collection('distribuciones_envios').doc(`telegram_${normalizeTelegramSlug(p.slug)}`).get();
            const claim = claimSnap.data();
            const claimStatus = claim?.status;
            const claimedAt = Date.parse(String(claim?.claimedAt || ''));
            if (claimStatus === 'unknown') {
              detalle[canal] = 'requiere_verificacion';
              continue;
            }
            if (claimStatus === 'sending' && Number.isFinite(claimedAt) && Date.now() - claimedAt < 10 * 60 * 1000) {
              detalle[canal] = 'envio_en_curso';
              continue;
            }
          } catch { /* el sender sigue siendo la barrera atómica */ }
        }

        const r = await sender(noticia, db);
        detalle[canal] = r.ok
          ? (r.skipped ? 'ya_enviado' : 'reenviado')
          : r.ambiguous
            ? 'requiere_verificacion'
            : `fallo:${r.error || ''}`.slice(0, 120);
        if (r.ok) {
          // Sin campos undefined: Firestore los rechaza y rompería el registro.
          const clean: Record<string, unknown> = { ok: r.ok };
          if (r.skipped !== undefined) clean.skipped = r.skipped;
          if (r.error !== undefined) clean.error = r.error;
          if (r.ambiguous !== undefined) clean.ambiguous = r.ambiguous;
          if (r.claimStatus !== undefined) clean.claimStatus = r.claimStatus;
          await db.collection('distribuciones').add({
            slug: p.slug,
            titulo: noticia.titulo,
            canales: [canal],
            resultados: { [canal]: clean },
            fecha: ahora.toISOString(),
            origen: 'retry',
          });
        }
      }

      const quedanFallos = Object.values(detalle).some((v) => String(v).startsWith('fallo'));
      const requiereVerificacion = Object.values(detalle).some((v) => v === 'requiere_verificacion');
      const estado = requiereVerificacion ? 'requiere_verificacion' : quedanFallos ? 'procesado_con_fallos' : 'procesado';
      await docSnap.ref.update({
        reintentos: reintentos + 1,
        estado,
        ultimoIntento: detalle,
        resueltoAt: ahora.toISOString(),
        proximoIntento: TERMINAL_RETRY_AT,
      });
      resultados.push({ slug: p.slug, estado, detalle });
    }

    await recordCronHeartbeat('/api/cron/distribuciones-retry', { durationMs: Date.now() - startedAt });
    return NextResponse.json({ success: true, procesados: resultados.length, resultados });
  } catch (e) {
    logger.error('[cron/distribuciones-retry]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
