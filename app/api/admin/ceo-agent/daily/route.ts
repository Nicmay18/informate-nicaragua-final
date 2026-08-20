import { NextResponse } from 'next/server';
import { isAdminRequest, unauthorized } from '@/lib/auth';
import { getNews } from '@/lib/data';
import { getAdminDb } from '@/lib/firebase-admin';
import { getTrafficPerformance } from '@/lib/analytics/traffic-reader';
import { getCEODailyBrief, type TrafficEvidence } from '@/lib/ceo-agent';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  try {
    const db = getAdminDb();
    const [articles, trafficPerformance] = await Promise.all([
      getNews(100),
      getTrafficPerformance(db, 7, 50),
    ]);

    const trafficBySlug: TrafficEvidence[] = trafficPerformance.articles.map(a => ({
      viewsRecent: a.views,
      source: trafficPerformance.source === 'traffic_log_fallback' ? 'traffic_log' : 'traffic_daily',
      status: 'REAL',
    }));

    const brief = getCEODailyBrief({ articles, traffic: trafficBySlug });

    return NextResponse.json({
      actions: brief,
      dataStatus: {
        trafficSource: trafficPerformance.source,
        articleCount: articles.length,
        trafficArticles: trafficBySlug.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
