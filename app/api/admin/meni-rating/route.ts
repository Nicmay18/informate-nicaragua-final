import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const maxDuration = 10;

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  if (!validToken) return false;
  return token === validToken;
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
    console.error('[meni-rating] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
