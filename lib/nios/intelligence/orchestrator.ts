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
import type {
  DailySnapshot,
  NIOSConfig,
  NIOSWeeklyReport,
  ArticleFusion,
  GoogleTrustReport,
  GoogleLearningPattern,
  NIOSRecommendation,
  ImprovementRecommendation,
  ContentRecoveryReport,
  MeniLearningFeedback,
} from './types';
import type { Noticia } from '@/lib/types';
import { generateTrafficPerformance, type TrafficPerformance } from '@/lib/analytics/traffic-aggregator';
import { getTrafficMigrationStatus } from '@/lib/analytics/traffic-reader';
import { measureAsync, measureSync, saveTelemetry } from './telemetry';
import { buildExecutionReport } from './performance-report';
import { calculateHealthScore } from './health-score';
import { filterAbsurdNIOSRecommendations, filterAbsurdImprovementRecommendations } from './absurd-recommendation-guard';

export const NIOS_CONFIG: NIOSConfig = {
  siteUrl: process.env.NIOS_GSC_SITE_URL || process.env.NIOS_SITE_URL || 'https://nicaraguainformate.com',
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
  trafficPerformanceGenerated: boolean;
  errors: string[];
  summary: string;
}

/**
 * Ejecuta el pipeline completo de NIOS Intelligence Platform.
 * FASE 3.6: instrumentado con telemetría no invasiva.
 */
