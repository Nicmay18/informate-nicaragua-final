import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { notifyGoogleBulk } from '@/lib/google-indexing';
import { logger } from '@/lib/logger';

const API_SECRET = process.env.ADMIN_SECRET_KEY || 'mi-secreto-super-seguro-123';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    if (!secret || secret !== API_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = getAdminDb();
    const snap = await db
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(500)
      .get();

    const slugs = snap.docs
      .map(d => d.data().slug)
      .filter(Boolean) as string[];

    const uniqueSlugs = [...new Set(slugs)];
    const urls = uniqueSlugs.map(slug => `https://nicaraguainformate.com/noticias/${slug}`);

    // Limitar a 200 (cuota diaria de Indexing API)
    const limitedUrls = urls.slice(0, 200);

    logger.info(`[reindexar-google] Enviando ${limitedUrls.length} URLs a Google Indexing API...`);
    const result = await notifyGoogleBulk(limitedUrls);

    return NextResponse.json({
      ok: true,
      total: uniqueSlugs.length,
      enviadas: limitedUrls.length,
      exitosas: result.sent,
      fallidas: result.failed,
    });
  } catch (err: any) {
    logger.error('[reindexar-google] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
