/**
 * NIOS Intelligence Platform — Orchestrator
 * ==========================================
 * Ejecuta el pipeline completo de recolección, fusión, análisis y persistencia.
 * Diseñado para ejecutarse diariamente via cron o API endpoint.
 *
 * Pipeline:
 * 1. Collect GSC → Google Search Console API
 * 2. Collect GA4 → Google Analytics 4 Data API
 * 3. Load noticias → Firestore
 * 4. Merge → ArticleFusion[]
 * 5. Generate recommendations → Editorial rules
 * 6. Generate compliance report → Módulo 0
 * 7. Generate readiness report → Módulo 6
 * 8. Build dashboard → Módulo 5
 * 9. Save daily snapshot → Firestore
 */

import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { collectGSC } from './gsc-collector';
import { collectGA4 } from './ga4-collector';
import { loadNoticiasFromFirestore, mergeArticleData } from './data-merger';
import { generateRecommendations } from './editorial-rules';
import { generateComplianceReport } from './compliance';
import { generateReadinessReport } from './readiness';
import { buildGoogleIntelligenceDashboard } from './dashboard';
import { generateGoogleTrustReport } from './google-trust';
import { generateAdSenseRecoveryReport } from './adsense-recovery';
import { generateLearningPatterns, saveLearningPatterns } from './google-feedback';
import { generateWeeklyReport } from './weekly-report';
import { generateContentRecoveryReport } from './content-recovery';
import { generateAdSenseRecoveryFullReport } from './adsense-recovery-report';
import { generateImprovementRecommendations } from './content-improvement';
import { generateContentOpportunityReport } from './opportunity-engine';
import { generateCategoryIntelligence } from './category-intelligence';
import { generateContentMixReport } from './content-mix-intelligence';
import { generateArticleUpdateReport } from './update-engine';
import { generateEditorCEOReport } from './editor-ceo-report';
import { generateMeniLearningFeedback } from './meni-learning';
import { saveDailySnapshot } from './store';
import type { DailySnapshot, NIOSConfig, GoogleIntelligenceDashboard, NIOSWeeklyReport } from './types';
import type { Noticia } from '@/lib/types';

export const NIOS_CONFIG: NIOSConfig = {
  siteUrl: process.env.NIOS_SITE_URL || 'https://nicaraguainformate.com',
  ga4PropertyId: process.env.NIOS_GA4_PROPERTY_ID || '',
  daysToCollect: 28,
  minImpressionsForInsight: 10,
  minArticlesForCompliance: 5,
};

export interface NIOSRunResult {
  success: boolean;
  date: string;
  gscCollected: boolean;
  ga4Collected: boolean;
  articlesAnalyzed: number;
  recommendationsGenerated: number;
  complianceGenerated: boolean;
  readinessGenerated: boolean;
  trustGenerated: boolean;
  adsenseRecoveryGenerated: boolean;
  learningPatternsGenerated: number;
  weeklyReportGenerated: boolean;
  contentRecoveryGenerated: boolean;
  adSenseRecoveryFullReportGenerated: boolean;
  improvementsGenerated: number;
  contentOpportunityGenerated: boolean;
  categoryIntelligenceGenerated: boolean;
  contentMixGenerated: boolean;
  articleUpdateGenerated: boolean;
  editorCEOReportGenerated: boolean;
  meniLearningGenerated: boolean;
  errors: string[];
  summary: string;
}

/**
 * Ejecuta el pipeline completo de NIOS Intelligence Platform.
 */
