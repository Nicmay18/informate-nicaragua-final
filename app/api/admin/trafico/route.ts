import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getTrafficForDate } from '@/lib/analytics/traffic-reader';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token'));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const hours = Math.max(1, Math.min(48, parseInt(searchParams.get('horas') || '24', 10) || 24));
    const topN = Math.max(1, Math.min(100, parseInt(searchParams.get('top') || '10', 10) || 10));

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0];
    const traffic = await getTrafficForDate(db, today, topN);

    // Si traffic_daily está vacío, getTrafficForDate ya hace fallback a traffic_log.
    // Sumamos fuentes de los artículos top.
    const sources: Record<string, number> = {};
    for (const a of traffic.articles) {
      for (const [k, v] of Object.entries(a.sources || {})) {
        sources[k] = (sources[k] || 0) + (typeof v === 'number' ? v : 0);
      }
    }

    // Últimas visitas registradas en traffic_log
    const recentSnap = await db
      .collection('traffic_log')
      .where('timestamp', '>=', since)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const recent = recentSnap.docs.map((d) => {
      const data = d.data();
      return {
        slug: data.slug || '',
        titulo: data.titulo || '',
        source: data.source || 'directo',
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp || new Date().toISOString(),
      };
    });

    const topArticles = traffic.articles.slice(0, topN).map((a) => ({
      slug: a.slug,
      views: a.views,
      sources: a.sources,
    }));

    return NextResponse.json({
      success: true,
      total: traffic.views24h,
      sources,
      topArticles,
      recent,
      hours,
      generatedAt: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' },
    });
  } catch (err) {
    logger.error('[admin/trafico] error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
