/**
 * NIOS Intelligence Platform — FASE 2.5.1: Content Recovery Analyzer
 * ================================================================
 * Analiza cada URL publicada y asigna un Recovery Score 0-100.
 *
 * Basado en datos reales de:
 * - Google Search Console API
 * - Google Analytics 4 Data API
 * - Firestore (MENI score, palabras, autor, fecha, fuentes)
 * - Google Trust Score FASE 2
 *
 * Clasificación:
 * - GREEN (80-100): contenido saludable
 * - YELLOW (50-79): necesita mejora
 * - RED (0-49): posible contenido de poco valor
 *
 * NO borra automáticamente.
 */

import type {
  ArticleFusion,
  ContentRecoveryReport,
  RecoveryArticle,
  NIOSEvidence,
} from './types';

function articleEvidence(article: ArticleFusion, now: string): NIOSEvidence[] {
  const rows: NIOSEvidence[] = [
    {
      source: 'MENI',
      api: 'Firestore',
      dateRange: 'Actual',
      metric: 'scoreMeni',
      value: article.scoreMeni ?? 'N/D',
      collectedAt: now,
    },
    {
      source: 'Google Search Console',
      api: 'searchanalytics.query',
      dateRange: 'Últimos 28 días',
      metric: 'gscImpressions',
      value: article.gscImpressions,
      collectedAt: now,
    },
    {
      source: 'Google Search Console',
      api: 'searchanalytics.query',
      dateRange: 'Últimos 28 días',
      metric: 'gscCtr',
      value: `${article.gscCtr}%`,
      collectedAt: now,
    },
    {
      source: 'Google Analytics 4',
      api: 'runReport',
      dateRange: 'Últimos 28 días',
      metric: 'ga4AvgEngagementTimeSec',
      value: article.ga4AvgEngagementTimeSec,
      collectedAt: now,
    },
  ];

  return rows.filter(e => e.value !== '' && e.value !== undefined && e.value !== null && e.value !== 0);
}

function determineMainProblem(a: RecoveryArticle): string {
  const problems: string[] = [];

  if (a.palabras < 400) problems.push('Thin content');
  if (!a.hasAutor) problems.push('Sin autor visible');
  if (!a.hasContexto) problems.push('Poco contexto');
  if (a.gscStatus === 'REAL' && a.gscImpressions === 0) problems.push('Sin impresiones Google');
  if (a.gscStatus === 'REAL' && a.gscImpressions > 0 && a.gscCtr < 1) problems.push('CTR bajo, posible problema de título o snippet');
  if (a.ga4AvgEngagementTimeSec < 60 && a.ga4Users > 0) problems.push('Engagement bajo, posible falla de intención de búsqueda');
  if (a.gscStatus === 'REAL' && a.scoreMeni !== null && a.scoreMeni >= 90 && a.gscImpressions < 100) problems.push('MENI alto pero Google no encuentra demanda');

  if (problems.length === 0) return 'Contenido saludable';
  return problems[0];
}

function determineRecommendedAction(a: RecoveryArticle): string {
  if (a.status === 'green') {
    return 'Mantener y considerar como referencia de calidad.';
  }

  if (a.palabras < 400) {
    return 'Expandir contenido: agregar contexto, datos oficiales, antecedentes e impacto ciudadano.';
  }

  if (!a.hasAutor) {
    return 'Añadir firma de autor y biografía mínima.';
  }

  if (a.gscStatus === 'REAL' && a.gscImpressions === 0 && a.scoreMeni !== null && a.scoreMeni >= 90) {
    return 'Reescribir título SEO y mejorar intención de búsqueda; reforzar enlaces internos.';
  }

  if (a.gscStatus === 'REAL' && a.gscImpressions === 0) {
    return 'Verificar indexación, reforzar intención de búsqueda y enlaces internos.';
  }

  if (a.gscStatus === 'REAL' && a.gscImpressions > 0 && a.gscCtr < 1) {
    return 'Mejorar título y meta descripción para aumentar CTR sin sensacionalismo.';
  }

  if (a.ga4AvgEngagementTimeSec < 60) {
    return 'Revisar estructura: agregar subtítulos, FAQ y contexto inmediato en la introducción.';
  }

  if (a.scoreMeni !== null && a.scoreMeni < 70) {
    return 'Revisar calidad editorial: profundidad, fuentes, originalidad y contexto.';
  }

  return 'Revisar manualmente para identificar mejoras específicas.';
}

