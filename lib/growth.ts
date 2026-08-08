import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

export interface GrowthMetrics {
  totalNews: number;
  totalViews: number;
  avgViews: number;
  mostRead: { slug: string; titulo: string; vistas: number } | null;
  topArticles: { slug: string; titulo: string; vistas: number }[];
  trafficSources: Record<string, number>;
  recentVisits: number;
  errors: string[];
}

async function safeGetNewsData(): Promise<{
  docs: { slug: string; titulo: string; vistas: number }[];
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
        .map((d) => ({
          slug: (d.data().slug as string) || '',
          titulo: (d.data().titulo as string) || 'Sin título',
          vistas: typeof d.data().vistas === 'number' ? d.data().vistas : 0,
        }))
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
    const sourceSnap = await adminDb
      .collection('traffic_log')
      .where('timestamp', '>', dayAgo)
      .select('source')
      .limit(500)
      .get();

    sourceSnap.docs.forEach((d) => {
      const s = typeof d.data().source === 'string' ? d.data().source : 'directo';
      sources[s] = (sources[s] || 0) + 1;
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('[growth] No se pudieron leer fuentes de tráfico:', msg);
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
  const totalViews = docs.reduce((acc, n) => acc + n.vistas, 0);
  const avgViews = totalNews > 0 ? Math.round(totalViews / totalNews) : 0;

  const sortedByViews = [...docs].sort((a, b) => b.vistas - a.vistas);
  const mostRead = sortedByViews[0] || null;
  const topArticles = sortedByViews.slice(0, 10);

  return {
    totalNews,
    totalViews,
    avgViews,
    mostRead,
    topArticles,
    trafficSources: traffic.sources,
    recentVisits: traffic.recentVisits,
    errors,
  };
}
