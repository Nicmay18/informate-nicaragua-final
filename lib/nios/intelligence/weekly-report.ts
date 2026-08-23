/**
 * NIOS Intelligence Platform — FASE 2.4: NIOS Weekly Intelligence
 * ================================================================
 * Reporte semanal CEO. Responde 6 preguntas basadas en datos reales:
 *
 * 1. ¿Qué contenido está funcionando en Google?
 * 2. ¿Qué contenido Google ignora?
 * 3. ¿Qué categorías tienen oportunidad?
 * 4. ¿Qué debemos producir la próxima semana?
 * 5. ¿Qué debemos actualizar?
 * 6. ¿Qué está bloqueando AdSense?
 *
 * Regla: NO recomendar publicar más. Primero optimizar lo existente.
 */

import type {
  ArticleFusion,
  GSCSnapshot,
  NIOSRecommendation,
  CategoryOpportunity,
  ContentUpdateCandidate,
  GoogleTrustReport,
  NIOSWeeklyReport,
} from './types';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Analiza oportunidad por categoría.
 */
function analyzeCategoryOpportunities(articles: ArticleFusion[]): CategoryOpportunity[] {
  const byCategory = new Map<string, ArticleFusion[]>();

  for (const a of articles) {
    const list = byCategory.get(a.categoria) || [];
    list.push(a);
    byCategory.set(a.categoria, list);
  }

  const results: CategoryOpportunity[] = [];

  for (const [categoria, list] of byCategory.entries()) {
    const totalImpressions = list.reduce((s, a) => s + a.gscImpressions, 0);
    const totalClicks = list.reduce((s, a) => s + a.gscClicks, 0);
    const totalImpressionsForPosition = list.reduce((s, a) => s + a.gscImpressions, 0) || 1;
    const avgPosition = list.reduce((s, a) => s + a.gscPosition * a.gscImpressions, 0) / totalImpressionsForPosition;
    const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
    const meniScores = list.map(a => a.scoreMeni).filter((s): s is number => s !== null);
    const avgMeni = meniScores.length > 0
      ? Math.round(meniScores.reduce((s, v) => s + v, 0) / meniScores.length)
      : 0;

    // Lógica de oportunidad basada en datos reales
    let opportunity: 'alta' | 'media' | 'baja' = 'baja';
    let reasoning = '';

    if (avgPosition <= 8 && avgCtr >= 3 && totalImpressions > 1000) {
      opportunity = 'alta';
      reasoning = `Google ya posiciona esta categoría bien (posición ${avgPosition.toFixed(1)}, CTR ${avgCtr}%). Oportunidad para producir más contenido de calidad en ${categoria}.`;
    } else if (totalImpressions > 500 && avgCtr < 2) {
      opportunity = 'alta';
      reasoning = `La categoría tiene visibilidad (${totalImpressions.toLocaleString()} impresiones) pero CTR bajo (${avgCtr}%). Optimizar títulos y snippets existentes primero.`;
    } else if (totalImpressions === 0 && list.length > 5) {
      opportunity = 'media';
      reasoning = `La categoría tiene ${list.length} artículos pero 0 impresiones en Google. Revisar SEO técnico y calidad antes de producir más.`;
    } else {
      opportunity = 'baja';
      reasoning = totalImpressions > 0
        ? `La categoría tiene poca visibilidad (${totalImpressions.toLocaleString()} impresiones). No es prioridad esta semana.`
        : 'Sin datos de Google. No hay evidencia de oportunidad.';
    }

    results.push({
      categoria,
      totalArticles: list.length,
      googleImpressions: totalImpressions,
      googleClicks: totalClicks,
      avgCtr,
      avgPosition: Number(avgPosition.toFixed(1)),
      avgMeniScore: avgMeni,
      opportunity,
      reasoning,
    });
  }

  return results.sort((a, b) => b.googleImpressions - a.googleImpressions);
}

/**
 * Encuentra candidatos a actualizar.
 */
function findUpdateCandidates(articles: ArticleFusion[]): ContentUpdateCandidate[] {
  const candidates: ContentUpdateCandidate[] = [];

  for (const a of articles) {
    // Alto potencial: posición 5-15 con impresiones y CTR bajo
    if (a.gscImpressions >= 100 && a.gscPosition >= 5 && a.gscPosition <= 15 && a.gscCtr < 2) {
      candidates.push({
        slug: a.slug,
        titulo: a.titulo,
        categoria: a.categoria,
        gscImpressions: a.gscImpressions,
        gscClicks: a.gscClicks,
        gscPosition: a.gscPosition,
        gscCtr: a.gscCtr,
        ga4Users: a.ga4Users,
        ga4AvgEngagementTimeSec: a.ga4AvgEngagementTimeSec,
        scoreMeni: a.scoreMeni,
        reason: `Posición ${a.gscPosition.toFixed(1)} con ${a.gscImpressions} impresiones pero CTR bajo (${a.gscCtr}%). Actualizar título y meta description puede ganar clics.`,
        expectedImpact: 'alto',
      });
    }

    // Actualizar contenido antiguo con tráfico
    const daysSince = (Date.now() - new Date(a.fechaPublicacion).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 90 && a.gscImpressions > 500) {
      candidates.push({
        slug: a.slug,
        titulo: a.titulo,
        categoria: a.categoria,
        gscImpressions: a.gscImpressions,
        gscClicks: a.gscClicks,
        gscPosition: a.gscPosition,
        gscCtr: a.gscCtr,
        ga4Users: a.ga4Users,
        ga4AvgEngagementTimeSec: a.ga4AvgEngagementTimeSec,
        scoreMeni: a.scoreMeni,
        reason: `Publicado hace ${Math.round(daysSince)} días y aún recibe ${a.gscImpressions} impresiones. Actualizar datos y contexto puede mejorar posición.`,
        expectedImpact: 'medio',
      });
    }
  }

  return candidates
    .sort((a, b) => b.gscImpressions - a.gscImpressions)
    .slice(0, 20);
}