export async function runNIOSPipeline(
  db: Firestore,
  config: NIOSConfig = NIOS_CONFIG,
): Promise<NIOSRunResult> {
  const errors: string[] = [];
  const now = new Date().toISOString();
  const metrics: { module: string; durationMs: number; status: 'success' | 'error'; error?: string; memoryMB?: number }[] = [];

  function collectMetric(
    name: string,
    status: 'success' | 'error',
    durationMs: number,
    error?: string,
    memoryMB?: number,
  ) {
    metrics.push({ module: name, durationMs, status, error, memoryMB });
  }

  const [
    { collectGSC },
    { collectGA4 },
    { loadNoticiasFromFirestore, mergeArticleData },
    { generateRecommendations },
    { generateComplianceReport },
    { generateReadinessReport },
    { buildGoogleIntelligenceDashboard },
    { generateGoogleTrustReport },
    { generateAdSenseRecoveryReport },
    { generateLearningPatterns, saveLearningPatterns },
    { generateWeeklyReport },
    { generateContentRecoveryReport },
    { generateAdSenseRecoveryFullReport },
    { generateImprovementRecommendations },
    { generateContentOpportunityReport },
    { generateCategoryIntelligence },
    { generateContentMixReport },
    { generateArticleUpdateReport },
    { generateEditorCEOReport },
    { generateMeniLearningFeedback },
    { saveDailySnapshot, getLatestSnapshot },
    { emitMomentumAlerts },
  ] = await Promise.all([
    import('./gsc-collector'),
    import('./ga4-collector'),
    import('./data-merger'),
    import('./editorial-rules'),
    import('./compliance'),
    import('./readiness'),
    import('./dashboard'),
    import('./google-trust'),
    import('./adsense-recovery'),
    import('./google-feedback'),
    import('./weekly-report'),
    import('./content-recovery'),
    import('./adsense-recovery-report'),
    import('./content-improvement'),
    import('./opportunity-engine'),
    import('./category-intelligence'),
    import('./content-mix-intelligence'),
    import('./update-engine'),
    import('./editor-ceo-report'),
    import('./meni-learning'),
    import('./store'),
    import('./alerts'),
  ] as const);

  logger.info('[nios-orchestrator] Starting NIOS Intelligence Pipeline...');

  // 0. Load previous snapshot for momentum baseline
  let previousSnapshot: DailySnapshot | null = null;
  try {
    previousSnapshot = await getLatestSnapshot(db);
  } catch (err) {
    logger.warn('[nios-orchestrator] Could not load previous snapshot:', err);
  }

  // 1. Collect GSC
  let gsc = null;
  try {
    const { result, metric } = await measureAsync('gsc-collector', () =>
      collectGSC(config.siteUrl, config.daysToCollect),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    gsc = result;
    if (!gsc) {
      gsc = null;
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('gsc-collector', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`GSC: ${error}`);
    logger.error('[nios-orchestrator] GSC collection failed:', err);
  }

  // 2. Collect GA4
  let ga4 = null;
  try {
    if (config.ga4PropertyId) {
      const { result, metric } = await measureAsync('ga4-collector', () =>
        collectGA4(config.ga4PropertyId, config.daysToCollect),
      );
      collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
      ga4 = result;
      if (!ga4) {
        ga4 = null;
      }
    } else {
      collectMetric('ga4-collector', 'error', 0, 'Missing NIOS_GA4_PROPERTY_ID');
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('ga4-collector', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`GA4: ${error}`);
    logger.error('[nios-orchestrator] GA4 collection failed:', err);
  }

  // 3. Load noticias from Firestore
  let noticias: Noticia[] = [];
  try {
    const { result, metric } = await measureAsync('data-merger.load', () =>
      loadNoticiasFromFirestore(db, 500),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    noticias = result;
    logger.info(`[nios-orchestrator] Loaded ${noticias.length} articles from Firestore.`);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('data-merger.load', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Firestore: ${error}`);
    logger.error('[nios-orchestrator] Firestore load failed:', err);
  }

  // 4. Merge data
  let articles: ArticleFusion[] = [];
  try {
    const { result, metric } = measureSync('data-merger.merge', () =>
      mergeArticleData(noticias, gsc, ga4),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    articles = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('data-merger.merge', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Merge: ${error}`);
    logger.error('[nios-orchestrator] Merge failed:', err);
    articles = [];
  }

  // 5. Generate recommendations
  let recommendations: NIOSRecommendation[] = [];
  try {
    const { result, metric } = measureSync('recommendations', () =>
      generateRecommendations(articles, gsc, ga4, config.daysToCollect),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    recommendations = filterAbsurdNIOSRecommendations(result, articles);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('recommendations', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Recommendations: ${error}`);
    logger.error('[nios-orchestrator] Recommendations failed:', err);
  }

  // 6. Generate compliance report
  let compliance = null;
  try {
    const { result, metric } = measureSync('compliance', () =>
      generateComplianceReport(articles, gsc, config.minArticlesForCompliance),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    compliance = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('compliance', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Compliance: ${error}`);
    logger.error('[nios-orchestrator] Compliance failed:', err);
  }

  // 7. Generate readiness report
  let readiness = null;
  try {
    const { result, metric } = measureSync('readiness', () =>
      generateReadinessReport(articles),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    readiness = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('readiness', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Readiness: ${error}`);
    logger.error('[nios-orchestrator] Readiness failed:', err);
  }

  // 8. FASE 2.1: Google Trust Audit
  let trust: GoogleTrustReport | null = null;
  try {
    const { result, metric } = measureSync('google-trust', () =>
      generateGoogleTrustReport(articles),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    trust = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('google-trust', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Trust: ${error}`);
    logger.error('[nios-orchestrator] Trust failed:', err);
  }

  // 9. FASE 2.2: AdSense Recovery
  let adsenseRecovery = null;
  try {
    const { result, metric } = measureSync('adsense-recovery', () =>
      generateAdSenseRecoveryReport(articles, trust!),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    adsenseRecovery = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('adsense-recovery', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`AdSense: ${error}`);
    logger.error('[nios-orchestrator] AdSense recovery failed:', err);
  }

  // 10. FASE 2.3: Google Feedback Loop
  let learningPatterns: GoogleLearningPattern[] = [];
  try {
    const { result, metric } = measureSync('feedback-patterns', () =>
      generateLearningPatterns(articles, gsc),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    learningPatterns = result;

    await measureAsync('feedback-save', () => saveLearningPatterns(db, learningPatterns));
    collectMetric('feedback-save', 'success', 0, undefined, undefined);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number; module?: string } }).metric;
    const moduleName = metric?.module || 'feedback-loop';
    collectMetric(moduleName, 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`LearningPatterns: ${error}`);
    logger.error('[nios-orchestrator] Learning patterns failed:', err);
  }

  // 11. FASE 2.4: Weekly CEO Report
  let weekly: NIOSWeeklyReport | null = null;
  try {
    const { result, metric } = measureSync('weekly-report', () =>
      generateWeeklyReport(articles, trust!, gsc),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    weekly = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('weekly-report', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Weekly: ${error}`);
    logger.error('[nios-orchestrator] Weekly report failed:', err);
  }

  // 12. FASE 2.5.1: Content Recovery Analyzer
  let contentRecovery: ContentRecoveryReport | null = null;
  try {
    const trustMap = new Map<string, { googleTrustScore: number; risk: 'alto' | 'medio' | 'bajo' }>();
    if (trust) {
      for (const a of trust.articles) {
        trustMap.set(a.slug, { googleTrustScore: a.googleTrustScore, risk: a.risk });
      }
    }
    const { result, metric } = measureSync('content-recovery', () =>
      generateContentRecoveryReport(articles, trustMap),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    contentRecovery = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('content-recovery', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`ContentRecovery: ${error}`);
    logger.error('[nios-orchestrator] Content recovery failed:', err);
  }

  // 13. FASE 2.5.4: Content Improvement Engine
  let improvements: ImprovementRecommendation[] = [];
  try {
    const sourceTraffic: Record<string, number> = {};
    if (ga4) {
      for (const s of ga4.sources) {
        sourceTraffic[s.source] = (sourceTraffic[s.source] || 0) + s.users;
      }
    }
    const { result, metric } = measureSync('improvements', () =>
      generateImprovementRecommendations(articles, sourceTraffic),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    improvements = filterAbsurdImprovementRecommendations(result, articles);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('improvements', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Improvements: ${error}`);
    logger.error('[nios-orchestrator] Improvements failed:', err);
  }

  // 14. FASE 2.5.5: AdSense Recovery Full Report
  let adSenseRecoveryFullReport = null;
  try {
    const { result, metric } = await measureAsync('adsense-full-report', async () =>
      generateAdSenseRecoveryFullReport(
        articles,
        ga4 ? { totalUsers: ga4.totalUsers, averageEngagementTimeSec: ga4.averageEngagementTimeSec, devices: ga4.devices } : null,
        {},
      ),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    adSenseRecoveryFullReport = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('adsense-full-report', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`AdSenseFull: ${error}`);
    logger.error('[nios-orchestrator] AdSense full report failed:', err);
  }

  // 15. FASE 3.1: Content Opportunity Engine
  let contentOpportunity = null;
  try {
    const { result, metric } = measureSync('opportunity', () =>
      generateContentOpportunityReport(articles, gsc),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    contentOpportunity = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('opportunity', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Opportunity: ${error}`);
    logger.error('[nios-orchestrator] Opportunity failed:', err);
  }

  // 16. FASE 3.2: Category Intelligence
  let categoryIntelligence = null;
  try {
    const { result, metric } = measureSync('category-intelligence', () =>
      generateCategoryIntelligence(articles, gsc, ga4, trust!),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    categoryIntelligence = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('category-intelligence', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Category: ${error}`);
    logger.error('[nios-orchestrator] Category intelligence failed:', err);
  }

  // 17. FASE 3.3: Content Mix Optimizer
  let contentMix = null;
  try {
    const { result, metric } = measureSync('content-mix', () =>
      generateContentMixReport(articles, gsc, ga4, trust!),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    contentMix = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('content-mix', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`ContentMix: ${error}`);
    logger.error('[nios-orchestrator] Content mix failed:', err);
  }

  // 18. FASE 3.4: Article Update Intelligence
  let articleUpdate = null;
  try {
    const { result, metric } = measureSync('update-engine', () =>
      generateArticleUpdateReport(articles),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    articleUpdate = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('update-engine', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Update: ${error}`);
    logger.error('[nios-orchestrator] Update engine failed:', err);
  }

  // 19. FASE 3.6: Aprendizaje MENI
  let meniLearning: MeniLearningFeedback | null = null;
  try {
    const { result, metric } = await measureAsync('meni-learning', () =>
      generateMeniLearningFeedback(db, articles),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    meniLearning = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('meni-learning', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`MeniLearning: ${error}`);
    logger.error('[nios-orchestrator] MeniLearning failed:', err);
  }

  // 20. FASE 3.5: Editor CEO Report
  let editorCEOReport = null;
  try {
    const { result, metric } = measureSync('editor-ceo', () =>
      generateEditorCEOReport(articles, gsc, ga4, trust!, meniLearning),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    editorCEOReport = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('editor-ceo', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`EditorCEO: ${error}`);
    logger.error('[nios-orchestrator] Editor CEO failed:', err);
  }

  // 21. FASE 3.7: Traffic Intelligence
  let trafficPerformance: TrafficPerformance | null = null;
  try {
    const { result, metric } = await measureAsync('traffic-performance', () =>
      generateTrafficPerformance(db),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    trafficPerformance = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('traffic-performance', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`TrafficPerformance: ${error}`);
    logger.error('[nios-orchestrator] Traffic performance failed:', err);
  }

  // 22. Build dashboard
  try {
    const { metric } = measureSync('dashboard', () =>
      buildGoogleIntelligenceDashboard(articles, gsc, ga4, recommendations),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('dashboard', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Dashboard: ${error}`);
    logger.error('[nios-orchestrator] Dashboard failed:', err);
  }

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
    trafficPerformance,
  };

  let snapshotSizeEstimate = 0;
  try {
    const { metric } = await measureAsync('snapshot-save', () =>
      saveDailySnapshot(db, snapshot),
    );
    collectMetric(metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    snapshotSizeEstimate = JSON.stringify(snapshot).length;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric('snapshot-save', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Save: ${error}`);
    logger.error('[nios-orchestrator] Save failed:', err);
  }

  // 24. Build and save telemetry (FASE 3.6 + 3.7)
  const date = new Date().toISOString().split('T')[0];
  const totalDuration = metrics.reduce((sum, m) => sum + m.durationMs, 0);

  // Estimación conservadora de operaciones Firestore
  const firestoreReads = noticias.length + 2; // load + snapshot/telemetry existing checks
  const firestoreWrites =
    1 + // snapshot metadata
    articles.length + // articles subcollection
    12 + // reports subcollection aprox
    learningPatterns.length + // feedback patterns
    1 + // telemetry
    1; // traffic_performance snapshot field

  // FASE 3.7: tráfico y costo
  const trafficLogWrites = trafficPerformance
    ? Object.values(trafficPerformance.dailyGrowth).reduce((s, v) => s + v, 0)
    : 0;
  const trafficDailyWrites = trafficPerformance
    ? Object.keys(trafficPerformance.dailyGrowth).length
    : 0;
  const dailyTotalViews = trafficLogWrites;

  const estimatedMonthlyCostUSD = parseFloat(
    ((firestoreWrites * 0.00000185 + firestoreReads * 0.0000006 + trafficLogWrites * 30 * 0.00000185) * 30).toFixed(2),
  );

  const healthSignals: string[] = [];
  if (articles.length > 400) healthSignals.push('Snapshot particionado (>400 artículos)');
  if (totalDuration > 15000) healthSignals.push('Pipeline lento (>15s)');
  if (errors.length > 0) healthSignals.push(`${errors.length} errores en ejecución`);
  if (trafficLogWrites > 0 && trafficDailyWrites === 0) healthSignals.push('traffic_log sin agregación diaria');

  const report = buildExecutionReport(
    date,
    metrics.map((m) => ({
      module: m.module,
      durationMs: m.durationMs,
      status: m.status,
      error: m.error,
      memoryMB: m.memoryMB,
      timestamp: '',
    })),
    { reads: firestoreReads, writes: firestoreWrites, deletes: 0 },
    healthSignals,
    errors,
    articles.length,
    snapshotSizeEstimate,
    { trafficLogWrites, trafficDailyWrites, dailyTotalViews },
    {
      monthlyFirestoreWrites: firestoreWrites * 30,
      monthlyFirestoreReads: firestoreReads * 30,
      estimatedMonthlyCostUSD,
    },
  );

  const trafficLogHasTTL = process.env.NIOS_TRAFFIC_LOG_TTL === '1';
  const health = calculateHealthScore(report, trafficLogHasTTL);
  let trafficMigration: any = { dailyGenerated: false, fallbackReads: 0, migrationHealth: 0 };
  try {
    trafficMigration = await getTrafficMigrationStatus(db);
  } catch (err) {
    logger.warn('[nios-orchestrator] getTrafficMigrationStatus failed (expected outside Next.js):', err);
  }

  try {
    await saveTelemetry(db, date, report, health, trafficMigration);
  } catch (err) {
    logger.error('[nios-orchestrator] Telemetry save failed:', err);
    // Telemetry falla no rompe el pipeline
  }

  // Summary
  const gscText = gsc
    ? gsc.status === 'REAL'
      ? `${gsc.totalImpressions} impresiones, ${gsc.totalClicks} clics`
      : `estado ${gsc.status}`
    : 'sin datos';
  const ga4Text = ga4
    ? ga4.status === 'REAL'
      ? `${ga4.totalUsers} usuarios, ${ga4.totalSessions} sesiones`
      : `estado ${ga4.status}`
    : 'sin datos';
  const summary = `NIOS Pipeline completado. GSC: ${gscText}. GA4: ${ga4Text}. Artículos: ${articles.length}. Recomendaciones: ${recommendations.length}. Recovery: GREEN ${contentRecovery?.greenPct ?? 0}%, YELLOW ${contentRecovery?.yellowPct ?? 0}%, RED ${contentRecovery?.redPct ?? 0}%. Trust: ${trust?.averageGoogleTrustScore ?? 0}/100. Mejoras: ${improvements.length}. Learning patterns: ${learningPatterns.length}. Health: ${health.score}/100.`;

  logger.info(`[nios-orchestrator] ${summary}`);

  // 25. Emit momentum alerts (BREAKOUT → nios_alerts)
  try {
    if (trafficPerformance) {
      await emitMomentumAlerts(db, trafficPerformance, previousSnapshot?.trafficPerformance ?? null);
    }
  } catch (err) {
    logger.warn('[nios-orchestrator] Momentum alert emit failed (non-fatal):', err);
  }

  return {
    success: errors.length === 0,
    date,
    gscCollected: gsc?.status === 'REAL',
    ga4Collected: ga4?.status === 'REAL',
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
    trafficPerformanceGenerated: !!trafficPerformance,
    errors,
    summary,
  };
}
