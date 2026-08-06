/**
 * NIOS Intelligence Platform — FASE 3.2: Category Intelligence
 * =============================================================
 * Análisis por categoría basado únicamente en datos reales.
 *
 * Muestra por categoría:
 * - Tráfico Google (impresiones, clics, CTR, posición)
 * - Tráfico social (GA4 sources no-Google)
 * - Engagement (tiempo promedio, tasa)
 * - RPM potencial (alto/medio/bajo según volumen y calidad)
 * - Trust Score promedio
 * - Oportunidad (aumentar/mantener/limitar)
 *
 * Responde: ¿Qué categorías aumentar? ¿Cuáles limitar?
 * No usa opiniones. Solo datos.
 */

import type {
  ArticleFusion,
  GSCSnapshot,
  GA4Snapshot,
  GoogleTrustReport,
  CategoryIntelligenceRow,
  CategoryIntelligenceReport,
  NIOSEvidence,
} from './types';

function makeEvidence(
  source: NIOSEvidence['source'],
  api: string,
  metric: string,
  value: string | number,
  comparison?: string,
): NIOSEvidence {
  return {
    source,
    api,
    dateRange: 'Últimos 28 días',
    metric,
    value,
    comparison,
    collectedAt: new Date().toISOString(),
  };
}

/**
 * Calcula el porcentaje de tráfico social vs Google por categoría.
 */
function estimateSocialTraffic(
  categoria: string,
  articles: ArticleFusion[],
  ga4: GA4Snapshot | null,
): { socialPct: number; engagementTime: number } {
  if (!ga4) return { socialPct: 0, engagementTime: 0 };

  const catArticles = articles.filter(a => a.categoria === categoria);
  const totalEngagement = catArticles.reduce((s, a) => s + a.ga4AvgEngagementTimeSec, 0);
  const avgEngagement = catArticles.length > 0 ? Math.round(totalEngagement / catArticles.length) : 0;

  // Tráfico social = usuarios de GA4 que no vienen de Google
  const googleUsers = ga4.sources.find(s => s.source.toLowerCase().includes('google'))?.users || 0;
  const totalGa4Users = ga4.totalUsers || 1;
  const nonGooglePct = ((totalGa4Users - googleUsers) / totalGa4Users) * 100;

  return {
    socialPct: Math.round(Math.max(0, nonGooglePct)),
    engagementTime: avgEngagement,
  };
}

/**
 * Determina RPM potencial basado en volumen de tráfico y calidad editorial.
 */
function assessRpmPotential(
  impressions: number,
  avgMeni: number,
  avgTrust: number,
): 'alto' | 'medio' | 'bajo' {
  if (impressions >= 5000 && avgMeni >= 75 && avgTrust >= 60) return 'alto';
  if (impressions >= 1000 && avgMeni >= 60) return 'medio';
  return 'bajo';
}

/**
 * Genera el reporte de inteligencia por categorías.
 */
