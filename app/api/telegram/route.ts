import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { sendTelegramArticle } from '@/lib/distribution/telegram';

export async function POST(request: NextRequest) {
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const token =
    request.headers.get('x-admin-token') ||
    request.headers.get('x-admin-key') ||
    new URL(request.url).searchParams.get('secret');
  if (!verifyAdminOrCronToken(token) && !verifyAdminOrCronToken(bearer)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { noticia } = body;
    if (!noticia?.titulo) return NextResponse.json({ error: 'Falta título' }, { status: 400 });

    let db;
    try { db = getAdminDb(); } catch { db = undefined; }

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
      }, { status: 400 });
    }
    return NextResponse.json({ success: true, skipped: r.skipped === true, messageId: r.messageId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
