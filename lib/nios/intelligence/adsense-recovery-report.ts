/**
 * NIOS Intelligence Platform — FASE 2.5.5: AdSense Recovery Full Report
 * ===================================================================
 * Reporte completo de recuperación de AdSense.
 * Responde 6 preguntas clave basándose en datos reales.
 *
 * No asume aprobación. Si no hay datos, retorna "Datos insuficientes para evaluar".
 */

import type {
  ArticleFusion,
  AdSenseRecoveryFullReport,
  ImprovementRecommendation,
  RecoveryArticle,
  NIOSRecommendation,
} from './types';
import { generateGoogleTrustReport } from './google-trust';
import { generateContentRecoveryReport } from './content-recovery';
import { generateAdSenseTrustCheck } from './adsense-trust-check';
import { generateImprovementRecommendations } from './content-improvement';

function buildTrustMap(articles: ArticleFusion[]) {
  const report = generateGoogleTrustReport(articles);
  const map = new Map<string, { googleTrustScore: number; risk: 'alto' | 'medio' | 'bajo' }>();
  for (const a of report.articles) {
    map.set(a.slug, { googleTrustScore: a.googleTrustScore, risk: a.risk });
  }
  return { report, map };
}

/**
 * Genera el AdSense Recovery Full Report.
 */
