import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

export const maxDuration = 10;

function verificarAuth(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token'));
}

/**
 * Guarda la calificación del periodista sobre MENI después de publicar.
 * Body: { articleId, estrellas (1-5), razones: string[], comentario?: string }
 */
export async function POST(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { articleId, estrellas, razones, comentario } = body;

    if (!articleId || !estrellas || estrellas < 1 || estrellas > 5) {
      return NextResponse.json(
        { error: 'Faltan campos: articleId, estrellas (1-5)' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const rating = {
      articleId,
      estrellas: Math.round(estrellas),
      razones: Array.isArray(razones) ? razones : [],
      comentario: comentario || '',
      fecha: new Date().toISOString(),
    };

    await db.collection('meni_ratings').add(rating);

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    logger.error('[meni-rating] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