function calculateStatus(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

function scoreGooglePerformance(article: ArticleFusion): number {
  if (article.gscStatus !== 'REAL') return 0;
  let score = 0;
  if (article.gscImpressions >= 1000) score += 25;
  else if (article.gscImpressions >= 100) score += 18;
  else if (article.gscImpressions >= 10) score += 10;
  else if (article.gscImpressions > 0) score += 5;

  if (article.gscClicks >= 50) score += 10;
  else if (article.gscClicks >= 10) score += 7;
  else if (article.gscClicks > 0) score += 3;

  if (article.gscCtr >= 3) score += 15;
  else if (article.gscCtr >= 1.5) score += 10;
  else if (article.gscCtr >= 0.5) score += 5;
  else if (article.gscImpressions > 0) score += 2;

  if (article.gscPosition > 0 && article.gscPosition <= 5) score += 15;
  else if (article.gscPosition <= 10) score += 10;
  else if (article.gscPosition <= 20) score += 5;
  else if (article.gscImpressions > 0) score += 2;

  return score;
}

function scoreUserValue(article: ArticleFusion): number {
  let score = 0;
  if (article.ga4Users >= 500) score += 20;
  else if (article.ga4Users >= 100) score += 15;
  else if (article.ga4Users >= 10) score += 8;
  else if (article.hasGa4Data) score += 3;

  if (article.ga4AvgEngagementTimeSec >= 180) score += 15;
  else if (article.ga4AvgEngagementTimeSec >= 90) score += 10;
  else if (article.ga4AvgEngagementTimeSec >= 45) score += 5;
  else if (article.hasGa4Data) score += 2;

  if (article.ga4EngagementRate >= 0.6) score += 10;
  else if (article.ga4EngagementRate >= 0.4) score += 5;
  else if (article.hasGa4Data) score += 2;

  return score;
}

function scoreEditorialQuality(article: ArticleFusion): number {
  let score = 0;
  if (article.scoreMeni !== null && article.scoreMeni >= 90) score += 20;
  else if (article.scoreMeni !== null && article.scoreMeni >= 80) score += 15;
  else if (article.scoreMeni !== null && article.scoreMeni >= 70) score += 10;
  else if (article.scoreMeni !== null && article.scoreMeni >= 60) score += 5;

  if (article.palabras >= 800) score += 15;
  else if (article.palabras >= 500) score += 12;
  else if (article.palabras >= 400) score += 8;
  else if (article.palabras >= 200) score += 4;

  if (article.relatedLinksCount >= 3) score += 10;
  else if (article.relatedLinksCount >= 1) score += 5;

  const daysSince = (Date.now() - new Date(article.fechaPublicacion).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 30) score += 10;
  else if (daysSince <= 90) score += 7;
  else if (daysSince <= 180) score += 5;

  return score;
}

function scoreEEAT(article: ArticleFusion): number {
  let score = 0;
  if (article.autor && article.autor.trim().length > 0) score += 15;
  if (article.fechaPublicacion.length > 0) score += 5;
  if (article.palabras > 300) score += 5;
  if (article.tags.length >= 2) score += 5;
  if (article.relatedLinksCount >= 1) score += 5;
  return score;
}

function scoreAdSenseValue(article: ArticleFusion): number {
  let score = 0;
  if (article.palabras >= 400 && article.gscImpressions > 0) score += 15;
  if (article.scoreMeni !== null && article.scoreMeni >= 70) score += 10;
  if (article.palabras >= 600) score += 10;
  if (article.gscClicks > 0) score += 5;
  if (article.ga4AvgEngagementTimeSec >= 90) score += 5;
  if (article.relatedLinksCount >= 2) score += 5;
  return score;
}

/**
 * Calcula el Recovery Score 0-100 para un artículo.
 * Ponderación:
 * - Google Performance 25%
 * - User real 20%
 * - Calidad editorial 20%
 * - EEAT 15%
 * - Valor AdSense 20%
 */
export function calculateRecoveryScore(article: ArticleFusion): number {
  const gp = scoreGooglePerformance(article);
  const uv = scoreUserValue(article);
  const eq = scoreEditorialQuality(article);
  const ee = scoreEEAT(article);
  const av = scoreAdSenseValue(article);

  // Normalizar cada sub-score a 100
  const gpMax = 65;
  const uvMax = 45;
  const eqMax = 55;
  const eeMax = 35;
  const avMax = 50;

  const gpPct = Math.min(100, Math.round((gp / gpMax) * 100));
  const uvPct = Math.min(100, Math.round((uv / uvMax) * 100));
  const eqPct = Math.min(100, Math.round((eq / eqMax) * 100));
  const eePct = Math.min(100, Math.round((ee / eeMax) * 100));
  const avPct = Math.min(100, Math.round((av / avMax) * 100));

  const weighted = Math.round(
    gpPct * 0.25 +
    uvPct * 0.20 +
    eqPct * 0.20 +
    eePct * 0.15 +
    avPct * 0.20,
  );

  return Math.max(0, Math.min(100, weighted));
}

/**
 * Genera el Content Recovery Report.
 */
export function generateContentRecoveryReport(
  articles: ArticleFusion[],
  trustMap: Map<string, { googleTrustScore: number; risk: 'alto' | 'medio' | 'bajo' }>,
): ContentRecoveryReport {
  const now = new Date().toISOString();

  if (articles.length === 0) {
    return {
      generatedAt: now,
      totalArticles: 0,
      greenCount: 0,
      yellowCount: 0,
      redCount: 0,
      greenPct: 0,
      yellowPct: 0,
      redPct: 0,
      avgRecoveryScore: 0,
      articles: [],
      topImprovement: [],
      topRisk: [],
      summary: 'Datos insuficientes para evaluar.',
    };
  }

  const recoveryArticles: RecoveryArticle[] = articles.map(article => {
    const recoveryScore = calculateRecoveryScore(article);
    const status = calculateStatus(recoveryScore);
    const trustInfo = trustMap.get(article.slug);
    const googleTrustScore = trustInfo?.googleTrustScore ?? 0;
    const hasAutor = !!article.autor && article.autor.trim().length > 0;
    const hasFecha = article.fechaPublicacion.length > 0;
    const hasFuente = article.palabras > 300;
    const hasContexto = article.tags.length >= 2;

    const base: RecoveryArticle = {
      slug: article.slug,
      titulo: article.titulo,
      categoria: article.categoria,
      url: article.url,
      scoreMeni: article.scoreMeni,
      googleTrustScore,
      gscImpressions: article.gscImpressions,
      gscClicks: article.gscClicks,
      gscCtr: article.gscCtr,
      gscPosition: article.gscPosition,
      gscStatus: article.gscStatus,
      hasGscData: article.hasGscData,
      ga4Users: article.ga4Users,
      ga4Sessions: article.ga4Sessions,
      ga4Pageviews: article.ga4Pageviews,
      ga4AvgEngagementTimeSec: article.ga4AvgEngagementTimeSec,
      ga4EngagementRate: article.ga4EngagementRate,
      palabras: article.palabras,
      hasAutor,
      hasFecha,
      hasFuente,
      hasContexto,
      recoveryScore,
      status,
      mainProblem: '',
      recommendedAction: '',
      evidence: articleEvidence(article, now),
    };

    base.mainProblem = determineMainProblem(base);
    base.recommendedAction = determineRecommendedAction(base);
    return base;
  });

  const total = recoveryArticles.length;
  const green = recoveryArticles.filter(a => a.status === 'green').length;
  const yellow = recoveryArticles.filter(a => a.status === 'yellow').length;
  const red = recoveryArticles.filter(a => a.status === 'red').length;

  const greenPct = Math.round((green / total) * 100);
  const yellowPct = Math.round((yellow / total) * 100);
  const redPct = Math.round((red / total) * 100);
  const avg = Math.round(recoveryArticles.reduce((s, a) => s + a.recoveryScore, 0) / total);

  const topImprovement = [...recoveryArticles]
    .filter(a => a.status === 'yellow' || a.status === 'red')
    .sort((a, b) => a.recoveryScore - b.recoveryScore)
    .slice(0, 30);

  const topRisk = [...recoveryArticles]
    .filter(a => a.status === 'red')
    .sort((a, b) => a.recoveryScore - b.recoveryScore)
    .slice(0, 50);

  const summary = `Content Recovery: ${total} artículos analizados. Promedio ${avg}/100. ${green} GREEN (${greenPct}%), ${yellow} YELLOW (${yellowPct}%), ${red} RED (${redPct}%). ${topRisk.length} URLs en riesgo. NO borrar automáticamente.`;

  return {
    generatedAt: now,
    totalArticles: total,
    greenCount: green,
    yellowCount: yellow,
    redCount: red,
    greenPct,
    yellowPct,
    redPct,
    avgRecoveryScore: avg,
    articles: recoveryArticles,
    topImprovement,
    topRisk,
    summary,
  };
}
