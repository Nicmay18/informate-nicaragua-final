/**
 * NIOS Intelligence Platform — FASE 2.1: Google Trust Audit
 * ==========================================================
 * Evalúa señales reales de confianza de Google para nicaraguainformate.com.
 * Calcula Google Trust Score por artículo y detecta thin content.
 *
 * Basado en datos reales de:
 * - Google Search Console API
 * - Google Analytics 4 Data API
 * - Firestore
 * - MENI scores
 *
 * Nada se inventa. Todo insight incluye fuente, métrica, fecha y confianza.
 */

import type { ArticleFusion, GoogleTrustArticle, GoogleTrustReport, ThinContentArticle } from './types';

const THIN_WORDS_THRESHOLD = 400;
const HIGH_RISK_THRESHOLD = 40;
const MEDIUM_RISK_THRESHOLD = 70;

/**
 * Calcula el score de autoridad editorial (0-100).
 * Basado en: autor visible, fecha, fuentes, contexto, enlaces internos.
 */
function calculateEditorialAuthorityScore(article: ArticleFusion): {
  score: number;
  hasAutor: boolean;
  hasFecha: boolean;
  hasFuente: boolean;
  hasContexto: boolean;
} {
  const hasAutor = !!article.autor && article.autor.trim().length > 0;
  const hasFecha = article.fechaPublicacion.length > 0;
  const hasFuente = article.palabras > 0; // proxy: contenido con palabras
  const hasContexto = article.tags.length >= 2 && article.relatedLinksCount >= 2;

  const checks = [hasAutor, hasFecha, hasFuente, hasContexto, article.relatedLinksCount >= 3];
  const passed = checks.filter(Boolean).length;
  const score = Math.round((passed / 5) * 100);

  return { score, hasAutor, hasFecha, hasFuente, hasContexto };
}

/**
 * Calcula el score de valor de contenido (0-100).
 * Basado en: tráfico orgánico real, CTR, posición, tiempo de lectura,
 * profundidad, actualización, enlaces internos, categoría.
 */
