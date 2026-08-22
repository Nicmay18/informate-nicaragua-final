import { NextResponse } from 'next/server';
import { isAdminRequest, unauthorized } from '@/lib/auth';
import { getNews } from '@/lib/data';
import { getAdminDb } from '@/lib/firebase-admin';
import { getTrafficPerformance } from '@/lib/analytics/traffic-reader';
import { getCEODailyBrief, type TrafficEvidence } from '@/lib/ceo-agent';

function isAccessError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string }).code;
  const text = `${message} ${code || ''}`.toLowerCase();
  return (
    text.includes('unauthenticated') ||
    text.includes('permission_denied') ||
    text.includes('permission denied') ||
    text.includes('unauthorized') ||
    text.includes('401') ||
    text.includes('403') ||
    text.includes('credenciales') ||
    text.includes('credentials') ||
    text.includes('missing or insufficient permissions')
  );
}

async function probeFirestore(db: ReturnType<typeof getAdminDb>): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    await db.collection('noticias').limit(1).get();
    return { ok: true };
  } catch (err) {
    if (isAccessError(err)) {
      return { ok: false, reason: 'ACCESS_BLOCKED: Firestore no autorizó la consulta.' };
    }
    return { ok: false, reason: `ACCESS_BLOCKED: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  try {
    const db = getAdminDb();
    const probe = await probeFirestore(db);
    if (!probe.ok) {
      return NextResponse.json({ status: 'ACCESS_BLOCKED', error: probe.reason }, { status: 503 });
    }

    const [articles, trafficPerformance] = await Promise.all([
      getNews(100),
      getTrafficPerformance(db, 7, 50),
    ]);

    const trafficBySlug: Record<string, TrafficEvidence> = {};
    for (const a of trafficPerformance.articles) {
      if (a.slug && typeof a.views === 'number') {
        trafficBySlug[a.slug] = {
          viewsRecent: a.views,
          source: trafficPerformance.source === 'traffic_log_fallback' ? 'traffic_log' : 'traffic_daily',
          status: 'REAL',
        };
      }
    }

    const brief = getCEODailyBrief({ articles, traffic: trafficBySlug });

    return NextResponse.json({
      actions: brief,
      articles: articles.map(a => ({ slug: a.slug, titulo: a.titulo, categoria: a.categoria })),
      dataStatus: {
        trafficSource: trafficPerformance.source,
        articleCount: articles.length,
        trafficArticles: Object.keys(trafficBySlug).length,
        actionCount: brief.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