export async function runNIOSPipeline(
  db: Firestore,
  config: NIOSConfig = NIOS_CONFIG,
): Promise<NIOSRunResult> {
  const errors: string[] = [];
  const now = new Date().toISOString();

  logger.info('[nios-orchestrator] Starting NIOS Intelligence Pipeline...');

  // 1. Collect GSC
  let gsc = null;
  try {
    gsc = await collectGSC(config.siteUrl, config.daysToCollect);
    if (!gsc) {
      errors.push('GSC: No se pudieron obtener datos de Google Search Console.');
    }
  } catch (err) {
    errors.push(`GSC: ${err instanceof Error ? err.message : String(err)}`);
    logger.error('[nios-orchestrator] GSC collection failed:', err);
  }

  // 2. Collect GA4
  let ga4 = null;
  try {
    if (config.ga4PropertyId) {
      ga4 = await collectGA4(config.ga4PropertyId, config.daysToCollect);
      if (!ga4) {
        errors.push('GA4: No se pudieron obtener datos de Google Analytics 4.');
      }
    } else {
      errors.push('GA4: No hay property ID configurado (NIOS_GA4_PROPERTY_ID).');
    }
  } catch (err) {
    errors.push(`GA4: ${err instanceof Error ? err.message : String(err)}`);
    logger.error('[nios-orchestrator] GA4 collection failed:', err);
  }

  // 3. Load noticias from Firestore
  let noticias: Noticia[] = [];
  try {
    noticias = await loadNoticiasFromFirestore(db, 500);
    logger.info(`[nios-orchestrator] Loaded ${noticias.length} articles from Firestore.`);
  } catch (err) {
    errors.push(`Firestore: ${err instanceof Error ? err.message : String(err)}`);
    logger.error('[nios-orchestrator] Firestore load failed:', err);
  }

  // 4. Merge data
  const articles = mergeArticleData(noticias, gsc, ga4);

  // 5. Generate recommendations
  const recommendations = generateRecommendations(articles, gsc, ga4, config.daysToCollect);

  // 6. Generate compliance report
  const compliance = generateComplianceReport(articles, gsc, config.minArticlesForCompliance);

  // 7. Generate readiness report
  const readiness = generateReadinessReport(articles);

  // 8. FASE 2.1: Google Trust Audit
  const trust = generateGoogleTrustReport(articles);

  // 9. FASE 2.2: AdSense Recovery
  const adsenseRecovery = generateAdSenseRecoveryReport(articles, trust);

  // 10. FASE 2.3: Google Feedback Loop
  const learningPatterns = generateLearningPatterns(articles, gsc);
  try {
    await saveLearningPatterns(db, learningPatterns);
  } catch (err) {
    errors.push(`LearningPatterns: ${err instanceof Error ? err.message : String(err)}`);
    logger.error('[nios-orchestrator] Learning patterns save failed:', err);
  }

  // 11. FASE 2.4: Weekly CEO Report
  const weekly: NIOSWeeklyReport = generateWeeklyReport(articles, trust, gsc);
  void weekly;

  // 12. FASE 2.5.1: Content Recovery Analyzer
  const trustMap = new Map<string, { googleTrustScore: number; risk: 'alto' | 'medio' | 'bajo' }>();
  for (const a of trust.articles) {
    trustMap.set(a.slug, { googleTrustScore: a.googleTrustScore, risk: a.risk });
  }
  const contentRecovery = generateContentRecoveryReport(articles, trustMap);

  // 13. FASE 2.5.4: Content Improvement Engine
  const sourceTraffic: Record<string, number> = {};
  if (ga4) {
    for (const s of ga4.sources) {
      sourceTraffic[s.source] = (sourceTraffic[s.source] || 0) + s.users;
    }
  }
  const improvements = generateImprovementRecommendations(articles, sourceTraffic);

  // 14. FASE 2.5.5: AdSense Recovery Full Report
  const adSenseRecoveryFullReport = await generateAdSenseRecoveryFullReport(
    articles,
    ga4 ? { totalUsers: ga4.totalUsers, averageEngagementTimeSec: ga4.averageEngagementTimeSec, devices: ga4.devices } : null,
    sourceTraffic,
  );

  // 15. FASE 3.1: Content Opportunity Engine
  const contentOpportunity = generateContentOpportunityReport(articles, gsc);

  // 16. FASE 3.2: Category Intelligence
  const categoryIntelligence = generateCategoryIntelligence(articles, gsc, ga4, trust);

  // 17. FASE 3.3: Content Mix Optimizer
  const contentMix = generateContentMixReport(articles, gsc, ga4, trust);

  // 18. FASE 3.4: Article Update Intelligence
  const articleUpdate = generateArticleUpdateReport(articles);

  // 19. FASE 3.6: Aprendizaje MENI
  let meniLearning = null;
  try {
    meniLearning = await generateMeniLearningFeedback(db, articles);
  } catch (err) {
    errors.push(`MeniLearning: ${err instanceof Error ? err.message : String(err)}`);
    logger.error('[nios-orchestrator] MeniLearning failed:', err);
  }

  // 20. FASE 3.5: Editor CEO Report
  const editorCEOReport = generateEditorCEOReport(articles, gsc, ga4, trust, meniLearning);

  // 21. Build dashboard
  const _dashboard: GoogleIntelligenceDashboard = buildGoogleIntelligenceDashboard(articles, gsc, ga4, recommendations);
  void _dashboard;

  // 22. Save daily snapshot
  const snapshot: Omit<DailySnapshot, 'date'> = {
    collectedAt: now,
    gsc,
    ga4,
    articlesFused: articles,
    recommendations,
    compliance,
    readiness,
    trust,
    learningPatterns,
    contentRecovery,
    adSenseRecoveryFullReport,
    contentOpportunity,
    categoryIntelligence,
    contentMix,
    articleUpdate,
    editorCEOReport,
    meniLearning,
  };

  try {
    await saveDailySnapshot(db, snapshot);
  } catch (err) {
    errors.push(`Save: ${err instanceof Error ? err.message : String(err)}`);
    logger.error('[nios-orchestrator] Save failed:', err);
  }

  // Summary
  const summary = `NIOS Pipeline completado. GSC: ${gsc ? `${gsc.totalImpressions} impresiones, ${gsc.totalClicks} clics` : 'sin datos'}. GA4: ${ga4 ? `${ga4.totalUsers} usuarios, ${ga4.totalSessions} sesiones` : 'sin datos'}. Artículos: ${articles.length}. Recomendaciones: ${recommendations.length}. Recovery: GREEN ${contentRecovery.greenPct}%, YELLOW ${contentRecovery.yellowPct}%, RED ${contentRecovery.redPct}%. Trust: ${trust.averageGoogleTrustScore}/100. Mejoras: ${improvements.length}. Learning patterns: ${learningPatterns.length}.`;

  logger.info(`[nios-orchestrator] ${summary}`);

  return {
    success: errors.length === 0,
    date: new Date().toISOString().split('T')[0],
    gscCollected: !!gsc,
    ga4Collected: !!ga4,
    articlesAnalyzed: articles.length,
    recommendationsGenerated: recommendations.length,
    complianceGenerated: !!compliance,
    readinessGenerated: !!readiness,
    trustGenerated: !!trust,
    adsenseRecoveryGenerated: !!adsenseRecovery,
    learningPatternsGenerated: learningPatterns.length,
    weeklyReportGenerated: !!weekly,
    contentRecoveryGenerated: !!contentRecovery,
    adSenseRecoveryFullReportGenerated: !!adSenseRecoveryFullReport,
    improvementsGenerated: improvements.length,
    contentOpportunityGenerated: !!contentOpportunity,
    categoryIntelligenceGenerated: !!categoryIntelligence,
    contentMixGenerated: !!contentMix,
    articleUpdateGenerated: !!articleUpdate,
    editorCEOReportGenerated: !!editorCEOReport,
    meniLearningGenerated: !!meniLearning,
    errors,
    summary,
  };
}
