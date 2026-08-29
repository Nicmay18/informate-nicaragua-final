/**
 * NIOS Intelligence Platform — FASE 2.2: AdSense Recovery Engine
 * ==============================================================
 * Dashboard y reporte de recuperación de AdSense.
 * No borra automáticamente. Detecta las 20 URLs que probablemente
 * afectan la aprobación de AdSense.
 *
 * Métricas:
 * - Contenido original %
 * - Artículos con contexto %
 * - Artículos con autor %
 * - Artículos con fuentes %
 * - Artículos útiles %
 */

import type {
  ArticleFusion,
  GoogleTrustArticle,
  GoogleTrustReport,
  ThinContentArticle,
  AdSenseRecoveryReport,
  NIOSRecommendation,
} from './types';

/**
 * Genera el reporte de AdSense Recovery.
 */
export function generateAdSenseRecoveryReport(
  articles: ArticleFusion[],
  trust: GoogleTrustReport,
): AdSenseRecoveryReport {
  const now = new Date().toISOString();

  if (articles.length === 0) {
    return {
      generatedAt: now,
      totalArticles: 0,
      riskLevel: 'bajo',
      contentOriginalityPct: 0,
      contentContextPct: 0,
      contentAuthorPct: 0,
      contentSourcesPct: 0,
      contentUsefulPct: 0,
      topRiskUrls: [],
      thinContent: [],
      blockedArticles: [],
      recommendations: [],
      summary: 'No hay artículos suficientes para emitir una recomendación.',
    };
  }

  // Métricas porcentuales
  const withAuthor = articles.filter(a => !!a.autor && a.autor.trim().length > 0).length;
  const withContext = articles.filter(a => a.tags.length >= 2).length;
  const withSources = articles.filter(a => a.palabras > 200).length; // proxy: contenido con profundidad
  const useful = articles.filter(a => a.palabras >= 400 || a.gscImpressions > 0).length;
  const original = articles.filter(a => a.scoreMeni !== null && a.scoreMeni >= 70 && a.palabras >= 300).length;

  const contentAuthorPct = Math.round((withAuthor / articles.length) * 100);
  const contentContextPct = Math.round((withContext / articles.length) * 100);
  const contentSourcesPct = Math.round((withSources / articles.length) * 100);
  const contentUsefulPct = Math.round((useful / articles.length) * 100);
  const contentOriginalityPct = Math.round((original / articles.length) * 100);

  // Nivel de riesgo
  let riskLevel: 'alto' | 'medio' | 'bajo' = 'bajo';
  if (trust.averageGoogleTrustScore < 50 || trust.highRiskArticles > articles.length * 0.2) {
    riskLevel = 'alto';
  } else if (trust.averageGoogleTrustScore < 70 || trust.thinContentCount > articles.length * 0.1) {
    riskLevel = 'medio';
  }

  // Top 20 URLs que afectan aprobación AdSense
  const topRiskUrls = trust.topBlocked.slice(0, 20);

  // Thin content
  const thinContent: ThinContentArticle[] = articles
    .filter(a => a.palabras < 400)
    .map(a => ({
      slug: a.slug,
      titulo: a.titulo,
      categoria: a.categoria,
      palabras: a.palabras,
      scoreMeni: a.scoreMeni,
      gscImpressions: a.gscImpressions,
      reasons: a.palabras < 400 ? [`Menos de 400 palabras (${a.palabras})`] : [],
    }));

  // Artículos que bloquean (sin autor, thin con 0 impresiones reales, o MENI alto ignorado)
  const blockedArticles: GoogleTrustArticle[] = trust.articles
    .filter(a =>
      (!a.hasAutor) ||
      (a.isThin && a.gscStatus === 'REAL' && a.gscImpressions === 0) ||
      (a.scoreMeni !== null && a.scoreMeni >= 90 && a.gscStatus === 'REAL' && a.gscImpressions === 0)
    )
    .slice(0, 20);

  // Recomendaciones accionables basadas en datos
  const recommendations: NIOSRecommendation[] = [];

  if (trust.articlesWithoutAuthor > 0) {
    recommendations.push({
      id: 'adsense-recovery-author-missing',
      articleSlug: 'site',
      articleTitle: 'Sitio',
      type: 'eeat',
      severity: 'warning',
      title: 'Artículos sin autor visible',
      description: `${trust.articlesWithoutAuthor} de ${articles.length} artículos no muestran autor. AdSense valora la transparencia editorial (E-E-A-T).`,
      evidence: [{
        source: 'Firestore',
        api: 'get()',
        dateRange: 'Actual',
        metric: 'Artículos sin autor',
        value: trust.articlesWithoutAuthor,
        collectedAt: now,
      }],
      confidence: 'high',
      createdAt: now,
    });
  }

  if (trust.thinContentCount > 0) {
    recommendations.push({
      id: 'adsense-recovery-thin-content',
      articleSlug: 'site',
      articleTitle: 'Sitio',
      type: 'depth',
      severity: 'critical',
      title: 'Thin content detectado',
      description: `${trust.thinContentCount} artículos tienen menos de 400 palabras o carecen de contexto. Esto representa un riesgo interno de contenido de poco valor; no concluye que AdSense haya rechazado el sitio sin evidencia oficial.`,
      evidence: [{
        source: 'Firestore',
        api: 'get()',
        dateRange: 'Actual',
        metric: 'Artículos thin content',
        value: trust.thinContentCount,
        collectedAt: now,
      }],
      confidence: 'high',
      createdAt: now,
    });
  }

  if (trust.articlesHighMeniZeroImpressions > 0) {
    recommendations.push({
      id: 'adsense-recovery-meni-google-mismatch',
      articleSlug: 'site',
      articleTitle: 'Sitio',
      type: 'originality',
      severity: 'warning',
      title: 'MENI alto sin datos de GSC: hipótesis de calibración',
      description: `${trust.articlesHighMeniZeroImpressions} artículos con MENI ≥90 no reciben impresiones de Google (posibles causas: indexación pendiente, falta de demanda, contenido reciente o datos insuficientes). MENI necesita calibrarse con señales reales de Google.`,
      evidence: [{
        source: 'Google Search Console',
        api: 'searchanalytics.query',
        dateRange: 'Últimos 28 días',
        metric: 'Artículos MENI ≥90 con 0 impresiones',
        value: trust.articlesHighMeniZeroImpressions,
        collectedAt: now,
      }],
      confidence: 'high',
      createdAt: now,
    });
  }

  const summary = `AdSense Recovery: Nivel de riesgo ${riskLevel.toUpperCase()}. Contenido original ${contentOriginalityPct}%, con autor ${contentAuthorPct}%, con contexto ${contentContextPct}%, con profundidad ${contentSourcesPct}%, útil ${contentUsefulPct}%. ${trust.thinContentCount} artículos thin content. ${trust.articlesHighMeniZeroImpressions} artículos con MENI ≥90 sin datos de GSC. ${topRiskUrls.length} URLs de alto riesgo identificadas. No borrar automáticamente: revisar manualmente.`;

  return {
    generatedAt: now,
    totalArticles: articles.length,
    riskLevel,
    contentOriginalityPct,
    contentContextPct,
    contentAuthorPct,
    contentSourcesPct,
    contentUsefulPct,
    topRiskUrls,
    thinContent,
    blockedArticles,
    recommendations,
    summary,
  };
}