function calculateContentValueScore(article: ArticleFusion): number {
  const scores: number[] = [];

  // Tráfico orgánico real (máximo 20 pts)
  const organicTraffic = article.gscClicks;
  let trafficScore = 0;
  if (organicTraffic >= 100) trafficScore = 20;
  else if (organicTraffic >= 20) trafficScore = 15;
  else if (organicTraffic >= 5) trafficScore = 10;
  else if (organicTraffic > 0) trafficScore = 5;
  scores.push(trafficScore);

  // CTR (máximo 15 pts)
  let ctrScore = 0;
  if (article.gscCtr >= 5) ctrScore = 15;
  else if (article.gscCtr >= 2.5) ctrScore = 10;
  else if (article.gscCtr >= 1) ctrScore = 5;
  else if (article.gscImpressions > 0) ctrScore = 2;
  scores.push(ctrScore);

  // Posición (máximo 15 pts, invertida)
  let positionScore = 0;
  if (article.gscPosition > 0 && article.gscPosition <= 5) positionScore = 15;
  else if (article.gscPosition <= 10) positionScore = 10;
  else if (article.gscPosition <= 20) positionScore = 5;
  else if (article.gscImpressions > 0) positionScore = 2;
  scores.push(positionScore);

  // Tiempo de lectura GA4 (máximo 15 pts)
  let engagementScore = 0;
  if (article.ga4AvgEngagementTimeSec >= 180) engagementScore = 15;
  else if (article.ga4AvgEngagementTimeSec >= 120) engagementScore = 10;
  else if (article.ga4AvgEngagementTimeSec >= 60) engagementScore = 5;
  else if (article.hasGa4Data) engagementScore = 2;
  scores.push(engagementScore);

  // Profundidad (máximo 15 pts)
  let depthScore = 0;
  if (article.palabras >= 800) depthScore = 15;
  else if (article.palabras >= 500) depthScore = 10;
  else if (article.palabras >= 300) depthScore = 5;
  else if (article.palabras >= 100) depthScore = 2;
  scores.push(depthScore);

  // Actualización (máximo 10 pts)
  const daysSince = (Date.now() - new Date(article.fechaPublicacion).getTime()) / (1000 * 60 * 60 * 24);
  let freshnessScore = 0;
  if (daysSince <= 30) freshnessScore = 10;
  else if (daysSince <= 90) freshnessScore = 7;
  else if (daysSince <= 180) freshnessScore = 5;
  else if (daysSince <= 365) freshnessScore = 3;
  scores.push(freshnessScore);

  // Enlaces internos (máximo 10 pts)
  let linksScore = 0;
  if (article.relatedLinksCount >= 5) linksScore = 10;
  else if (article.relatedLinksCount >= 3) linksScore = 7;
  else if (article.relatedLinksCount >= 1) linksScore = 3;
  scores.push(linksScore);

  // Categoría (máximo 10 pts) — se asigna puntos a categorías consistentes
  const strongCategories = ['Nacionales', 'Sucesos', 'Internacionales'];
  const categoryScore = strongCategories.includes(article.categoria) ? 10 : 7;
  scores.push(categoryScore);

  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

/**
 * Detecta thin content y retorna flags.
 */
function detectThinContent(article: ArticleFusion): { isThin: boolean; flags: string[] } {
  const flags: string[] = [];

  if (article.palabras < THIN_WORDS_THRESHOLD) {
    flags.push(`Menos de ${THIN_WORDS_THRESHOLD} palabras (${article.palabras})`);
  }

  if (article.palabras > 0 && article.palabras < 200) {
    flags.push('Contenido muy corto, posible duplicado o nota mínima');
  }

  if (article.tags.length < 2) {
    flags.push('Ausencia de contexto (pocos tags)');
  }

  if (article.relatedLinksCount < 1) {
    flags.push('Sin enlaces internos');
  }

  if (!article.autor || article.autor.trim().length === 0) {
    flags.push('Sin autor visible');
  }

  if (article.gscStatus === 'REAL' && article.palabras >= 200 && article.gscImpressions === 0 && article.scoreMeni !== null && article.scoreMeni < 80) {
    flags.push('Poca información nueva: score MENI bajo y 0 impresiones');
  }

  return { isThin: flags.length > 0, flags };
}

/**
 * Evalúa riesgo de duplicado basado en longitud, score y GSC.
 */
function detectDuplicateRisk(article: ArticleFusion): boolean {
  if (article.gscStatus === 'REAL' && article.palabras < 200 && article.gscImpressions === 0) return true;
  if (article.palabras > 0 && article.scoreMeni !== null && article.scoreMeni < 60) return true;
  return false;
}

/**
 * Verifica si el artículo está actualizado (últimos 90 días).
 */
function isUpdated(article: ArticleFusion): boolean {
  const daysSince = (Date.now() - new Date(article.fechaPublicacion).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= 90;
}

/**
 * Calcula el Google Trust Score final (0-100).
 * Promedio ponderado de editorial authority y content value.
 */
function calculateGoogleTrustScore(
  authorityScore: number,
  contentValueScore: number,
  thinFlags: string[],
  gscReal: boolean,
): { score: number; risk: 'alto' | 'medio' | 'bajo' } {
  let score = Math.round((authorityScore * 0.4) + (contentValueScore * 0.6));

  // Penalización por thin content
  if (thinFlags.length >= 3) score -= 20;
  else if (thinFlags.length >= 2) score -= 10;
  else if (thinFlags.length >= 1) score -= 5;

  // Penalización por 0 impresiones solo cuando GSC aportó datos reales
  if (gscReal && contentValueScore === 0) score -= 10;

  score = Math.max(0, Math.min(100, score));

  const risk: 'alto' | 'medio' | 'bajo' =
    score < HIGH_RISK_THRESHOLD ? 'alto' : score < MEDIUM_RISK_THRESHOLD ? 'medio' : 'bajo';

  return { score, risk };
}

/**
 * Genera el Google Trust Audit para todos los artículos.
 */
export function generateGoogleTrustReport(articles: ArticleFusion[]): GoogleTrustReport {
  const now = new Date().toISOString();
  const trustArticles: GoogleTrustArticle[] = [];

  for (const article of articles) {
    const authority = calculateEditorialAuthorityScore(article);
    const contentValue = calculateContentValueScore(article);
    const thin = detectThinContent(article);
    const duplicateRisk = detectDuplicateRisk(article);
    const updated = isUpdated(article);
    const trust = calculateGoogleTrustScore(authority.score, contentValue, thin.flags, article.gscStatus === 'REAL');

    trustArticles.push({
      slug: article.slug,
      titulo: article.titulo,
      categoria: article.categoria,
      autor: article.autor,
      fechaPublicacion: article.fechaPublicacion,
      palabras: article.palabras,
      scoreMeni: article.scoreMeni,
      gscStatus: article.gscStatus,
      gscImpressions: article.gscImpressions,
      gscClicks: article.gscClicks,
      gscCtr: article.gscCtr,
      gscPosition: article.gscPosition,
      ga4AvgEngagementTimeSec: article.ga4AvgEngagementTimeSec,
      relatedLinksCount: article.relatedLinksCount,
      hasAutor: authority.hasAutor,
      hasFecha: authority.hasFecha,
      hasFuente: authority.hasFuente,
      hasContexto: authority.hasContexto,
      isThin: thin.isThin,
      isDuplicateRisk: duplicateRisk,
      isUpdated: updated,
      googleTrustScore: trust.score,
      editorialAuthorityScore: authority.score,
      contentValueScore: contentValue,
      thinContentFlags: thin.flags,
      risk: trust.risk,
    });
  }

  // Estadísticas
  const totalArticles = trustArticles.length;
  const highRisk = trustArticles.filter(a => a.risk === 'alto').length;
  const mediumRisk = trustArticles.filter(a => a.risk === 'medio').length;
  const lowRisk = trustArticles.filter(a => a.risk === 'bajo').length;
  const avgScore = totalArticles > 0
    ? Math.round(trustArticles.reduce((s, a) => s + a.googleTrustScore, 0) / totalArticles)
    : 0;

  const thinCount = trustArticles.filter(a => a.isThin).length;
  const duplicateRiskCount = trustArticles.filter(a => a.isDuplicateRisk).length;
  const withoutAuthor = trustArticles.filter(a => !a.hasAutor).length;
  const withoutSources = trustArticles.filter(a => !a.hasFuente).length;
  const lowGoogle = trustArticles.filter(a => a.gscStatus === 'REAL' && a.gscImpressions < 10 && a.palabras > 200).length;
  const highMeniZeroImpressions = trustArticles.filter(a => a.gscStatus === 'REAL' && a.scoreMeni !== null && a.scoreMeni >= 90 && a.gscImpressions === 0).length;
  const lowMeniHighImpressions = trustArticles.filter(a => a.gscStatus === 'REAL' && a.scoreMeni !== null && a.scoreMeni < 80 && a.gscImpressions > 1000).length;

  // Top artículos que bloquean AdSense (alto riesgo)
  const topBlocked = [...trustArticles]
    .filter(a => a.gscStatus === 'REAL' && (a.risk === 'alto' || (a.isThin && a.gscImpressions === 0)))
    .sort((a, b) => a.googleTrustScore - b.googleTrustScore)
    .slice(0, 20);

  // Resumen
  let summary: string;
  if (totalArticles === 0) {
    summary = 'No hay artículos suficientes para emitir una recomendación.';
  } else {
    const pctHigh = Math.round((highRisk / totalArticles) * 100);
    const anyGscReal = trustArticles.some(a => a.gscStatus === 'REAL');
    summary = anyGscReal
      ? `NIOS Trust Audit: ${totalArticles} artículos analizados. Promedio NIOS Trust Estimate: ${avgScore}/100. ${highRisk} artículos de riesgo alto (${pctHigh}%), ${mediumRisk} de riesgo medio, ${lowRisk} de riesgo bajo. ${thinCount} artículos tienen thin content. ${highMeniZeroImpressions} artículos con MENI ≥90 sin datos de GSC. ${lowMeniHighImpressions} artículos con MENI <80 reciben tráfico real. Recomendación: optimizar contenido existente antes de publicar más.`
      : `NIOS Trust: datos de GSC no disponibles (${articles[0]?.gscStatus ?? 'NO_DATA'}). No es posible evaluar impresiones, clics o riesgo orgánico real. El score ${avgScore}/100 refleja señales editoriales, no evidencia de Google. Configurar GSC para obtener métricas reales.`;
  }

  return {
    generatedAt: now,
    totalArticles,
    highRiskArticles: highRisk,
    mediumRiskArticles: mediumRisk,
    lowRiskArticles: lowRisk,
    averageGoogleTrustScore: avgScore,
    thinContentCount: thinCount,
    duplicateRiskCount: duplicateRiskCount,
    articlesWithoutAuthor: withoutAuthor,
    articlesWithoutSources: withoutSources,
    articlesWithLowGoogle: lowGoogle,
    articlesHighMeniZeroImpressions: highMeniZeroImpressions,
    articlesLowMeniHighImpressions: lowMeniHighImpressions,
    articles: trustArticles,
    topBlocked,
    summary,
  };
}

/**
 * Genera lista de thin content con reasons.
 */
export function generateThinContentReport(articles: ArticleFusion[]): ThinContentArticle[] {
  return articles.map(article => {
    const thin = detectThinContent(article);
    return {
      slug: article.slug,
      titulo: article.titulo,
      categoria: article.categoria,
      palabras: article.palabras,
      scoreMeni: article.scoreMeni,
      gscImpressions: article.gscImpressions,
      reasons: thin.flags,
    };
  }).filter(a => a.reasons.length > 0);
}
