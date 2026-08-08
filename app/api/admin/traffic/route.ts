import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getTrafficForDate } from '@/lib/analytics/traffic-reader';
import { logger } from '@/lib/logger';

export const revalidate = 0;

function verificarAuth(request: NextRequest): boolean {
  return verifyAdminOrCronToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const today = new Date().toISOString().split('T')[0];
    const read = await getTrafficForDate(db, today, 10);
    logger.error('[admin/traffic] getTrafficForDate', { today, articleCount: read.articles.length, views: read.views, source: read.source });

    // Buscar títulos reales para los artículos top
    const topSlugs = read.articles.map((a) => a.slug);
    const titleMap = new Map<string, string>();
    if (topSlugs.length > 0) {
      const noticiasSnap = await db
        .collection('noticias')
        .where('slug', 'in', topSlugs)
        .get();
      for (const doc of noticiasSnap.docs) {
        const data = doc.data();
        if (data.slug) titleMap.set(data.slug, data.titulo || data.title || data.slug);
      }
    }

    const topPaginas = read.articles.map((a) => ({
      slug: a.slug,
      titulo: titleMap.get(a.slug) || a.slug,
      vistas: a.views,
    }));

    const sources: Record<string, number> = {};
    for (const article of read.articles) {
      for (const [source, views] of Object.entries(article.sources)) {
        sources[source] = (sources[source] || 0) + views;
      }
    }

    // Últimas visitas registradas en traffic_log (últimas 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSnap = await db
      .collection('traffic_log')
      .where('timestamp', '>=', since)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const ultimosEventos = recentSnap.docs.map((d) => {
      const data = d.data();
      return {
        slug: data.slug || '',
        titulo: data.titulo || data.slug || '',
        source: data.source || 'directo',
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp || new Date().toISOString(),
      };
    });

    const stats = {
      vistas24h: read.views,
      fuentes: sources,
      topPaginas,
      ultimosEventos,
      source: read.source,
      migrationHealth: read.migrationHealth,
    };

    logger.error('[admin/traffic] response', { vistas24h: stats.vistas24h, topN: topPaginas.length, eventN: ultimosEventos.length, source: stats.source });

    return NextResponse.json({
      ok: true,
      stats,
    }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[admin/traffic] exception', { error: msg });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
