/**
 * NIOS Intelligence Platform — AdSense Readiness (Módulo 6)
 * ==========================================================
 * Analiza TODAS las noticias para evaluar readiness para AdSense.
 * AdSense fue rechazado por "Contenido de poco valor".
 * Este módulo calcula dimensiones de calidad y las compara con datos reales
 * de Google Search Console.
 *
 * Dimensiones evaluadas:
 * - Contenido útil
 * - Profundidad
 * - Originalidad
 * - Contexto
 * - Servicio
 * - Experiencia
 * - Enlaces internos
 * - Autoridad
 * - EEAT
 * - Actualizado
 * - Duplicidad
 */

import type {
  ArticleFusion,
  AdSenseReadinessReport,
  AdSenseReadinessArticle,
} from './types';

/**
 * Evalúa si el contenido es útil basado en palabras y engagement.
 */
function evalContenidoUtil(article: ArticleFusion): boolean {
  return article.palabras >= 300;
}

/**
 * Evalúa profundidad: 500+ palabras o engagement alto.
 */
function evalProfundidad(article: ArticleFusion): boolean {
  return article.palabras >= 500 || article.ga4AvgEngagementTimeSec > 120;
}

/**
 * Evalúa originalidad: MENI score alto sugiere contenido no duplicado.
 */
function evalOriginalidad(article: ArticleFusion): boolean {
  return article.scoreMeni !== null && article.scoreMeni >= 85;
}

/**
 * Evalúa contexto: tiene tags y related links.
 */
function evalContexto(article: ArticleFusion): boolean {
  return article.tags.length >= 2 && article.relatedLinksCount >= 2;
}

/**
 * Evalúa servicio: contenido con engagement real de usuarios.
 */
function evalServicio(article: ArticleFusion): boolean {
  return article.ga4Pageviews > 10 || article.gscClicks > 5;
}

/**
 * Evalúa experiencia: engagement time alto.
 */
function evalExperiencia(article: ArticleFusion): boolean {
  return article.ga4AvgEngagementTimeSec > 60;
}

/**
 * Evalúa enlaces internos.
 */
function evalEnlacesInternos(article: ArticleFusion): boolean {
  return article.relatedLinksCount >= 3;
}

/**
 * Evalúa autoridad: Google muestra impresiones.
 */
function evalAutoridad(article: ArticleFusion): boolean {
  return article.hasGscData && article.gscImpressions >= 100;
}

/**
 * Evalúa EEAT: score MENI + impresiones de Google.
 */
function evalEeat(article: ArticleFusion): boolean {
  return article.scoreMeni !== null && article.scoreMeni >= 90 && article.hasGscData && article.gscImpressions > 0;
}

/**
 * Evalúa si está actualizado: publicado en los últimos 90 días.
 */
