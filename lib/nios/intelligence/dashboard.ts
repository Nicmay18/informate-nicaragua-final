/**
 * NIOS Intelligence Platform — Dashboard Builder (Módulo 5)
 * ==========================================================
 * Construye el dashboard "Google Intelligence" respondiendo:
 * - ¿Cuáles son las 20 notas con más impresiones?
 * - ¿Cuáles tienen mejor CTR?
 * - ¿Cuáles tienen CTR malo?
 * - ¿Qué categorías crecen?
 * - ¿Qué categoría cayó?
 * - ¿Qué consulta genera más tráfico?
 * - ¿Qué noticia perdió posiciones?
 * - ¿Qué noticia ganó posiciones?
 * - ¿Qué URLs nunca reciben impresiones?
 * - ¿Qué URLs Google ignora?
 */

import type {
  ArticleFusion,
  GoogleIntelligenceDashboard,
  GSCSnapshot,
  GA4Snapshot,
  NIOSRecommendation,
  GSCQueryRow,
} from './types';

/**
 * Construye el dashboard de Google Intelligence.
 */
export function buildGoogleIntelligenceDashboard(
  articles: ArticleFusion[],
  gsc: GSCSnapshot | null,
  ga4: GA4Snapshot | null,
  recommendations: NIOSRecommendation[],
): GoogleIntelligenceDashboard {
  const now = new Date().toISOString();

  if (!gsc || gsc.totalImpressions === 0) {
    return {
      generatedAt: now,
      dateRange: gsc?.dateRange || { start: 'N/A', end: 'N/A' },
      hasData: false,
      totalImpressions: 0,
      totalClicks: 0,
      avgCtr: 0,
      avgPosition: 0,
      totalUsers: ga4?.totalUsers || 0,
      totalSessions: ga4?.totalSessions || 0,
      topImpressions: [],
      topCtr: [],
      worstCtr: [],
      categoryGrowth: [],
      topQueries: [],
      positionLosers: [],
      positionGainers: [],
      zeroImpressionUrls: [],
      lowGscDataUrls: [],
      recommendations: [],
      trafficSources: ga4?.sources || [],
    };
  }

  // Top 20 por impresiones
  const topImpressions = [...articles]
    .filter(a => a.hasGscData)
    .sort((a, b) => b.gscImpressions - a.gscImpressions)
    .slice(0, 20);

  // Mejor CTR (con mínimo 100 impresiones)
  const topCtr = [...articles]
    .filter(a => a.hasGscData && a.gscImpressions >= 100)
    .sort((a, b) => b.gscCtr - a.gscCtr)
    .slice(0, 20);

  // Peor CTR (con mínimo 500 impresiones)
  const worstCtr = [...articles]
    .filter(a => a.hasGscData && a.gscImpressions >= 500)
    .sort((a, b) => a.gscCtr - b.gscCtr)
    .slice(0, 20);

  // Crecimiento por categoría
  const categoryMap = new Map<string, { impressions: number; clicks: number }>();
  for (const a of articles) {
    if (!a.hasGscData) continue;
    const existing = categoryMap.get(a.categoria) || { impressions: 0, clicks: 0 };
    existing.impressions += a.gscImpressions;
    existing.clicks += a.gscClicks;
    categoryMap.set(a.categoria, existing);
  }

  const categoryGrowth = Array.from(categoryMap.entries())
    .map(([categoria, data]) => ({
      categoria,
      impressions: data.impressions,
      clicks: data.clicks,
      trend: 'no_data' as 'up' | 'down' | 'stable' | 'no_data',
    }))
    .sort((a, b) => b.impressions - a.impressions);

  // Top queries
  const topQueries: GSCQueryRow[] = [...(gsc.queries || [])]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20);

  // URLs que nunca reciben impresiones
  const zeroImpressionUrls = articles
    .filter(a => !a.hasGscData)
    .map(a => ({ slug: a.slug, titulo: a.titulo, fecha: a.fechaPublicacion }))
    .slice(0, 50);

  // URLs con datos insuficientes de GSC (< 10 impresiones en 28 días)
  const lowGscDataUrls = articles
    .filter(a => a.hasGscData && a.gscImpressions < 10)
    .map(a => ({ slug: a.slug, titulo: a.titulo, scoreMeni: a.scoreMeni }))
    .sort((a, b) => (b.scoreMeni ?? 0) - (a.scoreMeni ?? 0))
    .slice(0, 50);

  // Notas que perdieron posiciones (posición > 20 con impresiones altas)
  const positionLosers = articles
    .filter(a => a.hasGscData && a.gscPosition > 20 && a.gscImpressions > 100)
    .map(a => ({ slug: a.slug, titulo: a.titulo, position: a.gscPosition, impressions: a.gscImpressions }))
    .sort((a, b) => b.position - a.position)
    .slice(0, 20);

  // Notas que ganaron posiciones (posición < 5 con impresiones altas)
  const positionGainers = articles
    .filter(a => a.hasGscData && a.gscPosition < 5 && a.gscImpressions > 100)
    .map(a => ({ slug: a.slug, titulo: a.titulo, position: a.gscPosition, impressions: a.gscImpressions }))
    .sort((a, b) => a.position - b.position)
    .slice(0, 20);

  return {
    generatedAt: now,
    dateRange: gsc.dateRange,
    hasData: true,
    totalImpressions: gsc.totalImpressions,
    totalClicks: gsc.totalClicks,
    avgCtr: gsc.avgCtr,
    avgPosition: gsc.avgPosition,
    totalUsers: ga4?.totalUsers || 0,
    totalSessions: ga4?.totalSessions || 0,
    topImpressions,
    topCtr,
    worstCtr,
    categoryGrowth,
    topQueries,
    positionLosers,
    positionGainers,
    zeroImpressionUrls,
    lowGscDataUrls,
    recommendations,
    trafficSources: ga4?.sources || [],
  };
}
