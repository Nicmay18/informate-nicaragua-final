import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { runResearch } from '@/lib/research';
import { logger } from '@/lib/logger';

export const maxDuration = 30;

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { titulo, resumen, contenido, categoria, existingArticleId } = body;

    if (!titulo || !contenido) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, contenido' },
        { status: 400 }
      );
    }

    let existingArticle: { id: string; titulo: string; contenido: string; fecha: string } | undefined;

    if (existingArticleId) {
      try {
        const db = getAdminDb();
        const snap = await db.collection('noticias').doc(existingArticleId).get();
        if (snap.exists) {
          const data = snap.data()!;
          existingArticle = {
            id: existingArticleId,
            titulo: data.titulo || '',
            contenido: data.contenido || '',
            fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || new Date().toISOString(),
          };
        }
      } catch {
        // continue without existing article
      }
    }

    const result = await runResearch(
      { titulo, resumen, contenido, categoria, existingArticle },
      { db: getAdminDb() }
    );

    return NextResponse.json({ success: true, research: result });
  } catch (error) {
    logger.error('[research] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
