/**
 * NIOS Intelligence Platform — FASE 3.4: Article Update Intelligence
 * ===================================================================
 * Detecta artículos que necesitan actualización (no crear nuevos).
 *
 * Criterios:
 * - Buenas impresiones + caída de posición
 * - Información desactualizada (artículos antiguos con tráfico)
 * - Posición buena pero CTR bajo (snippet desactualizado)
 * - Freshness boost (artículos con tráfico que pueden beneficiarse de update)
 *
 * Regla: No crear nuevo artículo. Actualizar el existente.
 */

import type {
  ArticleFusion,
  ArticleUpdateCandidate,
  ArticleUpdateReport,
  NIOSEvidence,
} from './types';

const OUTDATED_DAYS_THRESHOLD = 90;
const FRESHNESS_DAYS_THRESHOLD = 60;
const GOOD_IMPRESSIONS_THRESHOLD = 200;
const LOW_CTR_THRESHOLD = 1.5;
const GOOD_POSITION_THRESHOLD = 10;

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

function daysSince(dateStr: string): number {
  return Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Analiza un artículo y determina si necesita actualización.
 * Retorna null si no es candidato.
 */
function analyzeArticle(article: ArticleFusion): ArticleUpdateCandidate | null {
  const { gscImpressions, gscClicks, gscCtr, gscPosition, scoreMeni, slug, titulo, categoria, url, fechaPublicacion, hasGscData } = article;

  // Sin datos GSC reales no se puede concluir necesidad de actualización
  if (!hasGscData) return null;

  // Necesita al menos algo de tráfico real para considerar actualización
  if (gscImpressions < GOOD_IMPRESSIONS_THRESHOLD) return null;

  const days = daysSince(fechaPublicacion);
  const evidence: NIOSEvidence[] = [
    makeEvidence('Google Search Console', 'searchanalytics.query', `Impresiones de "${titulo}"`, gscImpressions),
    makeEvidence('Google Search Console', 'searchanalytics.query', `Posición de "${titulo}"`, gscPosition.toFixed(1)),
    makeEvidence('Firestore', 'noticias', `Días desde publicación`, days),
  ];

  // 1. Contenido desactualizado con tráfico
  if (days > OUTDATED_DAYS_THRESHOLD && gscImpressions >= 500) {
    return {
      slug,
      titulo,
      categoria,
      url,
      gscImpressions,
      gscClicks,
      gscCtr,
      gscPosition,
      daysSincePublication: days,
      scoreMeni,
      updateReason: 'outdated_content',
      reason: `Publicado hace ${days} días y aún recibe ${gscImpressions.toLocaleString()} impresiones. La información puede estar desactualizada.`,
      recommendedAction: `Actualizar datos, fechas, estadísticas y contexto. Añadir información nueva relevante. No crear artículo nuevo.`,
      expectedImpact: gscImpressions >= 2000 ? 'alto' : 'medio',
      evidence,
    };
  }

  // 2. Posición buena pero CTR bajo (snippet/título desactualizado)
  if (gscPosition <= GOOD_POSITION_THRESHOLD && gscCtr < LOW_CTR_THRESHOLD && gscImpressions >= 500) {
    return {
      slug,
      titulo,
      categoria,
      url,
      gscImpressions,
      gscClicks,
      gscCtr,
      gscPosition,
      daysSincePublication: days,
      scoreMeni,
      updateReason: 'low_ctr_good_position',
      reason: `Posición ${gscPosition.toFixed(1)} (top 10) pero CTR solo ${gscCtr}%. El título o snippet no está atrayendo clics.`,
      recommendedAction: `Reescribir título y meta description para maximizar CTR. Mantener el contenido, solo optimizar cómo aparece en Google.`,
      expectedImpact: 'alto',
      evidence: [
        ...evidence,
        makeEvidence('Google Search Console', 'searchanalytics.query', `CTR de "${titulo}"`, `${gscCtr}%`, `Posición ${gscPosition.toFixed(1)} pero CTR bajo`),
      ],
    };
  }

  // 3. Freshness boost: artículo con tráfico estable, actualizar para boost
  if (days > FRESHNESS_DAYS_THRESHOLD && gscImpressions >= 1000 && gscPosition > 5) {
    return {
      slug,
      titulo,
      categoria,
      url,
      gscImpressions,
      gscClicks,
      gscCtr,
      gscPosition,
      daysSincePublication: days,
      scoreMeni,
      updateReason: 'freshness_boost',
      reason: `Artículo con ${gscImpressions.toLocaleString()} impresiones, publicado hace ${days} días. Actualizar puede dar freshness boost en Google.`,
      recommendedAction: `Actualizar fecha, añadir párrafo de contexto actual, verificar enlaces. Marcar como actualizado.`,
      expectedImpact: 'medio',
      evidence,
    };
  }

  // 4. Posición declinando (posición > 15 con impresiones altas)
  if (gscPosition > 15 && gscImpressions >= 1000 && days > 30) {
    return {
      slug,
      titulo,
      categoria,
      url,
      gscImpressions,
      gscClicks,
      gscCtr,
      gscPosition,
      daysSincePublication: days,
      scoreMeni,
      updateReason: 'declining_position',
      reason: `Posición ${gscPosition.toFixed(1)} con ${gscImpressions.toLocaleString()} impresiones. La posición ha declinado, posiblemente por contenido desactualizado o competencia.`,
      recommendedAction: `Actualizar contenido, profundizar, añadir EEAT. Revisar qué han publicado competidores y mejorar.`,
      expectedImpact: 'medio',
      evidence,
    };
  }

  return null;
}

/**
 * Genera el reporte de artículos a actualizar.
 */
export function generateArticleUpdateReport(
  articles: ArticleFusion[],
): ArticleUpdateReport {
  const now = new Date().toISOString();

  if (articles.length === 0) {
    return {
      generatedAt: now,
      totalCandidates: 0,
      candidates: [],
      topPriority: [],
      summary: 'Datos insuficientes para evaluar actualizaciones. Ejecutar el pipeline de recolección primero.',
    };
  }

  const candidates: ArticleUpdateCandidate[] = [];

  for (const article of articles) {
    const candidate = analyzeArticle(article);
    if (candidate) candidates.push(candidate);
  }

  // Ordenar por impacto potencial (impresiones * peso de impacto)
  const impactWeight = { alto: 3, medio: 2, bajo: 1 };
  const sorted = [...candidates].sort(
    (a, b) =>
      b.gscImpressions * impactWeight[b.expectedImpact] -
      a.gscImpressions * impactWeight[a.expectedImpact],
  );

  const topPriority = sorted.slice(0, 20);

  const summary =
    candidates.length > 0
      ? `${candidates.length} artículos candidatos a actualización. ${candidates.filter(c => c.expectedImpact === 'alto').length} de alto impacto. Top prioridad: "${topPriority[0].titulo}" (${topPriority[0].gscImpressions.toLocaleString()} impresiones, ${topPriority[0].updateReason}).`
      : 'No hay artículos que requieran actualización con los datos actuales.';

  return {
    generatedAt: now,
    totalCandidates: candidates.length,
    candidates: sorted,
    topPriority,
    summary,
  };
}