/**
 * Genera recomendaciones de producción (sin inventar).
 * Solo recomienda categorías con evidencia real de demanda.
 */
function generateProductionRecommendations(
  categories: CategoryOpportunity[],
  now: string,
): NIOSRecommendation[] {
  const recs: NIOSRecommendation[] = [];
  const top = categories.filter(c => c.opportunity === 'alta').slice(0, 3);

  for (const cat of top) {
    recs.push({
      id: `weekly-produce-${cat.categoria.toLowerCase().replace(/\s+/g, '-')}`,
      articleSlug: 'site',
      articleTitle: 'Sitio',
      type: 'originality',
      severity: 'info',
      title: `Producir contenido en ${cat.categoria}`,
      description: `${cat.categoria} muestra ${cat.googleImpressions.toLocaleString()} impresiones y posición ${cat.avgPosition} en Google. Es la categoría con mayor oportunidad esta semana. Primero: optimizar artículos existentes de esta categoría antes de publicar nuevos.`,
      evidence: [{
        source: 'Google Search Console',
        api: 'searchanalytics.query',
        dateRange: 'Últimos 28 días',
        metric: `Impresiones en ${cat.categoria}`,
        value: cat.googleImpressions,
        collectedAt: now,
      }],
      confidence: cat.googleImpressions > 1000 ? 'high' : 'medium',
      createdAt: now,
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: 'weekly-no-produce',
      articleSlug: 'site',
      articleTitle: 'Sitio',
      type: 'depth',
      severity: 'warning',
      title: 'No publicar más contenido esta semana',
      description: 'No hay categorías con evidencia clara de oportunidad en Google Search Console. Recomendación: optimizar los artículos existentes, actualizar thin content y mejorar E-E-A-T antes de producir nuevas notas.',
      evidence: [{
        source: 'Google Search Console',
        api: 'searchanalytics.query',
        dateRange: 'Últimos 28 días',
        metric: 'Categorías con oportunidad alta',
        value: 0,
        collectedAt: now,
      }],
      confidence: 'high',
      createdAt: now,
    });
  }

  return recs;
}

/**
 * Genera el reporte semanal CEO.
 */
export function generateWeeklyReport(
  articles: ArticleFusion[],
  trust: GoogleTrustReport,
  gsc: GSCSnapshot | null,
): NIOSWeeklyReport {
  const now = new Date().toISOString();
  const periodEnd = formatDate(new Date());
  const periodStart = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  if (!gsc || articles.length === 0) {
    return {
      generatedAt: now,
      periodStart,
      periodEnd,
      hasData: false,
      topPerforming: [],
      noGscData: [],
      categoryOpportunities: [],
      productionRecommendations: [],
      updateCandidates: [],
      adsenseBlockers: [],
      trust,
      learningPatterns: [],
      summary: 'Datos insuficientes para generar el reporte semanal. Ejecutar el pipeline de recolección primero.',
    };
  }

  // 1. Contenido funcionando en Google
  const topPerforming = [...articles]
    .filter(a => a.gscImpressions >= 100 && a.gscClicks >= 5)
    .sort((a, b) => b.gscImpressions - a.gscImpressions)
    .slice(0, 20);

  // 2. Contenido sin datos de GSC (no conclusión de rechazo)
  const noGscData = [...articles]
    .filter(a => !a.hasGscData)
    .sort((a, b) => (b.scoreMeni ?? 0) - (a.scoreMeni ?? 0))
    .slice(0, 30);

  // 3. Categorías con oportunidad
  const categoryOpportunities = analyzeCategoryOpportunities(articles);

  // 5. Qué actualizar
  const updateCandidates = findUpdateCandidates(articles);

  // 4. Qué producir
  const productionRecommendations = generateProductionRecommendations(categoryOpportunities, now);

  // 6. Qué bloquea AdSense
  const adsenseBlockers = (trust.topBlocked || []).slice(0, 20);

  // Summary
  const topCat = categoryOpportunities[0];
  const summary = topCat
    ? `Reporte semanal: ${topPerforming.length} artículos con tráfico real en GSC. ${noGscData.length} artículos sin datos de GSC. Categoría con mayor oportunidad: ${topCat.categoria} (${topCat.googleImpressions.toLocaleString()} impresiones). ${adsenseBlockers.length} URLs bloqueando AdSense. Prioridad: optimizar lo existente, no publicar más.`
    : 'Reporte semanal generado. Datos insuficientes para identificar oportunidades claras.';

  return {
    generatedAt: now,
    periodStart,
    periodEnd,
    hasData: true,
    topPerforming,
    noGscData,
    categoryOpportunities,
    productionRecommendations,
    updateCandidates,
    adsenseBlockers,
    trust: trust as any,
    learningPatterns: [],
    summary,
  };
}
