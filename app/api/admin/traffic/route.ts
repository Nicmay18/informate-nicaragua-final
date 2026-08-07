import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getTrafficForDate } from '@/lib/analytics/traffic-reader';

export const revalidate = 0;

function verificarAuth(request: NextRequest): boolean {
  return verifyAdminOrCronToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const today = new Date().toISOString().split('T')[0];
    const read = await getTrafficForDate(db, today, 10);

    const topPaginas = read.articles.map((a) => ({
      slug: a.slug,
      titulo: a.slug,
      vistas: a.views,
    }));

    const sources: Record<string, number> = {};
    for (const article of read.articles) {
      for (const [source, views] of Object.entries(article.sources)) {
        sources[source] = (sources[source] || 0) + views;
      }
    }

    const stats = {
      vistas24h: read.views,
      fuentes: sources,
      topPaginas,
      ultimosEventos: [],
      source: read.source,
      migrationHealth: read.migrationHealth,
    };

    return NextResponse.json({
      ok: true,
      stats,
    }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' }
    });
  } catch (error) {
    console.error('[API Traffic] Error:', error);
    return NextResponse.json({ error: 'Error al obtener tráfico' }, { status: 500 });
  }
}
