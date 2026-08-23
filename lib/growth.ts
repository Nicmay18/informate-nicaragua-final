import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { aggregateTrafficFromLog } from '@/lib/analytics/traffic-aggregator';

export interface GrowthMetrics {
  totalNews: number;
  totalViews: number;
  avgViews: number;
  missingViews: number;
  mostRead: { slug: string; titulo: string; vistas?: number } | null;
  topArticles: { slug: string; titulo: string; vistas?: number }[];
  trafficSources: Record<string, number>;
  recentVisits: number;
  errors: string[];
}

async function safeGetNewsData(): Promise<{
  docs: { slug: string; titulo: string; vistas?: number }[];
  error?: string;
}> {
  try {
    const snap = await adminDb
      .collection('noticias')
      .select('vistas', 'titulo', 'slug')
      .limit(2000)
      .get();

    return {
      docs: snap.docs
        .map((d) => {
          const data = d.data();
          return {
            slug: (data.slug as string) || '',
            titulo: (data.titulo as string) || 'Sin título',
            vistas: typeof data.vistas === 'number' ? data.vistas : undefined,
          };
        })
        .filter((n) => n.slug && n.titulo),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[growth] No se pudo leer noticias:', msg);
    return { docs: [], error: msg };
  }
}

async function safeGetTrafficMetrics(): Promise<{
  recentVisits: number;
  sources: Record<string, number>;
  error?: string;
}> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const today = new Date().toISOString().split('T')[0];
  let recentVisits = 0;
  let sources: Record<string, number> = {};
  let error: string | undefined;

  try {
    const countSnap = await adminDb
      .collection('traffic_log')
      .where('timestamp', '>', dayAgo)
      .count()
      .get();
    recentVisits = countSnap.data().count;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    logger.warn('[growth] count() de traffic_log falló:', error);
    recentVisits = 0;
  }

  try {
    const fallback = await aggregateTrafficFromLog(adminDb, today);
    for (const s of Object.values(fallback)) {
      for (const [k, v] of Object.entries(s.sources || {})) {
        if (typeof v === 'number') {
          sources[k] = (sources[k] || 0) + v;
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('[growth] No se pudieron agregar fuentes de tráfico:', msg);
    if (!error) error = msg;
    sources = {};
  }

  return { recentVisits, sources, error };
}

export async function getGrowthMetrics(): Promise<GrowthMetrics> {
  const errors: string[] = [];

  const [newsData, traffic] = await Promise.all([
    safeGetNewsData(),
    safeGetTrafficMetrics(),
  ]);

  if (newsData.error) errors.push(`noticias: ${newsData.error}`);
  if (traffic.error) errors.push(`traffic_log: ${traffic.error}`);

  const docs = newsData.docs;
  const totalNews = docs.length;
  const withViews = docs.filter((n) => typeof n.vistas === 'number');
  const totalViews = withViews.reduce((acc, n) => acc + (n.vistas as number), 0);
  const missingViews = totalNews - withViews.length;
  const avgViews = withViews.length > 0 ? Math.round(totalViews / withViews.length) : 0;

  const sortedByViews = [...withViews].sort((a, b) => (b.vistas as number) - (a.vistas as number));
  const mostRead = sortedByViews[0] || null;
  const topArticles = sortedByViews.slice(0, 10);

  return {
    totalNews,
    totalViews,
    avgViews,
    missingViews,
    mostRead,
    topArticles,
    trafficSources: traffic.sources,
    recentVisits: traffic.recentVisits,
    errors,
  };
}
