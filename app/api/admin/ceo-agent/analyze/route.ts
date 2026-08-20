import { NextResponse } from 'next/server';
import { isAdminRequest, unauthorized } from '@/lib/auth';
import { getNews, getNewsBySlug } from '@/lib/data';
import { getAdminDb } from '@/lib/firebase-admin';
import { getTrafficForDate } from '@/lib/analytics/traffic-reader';
import { analyzeForPublication, type TrafficEvidence } from '@/lib/ceo-agent';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function buildTrafficEvidence(
  slug: string,
  trafficResult: Awaited<ReturnType<typeof getTrafficForDate>>,
): TrafficEvidence {
  const found = trafficResult.articles.find(a => a.slug === slug);
  return {
    viewsRecent: found?.views,
    source: trafficResult.source === 'traffic_log_fallback' ? 'traffic_log' : 'traffic_daily',
    status: found ? 'REAL' : 'NO_DATA',
  };
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as { slug?: string };
    const slug = body.slug?.trim();

    if (!slug) {
      return NextResponse.json({ error: 'Se requiere slug' }, { status: 400 });
    }

    const article = await getNewsBySlug(slug);
    if (!article) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
    }

    const [allArticles, trafficResult] = await Promise.all([
      getNews(200),
      (async () => {
        const today = new Date().toISOString().split('T')[0];
        return getTrafficForDate(getAdminDb(), today, 100);
      })(),
    ]);

    const traffic = buildTrafficEvidence(slug, trafficResult);
    const result = analyzeForPublication(article, {
      articlePool: allArticles,
      traffic,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
