import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { applyTechnicalMutation } from '@/lib/editorial/mutation-policy';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { enviarTelegram, enviarFacebook, enviarIndexNow, enviarPush, enviarTwitter, yaDistribuido, type Noticia } from '@/lib/distribution/channels';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function verificarAuth(request: NextRequest): boolean {
  return verifyAdminOrCronToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function POST(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, canales = ['telegram', 'indexnow', 'push', 'twitter', 'facebook'] } = body;

    if (!slug) {
      return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
    }

    const db = getAdminDb();
    const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
    if (snap.empty) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    const noticia = snap.docs[0].data() as Noticia;
    const resultados: Record<string, { ok: boolean; skipped?: boolean; error?: string }> = {};

    const promises: Promise<void>[] = [];

    if (canales.includes('telegram')) {
      if (await yaDistribuido(db, slug, 'telegram')) {
        resultados.telegram = { ok: true, skipped: true };
      } else {
        promises.push(
          enviarTelegram(noticia, db).then(r => { resultados.telegram = r; })
        );
      }
    }
    if (canales.includes('facebook')) {
      if (await yaDistribuido(db, slug, 'facebook')) {
        resultados.facebook = { ok: true, skipped: true };
      } else {
        promises.push(
          enviarFacebook(noticia).then(r => { resultados.facebook = r; })
        );
      }
    }
    if (canales.includes('indexnow')) {
      if (await yaDistribuido(db, slug, 'indexnow')) {
        resultados.indexnow = { ok: true, skipped: true };
      } else {
        promises.push(
          enviarIndexNow(noticia).then(r => { resultados.indexnow = r; })
        );
      }
    }
    if (canales.includes('push')) {
      if (await yaDistribuido(db, slug, 'push')) {
        resultados.push = { ok: true, skipped: true };
      } else {
        promises.push(
          enviarPush(noticia).then(r => { resultados.push = r; })
        );
      }
    }

    if (canales.includes('twitter')) {
      if (await yaDistribuido(db, slug, 'twitter')) {
        resultados.twitter = { ok: true, skipped: true };
      } else {
        promises.push(
          enviarTwitter(noticia).then(r => { resultados.twitter = r; })
        );
      }
    }

    await Promise.all(promises);

    // Guardar registro de distribución
    await db.collection('distribuciones').add({
      slug,
      titulo: noticia.titulo,
      canales,
      resultados,
      fecha: new Date().toISOString(),
    });

    // Cola de reintentos para canales fallidos
    const fallidos = Object.entries(resultados).filter(([, r]) => !r.ok && !r.skipped);
    if (fallidos.length > 0) {
      await db.collection('distribuciones_pendientes').doc(slug).set({
        slug,
        canalesFallidos: fallidos.map(([k]) => k),
        reintentos: 0,
        proximoIntento: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        fecha: new Date().toISOString(),
      });
    }

    // Marcar noticia como distribuida
    await applyTechnicalMutation(
      db,
      snap.docs[0].id,
      { distribuida: true, fechaDistribucion: new Date().toISOString() },
      { actor: 'distribuir', reason: 'Distribución manual completada' },
    );

    return NextResponse.json({
      success: true,
      slug,
      titulo: noticia.titulo,
      resultados,
      pendientes: fallidos.length,
    });
  } catch (err: any) {
    logger.error('[admin/distribuir]', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}

/** GET: devuelve últimas distribuciones */
export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const snap = await db.collection('distribuciones').orderBy('fecha', 'desc').limit(50).get();
    const registros = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, registros });
  } catch (err: any) {
    logger.error('[admin/distribuir] GET', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