function evalActualizado(article: ArticleFusion): boolean {
  const fecha = new Date(article.fechaPublicacion);
  const daysSince = (Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= 90;
}

/**
 * Evalúa duplicidad: score MENI alto sugiere no duplicado.
 */
function evalDuplicidad(article: ArticleFusion): boolean {
  return article.scoreMeni !== null && article.scoreMeni >= 80;
}

/**
 * Genera el reporte de AdSense Readiness.
 */
export function generateReadinessReport(
  articles: ArticleFusion[],
): AdSenseReadinessReport {
  const now = new Date().toISOString();
  const readinessArticles: AdSenseReadinessArticle[] = [];

  for (const article of articles) {
    const contenidoUtil = evalContenidoUtil(article);
    const profundidad = evalProfundidad(article);
    const originalidad = evalOriginalidad(article);
    const contexto = evalContexto(article);
    const servicio = evalServicio(article);
    const experiencia = evalExperiencia(article);
    const enlacesInternos = evalEnlacesInternos(article);
    const autoridad = evalAutoridad(article);
    const eeat = evalEeat(article);
    const actualizado = evalActualizado(article);
    const duplicidad = evalDuplicidad(article);

    const checks = [
      contenidoUtil, profundidad, originalidad, contexto, servicio,
      experiencia, enlacesInternos, autoridad, eeat, actualizado, duplicidad,
    ];

    const passed = checks.filter(Boolean).length;
    const readinessScore = Math.round((passed / checks.length) * 100);

    const issues: string[] = [];
    if (!contenidoUtil) issues.push('Contenido insuficiente (< 300 palabras)');
    if (!profundidad) issues.push('Falta profundidad (< 500 palabras)');
    if (!originalidad) issues.push('Score MENI bajo (< 85)');
    if (!contexto) issues.push('Falta contexto (tags o enlaces internos)');
    if (!servicio) issues.push('Sin engagement de usuarios');
    if (!experiencia) issues.push('Tiempo de engagement bajo');
    if (!enlacesInternos) issues.push('Enlaces internos insuficientes (< 3)');
    if (!autoridad) issues.push('Sin impresiones en Google (< 100)');
    if (!eeat) issues.push('EEAT no cumple (MENI < 90 o sin impresiones Google)');
    if (!actualizado) issues.push('Contenido desactualizado (> 90 días)');
    if (!duplicidad) issues.push('Posible duplicación (MENI < 80)');

    readinessArticles.push({
      slug: article.slug,
      titulo: article.titulo,
      categoria: article.categoria,
      scoreMeni: article.scoreMeni,
      gscImpressions: article.gscImpressions,
      gscClicks: article.gscClicks,
      hasGscData: article.hasGscData,
      contenidoUtil,
      profundidad,
      originalidad,
      contexto,
      servicio,
      experiencia,
      enlacesInternos,
      autoridad,
      eeat,
      actualizado,
      duplicidad,
      readinessScore,
      issues,
    });
  }

  // Estadísticas
  const readyArticles = readinessArticles.filter(a => a.readinessScore >= 80).length;
  const needsWorkArticles = readinessArticles.filter(a => a.readinessScore >= 50 && a.readinessScore < 80).length;
  const criticalArticles = readinessArticles.filter(a => a.readinessScore < 50).length;
  const averageReadinessScore = readinessArticles.length > 0
    ? Math.round(readinessArticles.reduce((s, a) => s + a.readinessScore, 0) / readinessArticles.length)
    : 0;

  // Top issues
  const issueCounts = new Map<string, number>();
  for (const a of readinessArticles) {
    for (const issue of a.issues) {
      issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
    }
  }
  const topIssues = Array.from(issueCounts.entries())
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Google ignored with high MENI
  const googleIgnoredWithHighMeni = readinessArticles
    .filter(a => a.hasGscData && a.gscImpressions === 0 && a.scoreMeni !== null && a.scoreMeni >= 90)
    .map(a => ({ slug: a.slug, titulo: a.titulo, scoreMeni: a.scoreMeni, gscImpressions: a.gscImpressions }))
    .sort((a, b) => (b.scoreMeni ?? 0) - (a.scoreMeni ?? 0))
    .slice(0, 20);

  // Summary
  let summary: string;
  if (readinessArticles.length === 0) {
    summary = 'No hay datos suficientes para emitir una recomendación.';
  } else {
    const pctReady = Math.round((readyArticles / readinessArticles.length) * 100);
    const pctCritical = Math.round((criticalArticles / readinessArticles.length) * 100);
    summary = `${pctReady}% de los artículos cumplen con readiness ≥ 80%. ${pctCritical}% están en estado crítico (score < 50%). Promedio de readiness: ${averageReadinessScore}/100. ${googleIgnoredWithHighMeni.length} artículos con MENI ≥ 90 sin datos de GSC (posibles causas: indexación pendiente, falta de demanda, datos insuficientes). Issue más común: ${topIssues[0]?.issue || 'N/A'} (${topIssues[0]?.count || 0} artículos).`;
  }

  return {
    generatedAt: now,
    totalArticles: readinessArticles.length,
    readyArticles,
    needsWorkArticles,
    criticalArticles,
    averageReadinessScore,
    articles: readinessArticles.sort((a, b) => a.readinessScore - b.readinessScore),
    topIssues,
    googleIgnoredWithHighMeni,
    summary,
  };
}
