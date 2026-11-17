import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken, verifyAdminToken } from '@/lib/auth';
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
    // Validación estricta: nada se coerciona — entrada inválida = 400.
    if (body?.resolve !== undefined) {
      // Resolución de claims ambiguos = decisión humana de administrador.
      // El secreto de cron NO autoriza esta acción: solo ADMIN_API_KEY.
      if (!verifyAdminToken(token)) {
        return NextResponse.json({ error: 'Resolución requiere credencial de administrador' }, { status: 403, headers: NO_STORE_401_HEADERS });
      }
      const r = body.resolve;
      const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
      if (!r || typeof r !== 'object') return bad('resolve inválido');
      if (typeof r.slug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,199}$/i.test(r.slug)) {
        return bad('slug inválido');
      }
      if (r.action !== 'sent' && r.action !== 'retry') {
        return bad("action debe ser 'sent' o 'retry'");
      }
      if (r.messageId !== undefined && (!Number.isInteger(r.messageId) || r.messageId <= 0)) {
        return bad('messageId debe ser un entero positivo');
      }
      if (r.note !== undefined && typeof r.note !== 'string') {
        return bad('note debe ser string');
      }
      const res = await resolveTelegramClaim(getAdminDb(), r.slug, {
        action: r.action,
        messageId: r.messageId,
        note: r.note,
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
