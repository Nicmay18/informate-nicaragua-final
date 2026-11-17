import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { sendTelegramArticle, resolveTelegramClaim } from '@/lib/distribution/telegram';

export async function POST(request: NextRequest) {
  const { token, via } = extractRequestSecret(request);
  if (via === 'query') {
    logger.warn(`[telegram] ${QUERY_SECRET_DEPRECATION_NOTE}`);
  }
  if (!verifyAdminOrCronToken(token)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  try {
    const body = await request.json();

    // Resolución manual de claims ambiguos ('unknown'/'sending' huérfano):
    // el operador verifica en el canal si el mensaje llegó y cierra el ciclo.
    // body: { resolve: { slug, action: 'sent'|'retry', messageId?, note? } }
    if (body?.resolve?.slug && body?.resolve?.action) {
      const db = getAdminDb();
      const res = await resolveTelegramClaim(db, String(body.resolve.slug), {
        action: body.resolve.action === 'sent' ? 'sent' : 'retry',
        messageId: typeof body.resolve.messageId === 'number' ? body.resolve.messageId : undefined,
        note: typeof body.resolve.note === 'string' ? body.resolve.note : undefined,
      });
      return NextResponse.json(res, { status: res.ok ? 200 : 409 });
    }

    const { noticia } = body;
    if (!noticia?.titulo) return NextResponse.json({ error: 'Falta título' }, { status: 400 });

    // Fail-closed: sin Firestore no hay claim de idempotencia y un envío
    // podría duplicar una publicación ya entregada por otra ruta.
    let db;
    try { db = getAdminDb(); } catch { db = undefined; }
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore no disponible: envío rechazado para no arriesgar duplicado' },
        { status: 503 },
      );
    }

    const r = await sendTelegramArticle(
      {
        slug: noticia.slug || '',
        titulo: noticia.titulo,
        resumen: noticia.resumen,
        metaDescription: noticia.metaDescription || noticia.metaDescripcion,
        contenido: noticia.contenido,
        categoria: noticia.categoria,
        imagen: noticia.imagen,
        imagenRedes: noticia.imagenRedes,
      },
      { db, forceRetry: body.retry === true },
    );

    if (!r.ok && !r.skipped) {
      return NextResponse.json({
        error: 'Telegram API error',
        details: r.error,
        errorCode: r.errorCode,
        retryable: r.retryable,
        ambiguous: r.ambiguous === true,
        claimStatus: r.claimStatus,
      }, { status: r.ambiguous ? 202 : 400 });
    }
    return NextResponse.json({ success: true, skipped: r.skipped === true, messageId: r.messageId, claimStatus: r.claimStatus });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