export async function generateAdSenseRecoveryFullReport(
  articles: ArticleFusion[],
  ga4: { totalUsers: number; averageEngagementTimeSec: number; devices: { device: string; users: number }[] } | null,
  sourceTraffic: Record<string, number> = {},
): Promise<AdSenseRecoveryFullReport> {
  const now = new Date().toISOString();

  if (articles.length === 0) {
    return {
      generatedAt: now,
      likelyRejectionReason: 'Datos insuficientes para evaluar.',
      topAffectingUrls: [],
      topPotentialUrls: [],
      authorityCategories: [],
      transformationCategories: [],
      readyToReapply: 'no',
      trustCheck: {
        generatedAt: now,
        adSenseTrustScore: 0,
        editorialIdentityScore: 0,
        contentQualityScore: 0,
        userExperienceScore: 0,
        trustScore: 0,
        status: 'no_solicitar',
        identity: {
          aboutComplete: null,
          teamVisible: null,
          contact: null,
          editorialPolicy: null,
          privacyPolicy: null,
          corrections: null,
        },
        contentQuality: {
          originalContentPct: 0,
          depthPct: 0,
          contextPct: 0,
          sourcesPct: 0,
          updatedPct: 0,
        },
        userExperience: {
          avgEngagementTimeSec: 0,
          mobileSharePct: 0,
          internalLinksCoveragePct: 0,
        },
        recommendations: [],
        summary: 'Datos insuficientes para evaluar.',
      },
      contentRecovery: {
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
      },
      improvements: [],
      summary: 'Datos insuficientes para evaluar.',
    };
  }

  const { report: trust, map: trustMap } = buildTrustMap(articles);
  const contentRecovery = generateContentRecoveryReport(articles, trustMap);
  const trustCheck = await generateAdSenseTrustCheck({ articles, trust }, ga4);
  const improvements = generateImprovementRecommendations(articles, sourceTraffic);

  // 1. Razón probable del rechazo
  let likelyRejectionReason = 'No se detecta una razón única con los datos actuales.';
  const redPct = contentRecovery.redPct;
  const thinPct = Math.round((trust.thinContentCount / articles.length) * 100);
  const lowTrust = trust.averageGoogleTrustScore < 50;

  if (redPct >= 30 || thinPct >= 30 || lowTrust) {
    likelyRejectionReason = `Google probablemente rechazó el sitio por "Contenido de poco valor". ${contentRecovery.redCount} artículos RED (${redPct}%), ${trust.thinContentCount} thin content, Google Trust Score promedio ${trust.averageGoogleTrustScore}/100.`;
  } else if (redPct >= 15) {
    likelyRejectionReason = `Riesgo moderado de contenido de poco valor: ${contentRecovery.redCount} artículos RED, ${trust.thinContentCount} thin content. Revisar antes de re-solicitar.`;
  } else if (trustCheck.adSenseTrustScore < 70) {
    likelyRejectionReason = `Señales de confianza y calidad editorial insuficientes. AdSense Trust Score ${trustCheck.adSenseTrustScore}/100.`;
  }

  // 2. Top 50 URLs que más afectan
  const topAffectingUrls = contentRecovery.topRisk.slice(0, 50);

  // 3. Top 30 URLs con mayor potencial (GREEN con impresiones o YELLOW corregibles)
  const topPotentialUrls: RecoveryArticle[] = [...contentRecovery.articles]
    .filter(a => a.status === 'green' || (a.status === 'yellow' && a.gscImpressions > 0))
    .sort((a, b) => b.recoveryScore - a.recoveryScore)
    .slice(0, 30);

  // 4. Categorías que fortalecen autoridad
  const byCategory = new Map<string, { categoria: string; sumTrust: number; sumMeni: number; count: number; red: number }>();
  for (const a of contentRecovery.articles) {
    const curr = byCategory.get(a.categoria) || { categoria: a.categoria, sumTrust: 0, sumMeni: 0, count: 0, red: 0 };
    curr.sumTrust += a.googleTrustScore;
    curr.sumMeni += a.scoreMeni ?? 0;
    curr.count += 1;
    if (a.status === 'red') curr.red += 1;
    byCategory.set(a.categoria, curr);
  }

  const authorityCategories = Array.from(byCategory.values()).map(c => {
    const avgGoogleTrust = Math.round(c.sumTrust / c.count);
    const avgMeni = Math.round(c.sumMeni / c.count);
    return {
      categoria: c.categoria,
      avgGoogleTrust,
      avgMeni,
      articleCount: c.count,
      strengthensAuthority: avgGoogleTrust >= 60 && c.red / c.count < 0.2,
    };
  }).sort((a, b) => b.avgGoogleTrust - a.avgGoogleTrust);

  const transformationCategories = authorityCategories
    .filter(c => !c.strengthensAuthority)
    .map(c => {
      const redCount = byCategory.get(c.categoria)?.red || 0;
      return {
        ...c,
        redCount,
        reason: `Google Trust promedio ${c.avgGoogleTrust} y ${redCount} artículos RED. Requiere mejorar contexto, profundidad y EEAT.`,
      };
    });

  // 5. ¿Listo para re-solicitar?
  let readyToReapply: 'no' | 'maybe' | 'yes' = 'no';
  if (
    trustCheck.status === 'preparado' &&
    contentRecovery.redPct < 10 &&
    trust.averageGoogleTrustScore >= 70
  ) {
    readyToReapply = 'yes';
  } else if (
    trustCheck.status === 'mejorar' &&
    contentRecovery.redPct < 20 &&
    trust.averageGoogleTrustScore >= 55
  ) {
    readyToReapply = 'maybe';
  }

  // 6. Resumen
  const summary = `${likelyRejectionReason} Recuperación: ${contentRecovery.greenCount} GREEN, ${contentRecovery.yellowCount} YELLOW, ${contentRecovery.redCount} RED. Top afectadas: ${topAffectingUrls.length}. Top potencial: ${topPotentialUrls.length}. Trust Check: ${trustCheck.adSenseTrustScore}/100 (${trustCheck.status}). Listo para re-solicitar: ${readyToReapply}.`;

  return {
    generatedAt: now,
    likelyRejectionReason,
    topAffectingUrls,
    topPotentialUrls,
    authorityCategories,
    transformationCategories,
    readyToReapply,
    trustCheck,
    contentRecovery,
    improvements,
    summary,
  };
}

/**
 * Genera recomendaciones AdSense a nivel artículo como NIOSRecommendation.
 */
export function generateAdSenseRecoveryRecommendations(
  improvements: ImprovementRecommendation[],
): NIOSRecommendation[] {
  const now = new Date().toISOString();
  return improvements.slice(0, 50).map(i => ({
    id: i.id,
    articleSlug: i.slug,
    articleTitle: i.titulo,
    type: i.trigger.includes('sucesos') ? 'depth' : i.trigger.includes('author') ? 'eeat' : 'seo',
    severity: i.priority === 'critical' ? 'critical' : i.priority === 'high' ? 'warning' : 'info',
    title: i.observation,
    description: i.recommendedAction,
    evidence: i.evidence,
    confidence: i.priority === 'critical' ? 'high' : 'medium',
    createdAt: now,
  }));
}
