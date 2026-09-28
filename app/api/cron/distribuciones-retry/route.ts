import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendTelegramArticle } from '@/lib/distribution/telegram';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Consumidor de la cola `distribuciones_pendientes`.
 *
 * La cola existía pero nadie la procesaba (cola muerta). Este cron:
 * - toma pendientes cuyo proximoIntento ya venció,
 * - reintenta SOLO canales con error recuperable (timeout/red/429/5xx),
 * - máximo 1 reintento (reintentos >= 1 → fallo definitivo),
 * - la idempotencia del sender evita duplicados si el primer intento
 *   sí llegó a Telegram pero se registró como fallo.
 */
export async function GET(request: NextRequest) {
  const secret = new URL(request.url).searchParams.get('secret');
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!verifyAdminOrCronToken(secret) && !verifyAdminOrCronToken(bearer)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const ahora = new Date().toISOString();
    const snap = await db
      .collection('distribuciones_pendientes')
      .where('proximoIntento', '<=', ahora)
      .limit(20)
      .get();

    const resultados: Array<{ slug: string; canal: string; estado: string }> = [];

    for (const doc of snap.docs) {
      const p = doc.data();
      const reintentos = typeof p.reintentos === 'number' ? p.reintentos : 0;

      if (reintentos >= 1) {
        // Fallo definitivo: marcar y salir de la cola de procesamiento.
        await doc.ref.update({ estado: 'fallo_definitivo', resueltoAt: ahora });
        resultados.push({ slug: p.slug, canal: (p.canalesFallidos || []).join(','), estado: 'fallo_definitivo' });
        continue;
      }

      const noticiaSnap = await db.collection('noticias').where('slug', '==', p.slug).limit(1).get();
      if (noticiaSnap.empty) {
        await doc.ref.update({ estado: 'fallo_definitivo', motivo: 'noticia_no_existe', resueltoAt: ahora });
        resultados.push({ slug: p.slug, canal: '-', estado: 'noticia_no_existe' });
        continue;
      }
      const n = noticiaSnap.docs[0].data();

      for (const canal of p.canalesFallidos || []) {
        if (canal !== 'telegram') {
          // Solo Telegram tiene sender unificado con retryable; otros canales
          // quedan como fallo definitivo para no reintentar a ciegas.
          resultados.push({ slug: p.slug, canal, estado: 'no_retryable_channel' });
          continue;
        }
        const r = await sendTelegramArticle(
          {
            slug: n.slug,
            titulo: n.titulo,
            resumen: n.resumen,
            metaDescription: n.metaDescription || n.metaDescripcion,
            contenido: n.contenido,
            categoria: n.categoria,
            imagen: n.imagen,
            imagenRedes: n.imagenRedes,
          },
          { db, forceRetry: true },
        );
        resultados.push({
          slug: p.slug,
          canal,
          estado: r.ok ? (r.skipped ? 'ya_enviado' : 'reenviado') : `fallo:${r.errorCode || 'desconocido'}`,
        });
      }

      await doc.ref.update({
        reintentos: reintentos + 1,
        estado: 'procesado',
        resueltoAt: ahora,
      });
    }

    return NextResponse.json({ success: true, procesados: resultados.length, resultados });
  } catch (e) {
    logger.error('[cron/distribuciones-retry]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
