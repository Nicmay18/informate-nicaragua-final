/**
 * NIOS Intelligence Platform — FASE 3.1: Content Opportunity Engine
 * =================================================================
 * Detecta oportunidades reales basándose en Google Search Console.
 *
 * Analiza:
 * - Consultas con muchas impresiones y pocos clics (CTR bajo)
 * - Posiciones 5-20 (segunda página de Google, alta oportunidad)
 * - Keywords con potencial de crecimiento
 * - Consultas con impresiones pero cero clics
 *
 * No inventa tendencias. Solo recomienda basándose en datos reales de GSC.
 */

import type {
  ArticleFusion,
  GSCSnapshot,
  GSCQueryRow,
  QueryOpportunity,
  ContentOpportunityReport,
  NIOSEvidence,
} from './types';

const MIN_IMPRESSIONS_FOR_OPPORTUNITY = 100;
const LOW_CTR_THRESHOLD = 2;
const POSITION_OPPORTUNITY_MIN = 5;
const POSITION_OPPORTUNITY_MAX = 20;

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
 * Clasifica una consulta de GSC como oportunidad.
 * Retorna null si no es oportunidad.
 */
function classifyQuery(
  query: GSCQueryRow,
  articles: ArticleFusion[],
): QueryOpportunity | null {
  const { impressions, clicks, ctr, position, query: keyword } = query;

  // Necesita impresiones suficientes para ser significativo
  if (impressions < MIN_IMPRESSIONS_FOR_OPPORTUNITY) return null;

  // Buscar artículo relacionado por keyword en tags o título
  const related = articles.find(
    a =>
      a.titulo.toLowerCase().includes(keyword.toLowerCase()) ||
      a.gscTopQueries.some(q => q.query === keyword),
  );

  const relatedSlug = related?.slug || null;
  const relatedTitle = related?.titulo || null;

  const evidence: NIOSEvidence[] = [
    makeEvidence(
      'Google Search Console',
      'searchanalytics.query',
      `Impresiones de "${keyword}"`,
      impressions,
    ),
    makeEvidence(
      'Google Search Console',
      'searchanalytics.query',
      `CTR de "${keyword}"`,
      `${ctr}%`,
    ),
    makeEvidence(
      'Google Search Console',
      'searchanalytics.query',
      `Posición de "${keyword}"`,
      position.toFixed(1),
    ),
  ];

  // 1. Impresiones significativas pero cero clics (máxima prioridad)
  if (impressions >= 200 && clicks === 0) {
    return {
      query: keyword,
      impressions,
      clicks,
      ctr,
      position,
      opportunityType: 'zero_clicks',
      recommendation: `"${keyword}" recibe ${impressions.toLocaleString()} impresiones pero 0 clics. Revisar título, snippet y intención de búsqueda urgentemente.`,
      relatedArticleSlug: relatedSlug,
      relatedArticleTitle: relatedTitle,
      evidence,
    };
  }

  // 2. CTR bajo con muchas impresiones
  if (impressions >= 500 && ctr < LOW_CTR_THRESHOLD && clicks < impressions * 0.02) {
    return {
      query: keyword,
      impressions,
      clicks,
      ctr,
      position,
      opportunityType: 'low_ctr_high_impressions',
      recommendation: `Optimizar título y meta description. La consulta "${keyword}" tiene ${impressions.toLocaleString()} impresiones pero solo ${clicks} clics (CTR ${ctr}%). Pequeña mejora puede multiplicar el tráfico.`,
      relatedArticleSlug: relatedSlug,
      relatedArticleTitle: relatedTitle,
      evidence,
    };
  }

  // 3. Posición 5-20 (segunda página, alta oportunidad)
  if (
    position >= POSITION_OPPORTUNITY_MIN &&
    position <= POSITION_OPPORTUNITY_MAX &&
    impressions >= 200
  ) {
    return {
      query: keyword,
      impressions,
      clicks,
      ctr,
      position,
      opportunityType: 'position_5_to_20',
      recommendation: `Mejorar SEO on-page para "${keyword}". Posición actual ${position.toFixed(1)} con ${impressions.toLocaleString()} impresiones. Llegar al top 5 multiplicaría los clics.`,
      relatedArticleSlug: relatedSlug,
      relatedArticleTitle: relatedTitle,
      evidence,
    };
  }

  // 3. Impresiones significativas pero cero clics
  if (impressions >= 200 && clicks === 0) {
    return {
      query: keyword,
      impressions,
      clicks,
      ctr,
      position,
      opportunityType: 'zero_clicks',
      recommendation: `"${keyword}" recibe ${impressions.toLocaleString()} impresiones pero 0 clics. Revisar título, snippet y intención de búsqueda urgentemente.`,
      relatedArticleSlug: relatedSlug,
      relatedArticleTitle: relatedTitle,
      evidence,
    };
  }

  return null;
}

/**
 * Genera el reporte de oportunidades de contenido.
 */
export function generateContentOpportunityReport(
  articles: ArticleFusion[],
  gsc: GSCSnapshot | null,
): ContentOpportunityReport {
  const now = new Date().toISOString();

  if (!gsc || articles.length === 0) {
    return {
      generatedAt: now,
      totalQueries: 0,
      opportunities: [],
      topOpportunities: [],
      summary: 'Datos insuficientes para evaluar oportunidades. Ejecutar el pipeline de recolección primero.',
    };
  }

  const allQueries = gsc.queries || [];
  const opportunities: QueryOpportunity[] = [];

  for (const query of allQueries) {
    const opp = classifyQuery(query, articles);
    if (opp) opportunities.push(opp);
  }

  // Ordenar por impacto potencial (impresiones * (1 - ctr/100))
  const sorted = [...opportunities].sort(
    (a, b) => b.impressions * (1 - b.ctr / 100) - a.impressions * (1 - a.ctr / 100),
  );

  const topOpportunities = sorted.slice(0, 30);

  const summary =
    opportunities.length > 0
      ? `${opportunities.length} oportunidades detectadas en Google Search Console. ${opportunities.filter(o => o.opportunityType === 'low_ctr_high_impressions').length} con CTR bajo y alta demanda. ${opportunities.filter(o => o.opportunityType === 'position_5_to_20').length} en zona de mejora de posición (5-20). Top oportunidad: "${topOpportunities[0].query}" (${topOpportunities[0].impressions.toLocaleString()} impresiones).`
      : 'No se detectaron oportunidades significativas en los datos actuales de Google Search Console.';

  return {
    generatedAt: now,
    totalQueries: allQueries.length,
    opportunities: sorted,
    topOpportunities,
    summary,
  };
}
