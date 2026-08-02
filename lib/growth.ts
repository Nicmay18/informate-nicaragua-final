import { adminDb } from '@/lib/firebase-admin';

export interface GrowthMetrics {
  totalNews: number;
  totalViews: number;
  topArticles: { slug: string; titulo: string; vistas: number }[];
  trafficSources: Record<string, number>;
  recentVisits: number;
  avgReadTime?: number;
}

export async function getGrowthMetrics(): Promise<GrowthMetrics> {
  try {
    const [newsSnap, trafficSnap] = await Promise.all([
      adminDb.collection('noticias').orderBy('vistas', 'desc').limit(10).get(),
      adminDb.collection('traffic_log').orderBy('timestamp', 'desc').limit(100).get(),
    ]);

    const topArticles = newsSnap.docs
      .filter((d) => d.data()?.vistas > 0)
      .map((d) => ({
        slug: d.data().slug,
        titulo: d.data().titulo,
        vistas: d.data().vistas,
      }));

    const totalNews = newsSnap.size;
    const totalViews = topArticles.reduce((acc, a) => acc + (a.vistas || 0), 0);

    const sources: Record<string, number> = {};
    trafficSnap.docs.forEach((d) => {
      const s = d.data().source || 'directo';
      sources[s] = (sources[s] || 0) + 1;
    });

    return {
      totalNews,
      totalViews,
      topArticles,
      trafficSources: sources,
      recentVisits: trafficSnap.size,
    };
  } catch (err) {
    return {
      totalNews: 0,
      totalViews: 0,
      topArticles: [],
      trafficSources: {},
      recentVisits: 0,
    };
  }
}
