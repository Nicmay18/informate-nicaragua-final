import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { runWatchCycle, persistWatchResult, determineFrequency } from '@/lib/news-watch';

export const maxDuration = 30;

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get('x-admin-token') || request.headers.get('x-admin-key');
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret && cronSecret === process.env.CRON_SECRET) return true;
  return verifyAdminOrCleanupToken(auth);
}

/**
 * POST: Ejecutar watch cycle sobre un artículo específico
 * Body: { articleId: string }
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'Falta articleId' }, { status: 400 });
    }

    const db = getAdminDb();
    const snap = await db.collection('noticias').doc(articleId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
    }

    const data = snap.data()!;
    const result = await runWatchCycle(
      {
        id: articleId,
        titulo: data.titulo || '',
        contenido: data.contenido || '',
        resumen: data.resumen || '',
        categoria: data.categoria || 'General',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || new Date().toISOString(),
        perfil: data.perfil,
      },
      { db }
    );

    await persistWatchResult(db, articleId, result);

    return NextResponse.json({ success: true, watch: result });
  } catch (error) {
    console.error('[watch] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

/**
 * GET: Cron-triggered watch cycle
 * Query: ?limit=10 (cuántos artículos revisar)
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '5', 10), 20);

    const db = getAdminDb();
    const snap = await db
      .collection('noticias')
      .where('estado', '==', 'publicado')
      .where('publicado', '==', true)
      .orderBy('fecha', 'desc')
      .limit(limit)
      .get();

    const results = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      const fecha = data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || new Date().toISOString();
      determineFrequency({ editorialTier: data.editorialTier, fecha });

      try {
        const result = await runWatchCycle(
          {
            id: doc.id,
            titulo: data.titulo || '',
            contenido: data.contenido || '',
            resumen: data.resumen || '',
            categoria: data.categoria || 'General',
            fecha,
            perfil: data.perfil,
          },
          { db }
        );
        await persistWatchResult(db, doc.id, result);
        results.push({ articleId: doc.id, hasUpdates: result.hasUpdates, updates: result.updates.length });
      } catch (err) {
        results.push({ articleId: doc.id, error: err instanceof Error ? err.message : 'Error' });
      }
    }

    return NextResponse.json({
      success: true,
      checked: results.length,
      withUpdates: results.filter(r => r.hasUpdates).length,
      results,
    });
  } catch (error) {
    console.error('[watch cron] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