export function generateCategoryIntelligence(
  articles: ArticleFusion[],
  _gsc: GSCSnapshot | null,
  ga4: GA4Snapshot | null,
  trust: GoogleTrustReport | null,
): CategoryIntelligenceReport {
  const now = new Date().toISOString();

  if (articles.length === 0) {
    return {
      generatedAt: now,
      categories: [],
      increaseCategories: [],
      limitCategories: [],
      summary: 'Datos insuficientes para evaluar categorías. Ejecutar el pipeline de recolección primero.',
    };
  }

  // Agrupar por categoría
  const byCategory = new Map<string, ArticleFusion[]>();
  for (const a of articles) {
    const list = byCategory.get(a.categoria) || [];
    list.push(a);
    byCategory.set(a.categoria, list);
  }

  // Total de impresiones para porcentajes
  const totalImpressions = articles.reduce((s, a) => s + a.gscImpressions, 0) || 1;

  // Trust map
  const trustMap = new Map<string, number>();
  if (trust) {
    for (const a of trust.articles) {
      trustMap.set(a.slug, a.googleTrustScore);
    }
  }

  const categories: CategoryIntelligenceRow[] = [];

  for (const [categoria, list] of byCategory.entries()) {
    const catImpressions = list.reduce((s, a) => s + a.gscImpressions, 0);
    const catClicks = list.reduce((s, a) => s + a.gscClicks, 0);
    const impressionsForPosition = catImpressions || 1;
    const avgPosition = list.reduce((s, a) => s + a.gscPosition * a.gscImpressions, 0) / impressionsForPosition;
    const avgCtr = catImpressions > 0 ? Number(((catClicks / catImpressions) * 100).toFixed(2)) : 0;
    const avgMeni = list.length > 0 ? Math.round(list.reduce((s, a) => s + a.scoreMeni, 0) / list.length) : 0;
    const avgTrust = list.length > 0
      ? Math.round(list.reduce((s, a) => s + (trustMap.get(a.slug) || 0), 0) / list.length)
      : 0;

    const { socialPct, engagementTime } = estimateSocialTraffic(categoria, list, ga4);
    const googleTrafficPct = Math.round((catImpressions / totalImpressions) * 100);
    const rpmPotential = assessRpmPotential(catImpressions, avgMeni, avgTrust);

    // Decisión: aumentar, mantener o limitar
    let opportunity: 'aumentar' | 'mantener' | 'limitar' = 'mantener';
    let reasoning = '';

    if (catImpressions >= 1000 && avgCtr >= 2 && avgPosition <= 10) {
      opportunity = 'aumentar';
      reasoning = `Google posiciona bien esta categoría (posición ${avgPosition.toFixed(1)}, CTR ${avgCtr}%). ${catImpressions.toLocaleString()} impresiones. Aumentar producción de contenido de calidad aquí.`;
    } else if (catImpressions >= 500 && avgCtr < 1.5 && avgPosition > 8) {
      opportunity = 'aumentar';
      reasoning = `Hay demanda (${catImpressions.toLocaleString()} impresiones) pero CTR bajo (${avgCtr}%) y posición ${avgPosition.toFixed(1)}. Optimizar existentes primero, luego producir más.`;
    } else if (catImpressions === 0 && list.length >= 5) {
      opportunity = 'limitar';
      reasoning = `${list.length} artículos pero 0 impresiones en Google. Limitar nueva producción hasta resolver problemas de SEO/visibilidad.`;
    } else if (catImpressions < 100 && list.length >= 10) {
      opportunity = 'limitar';
      reasoning = `Muchos artículos (${list.length}) pero poca visibilidad (${catImpressions} impresiones). Limitar producción y revisar calidad.`;
    } else if (catImpressions > 0) {
      opportunity = 'mantener';
      reasoning = `Visibilidad moderada (${catImpressions.toLocaleString()} impresiones). Mantener ritmo actual. Optimizar antes de expandir.`;
    } else {
      opportunity = 'mantener';
      reasoning = 'Sin datos suficientes de Google. Mantener y observar.';
    }

    const evidence: NIOSEvidence[] = [
      makeEvidence('Google Search Console', 'searchanalytics.query', `Impresiones en ${categoria}`, catImpressions),
      makeEvidence('Google Search Console', 'searchanalytics.query', `CTR en ${categoria}`, `${avgCtr}%`),
      makeEvidence('MENI', 'scoreMeni', `MENI promedio en ${categoria}`, avgMeni),
    ];

    if (trust) {
      evidence.push(
        makeEvidence('Firestore', 'google-trust', `Trust Score promedio en ${categoria}`, avgTrust),
      );
    }

    categories.push({
      categoria,
      articleCount: list.length,
      googleImpressions: catImpressions,
      googleClicks: catClicks,
      avgCtr,
      avgPosition: Number(avgPosition.toFixed(1)),
      googleTrafficPct,
      socialTrafficPct: socialPct,
      avgEngagementTimeSec: engagementTime,
      avgMeniScore: avgMeni,
      avgTrustScore: avgTrust,
      rpmPotential,
      opportunity,
      reasoning,
      evidence,
    });
  }

  // Ordenar por impresiones descendente
  categories.sort((a, b) => b.googleImpressions - a.googleImpressions);

  const increaseCategories = categories.filter(c => c.opportunity === 'aumentar');
  const limitCategories = categories.filter(c => c.opportunity === 'limitar');

  const summary =
    categories.length > 0
      ? `${categories.length} categorías analizadas. Aumentar: ${increaseCategories.map(c => c.categoria).join(', ') || 'ninguna'}. Limitar: ${limitCategories.map(c => c.categoria).join(', ') || 'ninguna'}. Mayor tráfico Google: ${categories[0].categoria} (${categories[0].googleImpressions.toLocaleString()} impresiones).`
      : 'Sin datos suficientes para analizar categorías.';

  return {
    generatedAt: now,
    categories,
    increaseCategories,
    limitCategories,
    summary,
  };
}
