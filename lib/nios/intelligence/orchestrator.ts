/**
 * NIOS Intelligence Platform — Orchestrator (phased, Vercel Hobby 60s-safe)
 * ========================================================================
 * Ejecuta el pipeline completo de recolección, fusión, análisis y persistencia.
 *
 * Arquitectura por fases (resumible, durable en Firestore):
 *
 *   FASE collect  → GSC + GA4 + carga Firestore + merge → persiste articles
 *                  fusionados y estado en nios_runs/{date}/pipeline/*.
 *   FASE analyze  → todos los generadores de reportes + snapshot diario +
 *                  telemetría + momentum alerts.
 *
 * Cada fase cabe holgada en el límite de 60s de Vercel Hobby. La ruta cron
 * /api/cron/nios-collect?stage=collect|analyze|ceo|finalize las orquesta con
 * cron entries escalonados (vercel.json). runNIOSPipeline() sigue existiendo
 * y ejecuta ambas fases en una sola invocación (uso admin/tests), con el
 * mismo comportamiento y orden que antes.
 *
 * Pipeline (igual que antes):
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
import { checkTrafficLogHasTTL } from '@/lib/analytics/traffic-ttl';
import { measureAsync, measureSync, saveTelemetry } from './telemetry';
import { buildExecutionReport } from './performance-report';
import { calculateHealthScore } from './health-score';
import { filterAbsurdNIOSRecommendations, filterAbsurdImprovementRecommendations } from './absurd-recommendation-guard';
import { removeUndefined } from './store';

export const NIOS_CONFIG: NIOSConfig = {
  siteUrl: process.env.GSC_PROPERTY || process.env.NIOS_GSC_SITE_URL || 'sc-domain:nicaraguainformate.com',
  ga4PropertyId: process.env.NIOS_GA4_PROPERTY_ID || '',
  daysToCollect: 7,
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

// ─── Estado compartido entre fases ──────────────────────────────────────────

export interface PipelineMetric {
  module: string;
  durationMs: number;
  status: 'success' | 'error';
  error?: string;
  memoryMB?: number;
}

/** Contexto serializable que viaja entre la fase collect y analyze. */
export interface PipelineContext {
  config: NIOSConfig;
  errors: string[];
  metrics: PipelineMetric[];
  gsc: unknown;
  ga4: unknown;
  articles: ArticleFusion[];
  noticiasCount: number;
  /** trafficPerformance del snapshot anterior (solo para momentum alerts). */
  previousTrafficPerformance: TrafficPerformance | null;
}

export function createPipelineContext(config: NIOSConfig = NIOS_CONFIG): PipelineContext {
  return {
    config,
    errors: [],
    metrics: [],
    gsc: null,
    ga4: null,
    articles: [],
    noticiasCount: 0,
    previousTrafficPerformance: null,
  };
}

function collectMetric(
  ctx: PipelineContext,
  name: string,
  status: 'success' | 'error',
  durationMs: number,
  error?: string,
  memoryMB?: number,
) {
  ctx.metrics.push({ module: name, durationMs, status, error, memoryMB });
}

// ─── Persistencia del estado entre invocaciones (Firestore) ─────────────────
// Vive en nios_runs/{date}/pipeline/* — la misma colección que usa la ruta
// cron para el lease y el estado por etapas. Los objetos gsc/ga4/articles son
// JSON-plain (los mismos que saveDailySnapshot ya persiste inline/subcolección).

const STATE_COLLECTION = 'pipeline_state';
const ARTICLES_COLLECTION = 'pipeline_articles';
// Artículos persistidos en chunks JSON (no 1 doc/artículo): leer 10 docs
// (~1s) en vez de ~500 (~10s) — diferencia crítica dentro del límite de 60s.
const ARTICLES_PER_CHUNK = 50;

export async function persistPipelineArticles(
  db: Firestore,
  date: string,
  articles: ArticleFusion[],
): Promise<void> {
  const col = db.collection('nios_runs').doc(date).collection(ARTICLES_COLLECTION);
  for (let start = 0; start < articles.length; start += ARTICLES_PER_CHUNK) {
    const chunk = articles.slice(start, start + ARTICLES_PER_CHUNK);
    await col
      .doc(`chunk-${String(Math.floor(start / ARTICLES_PER_CHUNK)).padStart(3, '0')}`)
      .set({ articles: removeUndefined(chunk) });
  }
}

export async function persistPipelineState(
  db: Firestore,
  date: string,
  state: { gsc: unknown; ga4: unknown; meta: Record<string, unknown> },
): Promise<void> {
  const col = db.collection('nios_runs').doc(date).collection(STATE_COLLECTION);
  const batch = db.batch();
  batch.set(col.doc('gsc'), { data: removeUndefined(state.gsc ?? null) });
  batch.set(col.doc('ga4'), { data: removeUndefined(state.ga4 ?? null) });
  batch.set(col.doc('meta'), removeUndefined(state.meta) as Record<string, unknown>);
  await batch.commit();
}

/**
 * Elimina el estado intermedio del pipeline tras un analyze exitoso:
 * los artículos ya viven en nios_daily_snapshots/{date}/articles y los
 * datos gsc/ga4 en la metadata del snapshot. Sin limpieza se acumularían
 * ~500 docs/día en nios_runs para siempre.
 */
export async function cleanupPipelineState(db: Firestore, date: string): Promise<void> {
  const runDoc = db.collection('nios_runs').doc(date);
  // pipeline_state/meta se conserva: contiene telemetryInput que consume la
  // etapa finalize (runDeferredTelemetry). Se borra al cerrar el run.
  const keepDocs = new Set(['meta']);
  for (const coll of [ARTICLES_COLLECTION, STATE_COLLECTION]) {
    const snap = await runDoc.collection(coll).limit(600).get();
    const docs = snap.docs.filter((d) => !(coll === STATE_COLLECTION && keepDocs.has(d.id)));
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch();
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

/** Borra los últimos restos del estado del pipeline (meta.telemetryInput)
 *  una vez que finalize consumió la telemetría diferida. */
export async function cleanupPipelineMeta(db: Firestore, date: string): Promise<void> {
  const runDoc = db.collection('nios_runs').doc(date);
  const metaRef = runDoc.collection(STATE_COLLECTION).doc('meta');
  const snap = await metaRef.get();
  if (snap.exists) await metaRef.delete();
}

export async function loadPipelineArticles(db: Firestore, date: string): Promise<ArticleFusion[]> {
  const snap = await db
    .collection('nios_runs').doc(date).collection(ARTICLES_COLLECTION)
    .get();
  return snap.docs
    .sort((a, b) => a.id.localeCompare(b.id))
    .flatMap((d) => (d.data().articles as ArticleFusion[]) ?? []);
}

export async function loadPipelineState(db: Firestore, date: string): Promise<{
  gsc: unknown;
  ga4: unknown;
  meta: Record<string, unknown>;
}> {
  const col = db.collection('nios_runs').doc(date).collection(STATE_COLLECTION);
  const [gscDoc, ga4Doc, metaDoc] = await Promise.all([col.doc('gsc').get(), col.doc('ga4').get(), col.doc('meta').get()]);
  return {
    gsc: gscDoc.data()?.data ?? null,
    ga4: ga4Doc.data()?.data ?? null,
    meta: (metaDoc.data() as Record<string, unknown>) ?? {},
  };
}

/**
 * Lee únicamente el trafficPerformance del snapshot más reciente, sin
 * ensamblar los ~700 artículos de la subcolección (la lectura completa
 * costaba ~15s dentro del presupuesto de 60s de Vercel).
 */
export async function getLatestTrafficPerformance(
  db: Firestore,
): Promise<TrafficPerformance | null> {
  try {
    const { getHistoricalSnapshots, getSnapshotByDate } = await import('./store');
    const latest = await getHistoricalSnapshots(db, 1);
    if (latest.length === 0) return null;
    const snap = await getSnapshotByDate(db, latest[0].date);
    return (snap?.trafficPerformance as TrafficPerformance | undefined) ?? null;
  } catch (err) {
    logger.warn('[nios-orchestrator] Could not load previous trafficPerformance:', err);
    return null;
  }
}

// ─── FASE collect: recolección + fusión (~30s) ──────────────────────────────

/**
 * Ejecuta los pasos 0-4 del pipeline: snapshot previo (liviano), GSC, GA4,
 * carga de noticias y merge. Persiste articles + estado para la fase analyze.
 * NO guarda el snapshot diario — eso ocurre en analyze.
 */
export async function runPipelineCollectPhase(
  db: Firestore,
  ctx: PipelineContext,
): Promise<{ articlesCount: number }> {
  const { config } = ctx;
  const [
    { collectGSC },
    { collectGA4 },
    { loadNoticiasFromFirestore, mergeArticleData },
  ] = await Promise.all([
    import('./gsc-collector'),
    import('./ga4-collector'),
    import('./data-merger'),
  ] as const);

  logger.info('[nios-orchestrator:collect] Starting collection phase...');

  // 0. Baseline de momentum: solo trafficPerformance del snapshot previo
  //    (lectura dirigida; NO se ensamblan los ~700 artículos).
  try {
    ctx.previousTrafficPerformance = await getLatestTrafficPerformance(db);
  } catch (err) {
    logger.warn('[nios-orchestrator:collect] Could not load previous trafficPerformance:', err);
  }

  // 1. Collect GSC
  try {
    const { result, metric } = await measureAsync('gsc-collector', () =>
      collectGSC(config.siteUrl, config.daysToCollect),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    ctx.gsc = result ?? null;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'gsc-collector', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    ctx.errors.push(`GSC: ${error}`);
    logger.error('[nios-orchestrator:collect] GSC collection failed:', err);
  }

  // 2. Collect GA4
  try {
    if (config.ga4PropertyId) {
      const { result, metric } = await measureAsync('ga4-collector', () =>
        collectGA4(config.ga4PropertyId, config.daysToCollect),
      );
      collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
      ctx.ga4 = result ?? null;
    } else {
      collectMetric(ctx, 'ga4-collector', 'error', 0, 'Missing NIOS_GA4_PROPERTY_ID');
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'ga4-collector', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    ctx.errors.push(`GA4: ${error}`);
    logger.error('[nios-orchestrator:collect] GA4 collection failed:', err);
  }

  // 3. Load noticias from Firestore
  let noticias: Noticia[] = [];
  try {
    const { result, metric } = await measureAsync('data-merger.load', () =>
      loadNoticiasFromFirestore(db, 500),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    noticias = result;
    ctx.noticiasCount = noticias.length;
    logger.info(`[nios-orchestrator:collect] Loaded ${noticias.length} articles from Firestore.`);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'data-merger.load', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    ctx.errors.push(`Firestore: ${error}`);
    logger.error('[nios-orchestrator:collect] Firestore load failed:', err);
  }

  // 4. Merge data
  try {
    const { result, metric } = measureSync('data-merger.merge', () =>
      mergeArticleData(noticias, ctx.gsc as never, ctx.ga4 as never),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    ctx.articles = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'data-merger.merge', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    ctx.errors.push(`Merge: ${error}`);
    logger.error('[nios-orchestrator:collect] Merge failed:', err);
    ctx.articles = [];
  }

  return { articlesCount: ctx.articles.length };
}

/**
 * Persiste el contexto de la fase collect en nios_runs/{date}/pipeline/*
 * para que la fase analyze (otra invocación) lo recupere.
 */
export async function persistCollectPhase(
  db: Firestore,
  date: string,
  ctx: PipelineContext,
): Promise<void> {
  await persistPipelineArticles(db, date, ctx.articles);
  await persistPipelineState(db, date, {
    gsc: ctx.gsc,
    ga4: ctx.ga4,
    meta: {
      errors: ctx.errors,
      metrics: ctx.metrics,
      noticiasCount: ctx.noticiasCount,
      articlesCount: ctx.articles.length,
      previousTrafficPerformance: ctx.previousTrafficPerformance,
    },
  });
}

/**
 * Reconstruye el PipelineContext a partir de Firestore (fase analyze).
 */
export async function restorePipelineContext(
  db: Firestore,
  date: string,
  config: NIOSConfig = NIOS_CONFIG,
): Promise<PipelineContext> {
  const [articles, state] = await Promise.all([
    loadPipelineArticles(db, date),
    loadPipelineState(db, date),
  ]);
  const meta = state.meta as {
    errors?: string[];
    metrics?: PipelineMetric[];
    noticiasCount?: number;
    previousTrafficPerformance?: TrafficPerformance | null;
  };
  const ctx = createPipelineContext(config);
  ctx.articles = articles;
  ctx.gsc = state.gsc;
  ctx.ga4 = state.ga4;
  ctx.errors = meta.errors ?? [];
  ctx.metrics = meta.metrics ?? [];
  ctx.noticiasCount = meta.noticiasCount ?? articles.length;
  ctx.previousTrafficPerformance = meta.previousTrafficPerformance ?? null;
  return ctx;
}

// ─── FASE analyze: reportes + snapshot (~40s) ───────────────────────────────

/** Datos mínimos y serializables que la etapa finalize necesita para
 *  reconstruir y guardar la telemetría + emitir momentum alerts sin
 *  re-ejecutar el pipeline. */
export interface PipelineTelemetryInput {
  date: string;
  metrics: PipelineMetric[];
  errors: string[];
  articlesCount: number;
  noticiasCount: number;
  learningPatternsCount: number;
  snapshotSizeEstimate: number;
  trafficPerformance: TrafficPerformance | null;
  previousTrafficPerformance: TrafficPerformance | null;
}

interface TelemetryComputation {
  report: ReturnType<typeof buildExecutionReport>;
  healthSignals: string[];
  firestoreReads: number;
  firestoreWrites: number;
  trafficLogWrites: number;
  trafficDailyWrites: number;
  dailyTotalViews: number;
  estimatedMonthlyCostUSD: number;
}

function computeTelemetryReport(input: PipelineTelemetryInput): TelemetryComputation {
  const { metrics, errors, articlesCount, noticiasCount, learningPatternsCount, snapshotSizeEstimate, trafficPerformance } = input;
  const totalDuration = metrics.reduce((sum, m) => sum + m.durationMs, 0);

  // Estimación conservadora de operaciones Firestore
  const firestoreReads = noticiasCount + 2; // load + snapshot/telemetry existing checks
  const firestoreWrites =
    1 + // snapshot metadata
    articlesCount + // articles subcollection
    12 + // reports subcollection aprox
    learningPatternsCount + // feedback patterns
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
  if (articlesCount > 400) healthSignals.push('Snapshot particionado (>400 artículos)');
  if (totalDuration > 15000) healthSignals.push('Pipeline lento (>15s)');
  if (errors.length > 0) healthSignals.push(`${errors.length} errores en ejecución`);
  if (trafficLogWrites > 0 && trafficDailyWrites === 0) healthSignals.push('traffic_log sin agregación diaria');

  const report = buildExecutionReport(
    input.date,
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
    articlesCount,
    snapshotSizeEstimate,
    { trafficLogWrites, trafficDailyWrites, dailyTotalViews },
    {
      monthlyFirestoreWrites: firestoreWrites * 30,
      monthlyFirestoreReads: firestoreReads * 30,
      estimatedMonthlyCostUSD,
    },
  );

  return { report, healthSignals, firestoreReads, firestoreWrites, trafficLogWrites, trafficDailyWrites, dailyTotalViews, estimatedMonthlyCostUSD };
}

/**
 * Ejecuta los pasos 5-23 del pipeline: todos los generadores de reportes y
 * el guardado del snapshot diario. Devuelve el NIOSRunResult completo.
 *
 * La telemetría (saveTelemetry) y los momentum alerts son la parte con más
 * I/O del tramo final; con `deferTelemetrySave: true` (modo por etapas) se
 * persisten los insumos en pipeline_state/meta.telemetryInput y la etapa
 * finalize los consume vía runDeferredTelemetry(). En modo monolítico
 * (runNIOSPipeline) se ejecutan aquí mismo, igual que antes.
 */
export async function runPipelineAnalyzePhase(
  db: Firestore,
  ctx: PipelineContext,
  opts?: { deferTelemetrySave?: boolean },
): Promise<NIOSRunResult> {
  const { config, errors } = ctx;
  const gsc = ctx.gsc as never;
  const ga4 = ctx.ga4 as never;
  const articles = ctx.articles;
  const noticiasCount = ctx.noticiasCount;
  const previousTrafficPerformance = ctx.previousTrafficPerformance;

  const [
    { generateRecommendations },
    { generateComplianceReport },
    { generateReadinessReport },
    { buildGoogleIntelligenceDashboard },
    { generateGoogleTrustReport },
    { generateAdSenseRecoveryReport },
    { generateLearningPatterns, saveLearningPatterns, pruneLearningPatterns },
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
    { saveDailySnapshot },
    { emitMomentumAlerts },
  ] = await Promise.all([
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

  logger.info('[nios-orchestrator:analyze] Starting analyze phase...');

  // 5. Generate recommendations
  let recommendations: NIOSRecommendation[] = [];
  try {
    const { result, metric } = measureSync('recommendations', () =>
      generateRecommendations(articles, gsc, ga4, config.daysToCollect),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    recommendations = filterAbsurdNIOSRecommendations(result, articles);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'recommendations', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Recommendations: ${error}`);
    logger.error('[nios-orchestrator:analyze] Recommendations failed:', err);
  }

  // 6. Generate compliance report
  let compliance = null;
  try {
    const { result, metric } = measureSync('compliance', () =>
      generateComplianceReport(articles, gsc, config.minArticlesForCompliance),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    compliance = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'compliance', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Compliance: ${error}`);
    logger.error('[nios-orchestrator:analyze] Compliance failed:', err);
  }

  // 7. Generate readiness report
  let readiness = null;
  try {
    const { result, metric } = measureSync('readiness', () =>
      generateReadinessReport(articles),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    readiness = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'readiness', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Readiness: ${error}`);
    logger.error('[nios-orchestrator:analyze] Readiness failed:', err);
  }

  // 8. FASE 2.1: Google Trust Audit
  let trust: GoogleTrustReport | null = null;
  try {
    const { result, metric } = measureSync('google-trust', () =>
      generateGoogleTrustReport(articles),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    trust = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'google-trust', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Trust: ${error}`);
    logger.error('[nios-orchestrator:analyze] Trust failed:', err);
  }

  // 9. FASE 2.2: AdSense Recovery
  let adsenseRecovery = null;
  try {
    const { result, metric } = measureSync('adsense-recovery', () =>
      generateAdSenseRecoveryReport(articles, trust!),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    adsenseRecovery = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'adsense-recovery', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`AdSense: ${error}`);
    logger.error('[nios-orchestrator:analyze] AdSense recovery failed:', err);
  }

  // 10. FASE 2.3: Google Feedback Loop
  let learningPatterns: GoogleLearningPattern[] = [];
  try {
    const { result, metric } = measureSync('feedback-patterns', () =>
      generateLearningPatterns(articles, gsc),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    learningPatterns = result;

    await measureAsync('feedback-save', () => saveLearningPatterns(db, learningPatterns));
    collectMetric(ctx, 'feedback-save', 'success', 0, undefined, undefined);

    // Retención: los patrones se guardan 1 doc/artículo/día; sin poda la
    // colección crece ~465 docs/día indefinidamente (memoria, no aprendizaje).
    await measureAsync('feedback-prune', () => pruneLearningPatterns(db, 90));
    collectMetric(ctx, 'feedback-prune', 'success', 0, undefined, undefined);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number; module?: string } }).metric;
    const moduleName = metric?.module || 'feedback-loop';
    collectMetric(ctx, moduleName, 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`LearningPatterns: ${error}`);
    logger.error('[nios-orchestrator:analyze] Learning patterns failed:', err);
  }

  // 10b. Validación de predicciones MENI: predicción → observación → realidad
  // medida → comparación. Cierra el ciclo que quedó abierto con los campos
  // real* en null. Solo escribe resultados medidos; lo no medible queda
  // INSUFFICIENT_DATA.
  try {
    const { validateMeniPredictions } = await import('@/lib/meni/prediction-validator');
    const valResult = await measureAsync('meni-prediction-validation', () =>
      validateMeniPredictions(db, { minAgeDays: 7, limit: 100 }),
    );
    collectMetric(ctx, 'meni-prediction-validation', 'success', valResult.metric.durationMs, undefined, valResult.metric.memoryMB);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    collectMetric(ctx, 'meni-prediction-validation', 'error', 0, error, undefined);
    errors.push(`PredictionValidation: ${error}`);
    logger.error('[nios-orchestrator:analyze] Prediction validation failed:', err);
  }

  // 11. FASE 2.4: Weekly CEO Report
  let weekly: NIOSWeeklyReport | null = null;
  try {
    const { result, metric } = measureSync('weekly-report', () =>
      generateWeeklyReport(articles, trust!, gsc),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    weekly = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'weekly-report', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Weekly: ${error}`);
    logger.error('[nios-orchestrator:analyze] Weekly report failed:', err);
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
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    contentRecovery = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'content-recovery', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`ContentRecovery: ${error}`);
    logger.error('[nios-orchestrator:analyze] Content recovery failed:', err);
  }

  // 13. FASE 2.5.4: Content Improvement Engine
  let improvements: ImprovementRecommendation[] = [];
  try {
    const sourceTraffic: Record<string, number> = {};
    if (ga4) {
      for (const s of (ga4 as { sources?: { source: string; users: number }[] }).sources ?? []) {
        sourceTraffic[s.source] = (sourceTraffic[s.source] || 0) + s.users;
      }
    }
    const { result, metric } = measureSync('improvements', () =>
      generateImprovementRecommendations(articles, sourceTraffic),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    improvements = filterAbsurdImprovementRecommendations(result, articles);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'improvements', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Improvements: ${error}`);
    logger.error('[nios-orchestrator:analyze] Improvements failed:', err);
  }

  // 14. FASE 2.5.5: AdSense Recovery Full Report
  let adSenseRecoveryFullReport = null;
  try {
    const { result, metric } = await measureAsync('adsense-full-report', async () =>
      generateAdSenseRecoveryFullReport(
        articles,
        ga4 ? { totalUsers: (ga4 as { totalUsers?: number }).totalUsers ?? 0, averageEngagementTimeSec: (ga4 as { averageEngagementTimeSec?: number }).averageEngagementTimeSec ?? 0, devices: (ga4 as { devices?: { device: string; users: number }[] }).devices ?? [] } : null,
        {},
      ),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    adSenseRecoveryFullReport = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'adsense-full-report', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`AdSenseFull: ${error}`);
    logger.error('[nios-orchestrator:analyze] AdSense full report failed:', err);
  }

  // 15. FASE 3.1: Content Opportunity Engine
  let contentOpportunity = null;
  try {
    const { result, metric } = measureSync('opportunity', () =>
      generateContentOpportunityReport(articles, gsc),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    contentOpportunity = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'opportunity', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Opportunity: ${error}`);
    logger.error('[nios-orchestrator:analyze] Opportunity failed:', err);
  }

  // 16. FASE 3.2: Category Intelligence
  let categoryIntelligence = null;
  try {
    const { result, metric } = measureSync('category-intelligence', () =>
      generateCategoryIntelligence(articles, gsc, ga4, trust!),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    categoryIntelligence = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'category-intelligence', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Category: ${error}`);
    logger.error('[nios-orchestrator:analyze] Category intelligence failed:', err);
  }

  // 17. FASE 3.3: Content Mix Optimizer
  let contentMix = null;
  try {
    const { result, metric } = measureSync('content-mix', () =>
      generateContentMixReport(articles, gsc, ga4, trust!),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    contentMix = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'content-mix', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`ContentMix: ${error}`);
    logger.error('[nios-orchestrator:analyze] Content mix failed:', err);
  }

  // 18. FASE 3.4: Article Update Intelligence
  let articleUpdate = null;
  try {
    const { result, metric } = measureSync('update-engine', () =>
      generateArticleUpdateReport(articles),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    articleUpdate = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'update-engine', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Update: ${error}`);
    logger.error('[nios-orchestrator:analyze] Update engine failed:', err);
  }

  // 19. FASE 3.6: Aprendizaje MENI
  let meniLearning: MeniLearningFeedback | null = null;
  try {
    const { result, metric } = await measureAsync('meni-learning', () =>
      generateMeniLearningFeedback(db, articles),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    meniLearning = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'meni-learning', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`MeniLearning: ${error}`);
    logger.error('[nios-orchestrator:analyze] MeniLearning failed:', err);
  }

  // 20. FASE 3.5: Editor CEO Report
  let editorCEOReport = null;
  try {
    const { result, metric } = measureSync('editor-ceo', () =>
      generateEditorCEOReport(articles, gsc, ga4, trust!, meniLearning),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    editorCEOReport = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'editor-ceo', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`EditorCEO: ${error}`);
    logger.error('[nios-orchestrator:analyze] Editor CEO failed:', err);
  }

  // 21. FASE 3.7: Traffic Intelligence
  let trafficPerformance: TrafficPerformance | null = null;
  try {
    const { result, metric } = await measureAsync('traffic-performance', () =>
      generateTrafficPerformance(db),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    trafficPerformance = result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'traffic-performance', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`TrafficPerformance: ${error}`);
    logger.error('[nios-orchestrator:analyze] Traffic performance failed:', err);
  }

  // 22. Build dashboard
  try {
    const { metric } = measureSync('dashboard', () =>
      buildGoogleIntelligenceDashboard(articles, gsc, ga4, recommendations),
    );
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'dashboard', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Dashboard: ${error}`);
    logger.error('[nios-orchestrator:analyze] Dashboard failed:', err);
  }

  // 23. Save daily snapshot
  const now = new Date().toISOString();
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
    collectMetric(ctx, metric.module, metric.status, metric.durationMs, metric.error, metric.memoryMB);
    snapshotSizeEstimate = JSON.stringify(snapshot).length;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const metric = (err as { metric?: { durationMs: number; memoryMB?: number } }).metric;
    collectMetric(ctx, 'snapshot-save', 'error', metric?.durationMs ?? 0, error, metric?.memoryMB);
    errors.push(`Save: ${error}`);
    logger.error('[nios-orchestrator:analyze] Save failed:', err);
  }

  // 24. Telemetría (FASE 3.6 + 3.7) y momentum alerts.
  // En modo por etapas (deferTelemetrySave) los insumos se persisten y la
  // etapa finalize ejecuta saveTelemetry + emitMomentumAlerts — el health
  // score se calcula aquí igualmente porque el summary lo necesita.
  const date = new Date().toISOString().split('T')[0];
  const telemetryInput: PipelineTelemetryInput = {
    date,
    metrics: ctx.metrics,
    errors: ctx.errors,
    articlesCount: articles.length,
    noticiasCount,
    learningPatternsCount: learningPatterns.length,
    snapshotSizeEstimate,
    trafficPerformance,
    previousTrafficPerformance,
  };

  const computation = computeTelemetryReport(telemetryInput);
  const { report } = computation;

  const trafficLogHasTTL = await checkTrafficLogHasTTL(db);
  const health = calculateHealthScore(report, trafficLogHasTTL);
  let trafficMigration: Awaited<ReturnType<typeof getTrafficMigrationStatus>> | { dailyGenerated: boolean; fallbackReads: number; migrationHealth: number } = { dailyGenerated: false, fallbackReads: 0, migrationHealth: 0 };
  try {
    trafficMigration = await getTrafficMigrationStatus(db);
  } catch (err) {
    logger.warn('[nios-orchestrator:analyze] getTrafficMigrationStatus failed (expected outside Next.js):', err);
  }

  if (opts?.deferTelemetrySave) {
    // Persistir insumos para la etapa finalize (una sola escritura pequeña)
    try {
      const col = db.collection('nios_runs').doc(date).collection(STATE_COLLECTION);
      await col.doc('meta').set(
        { telemetryInput: removeUndefined(telemetryInput) },
        { merge: true },
      );
    } catch (err) {
      logger.error('[nios-orchestrator:analyze] Telemetry input persist failed:', err);
      errors.push(`TelemetryInput: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    try {
      await saveTelemetry(db, date, report, health, trafficMigration as never);
    } catch (err) {
      logger.error('[nios-orchestrator:analyze] Telemetry save failed:', err);
      // Telemetry falla no rompe el pipeline
    }
  }

  // Summary
  const gscResult = gsc as { status?: string; totalImpressions?: number; totalClicks?: number } | null;
  const ga4Result = ga4 as { status?: string; totalUsers?: number; totalSessions?: number } | null;
  const gscText = gscResult
    ? gscResult.status === 'REAL'
      ? `${gscResult.totalImpressions} impresiones, ${gscResult.totalClicks} clics`
      : `estado ${gscResult.status}`
    : 'sin datos';
  const ga4Text = ga4Result
    ? ga4Result.status === 'REAL'
      ? `${ga4Result.totalUsers} usuarios, ${ga4Result.totalSessions} sesiones`
      : `estado ${ga4Result.status}`
    : 'sin datos';
  const summary = `NIOS Pipeline completado. GSC: ${gscText}. GA4: ${ga4Text}. Artículos: ${articles.length}. Recomendaciones: ${recommendations.length}. Recovery: GREEN ${contentRecovery?.greenPct ?? 0}%, YELLOW ${contentRecovery?.yellowPct ?? 0}%, RED ${contentRecovery?.redPct ?? 0}%. Trust: ${trust?.averageGoogleTrustScore ?? 0}/100. Mejoras: ${improvements.length}. Learning patterns: ${learningPatterns.length}. Health: ${health.score}/100.`;

  logger.info(`[nios-orchestrator:analyze] ${summary}`);

  // 25. Emit momentum alerts (BREAKOUT → nios_alerts).
  // En modo por etapas se difiere a finalize junto con saveTelemetry.
  if (!opts?.deferTelemetrySave) {
    try {
      if (trafficPerformance) {
        await emitMomentumAlerts(db, trafficPerformance, previousTrafficPerformance);
      }
    } catch (err) {
      logger.warn('[nios-orchestrator:analyze] Momentum alert emit failed (non-fatal):', err);
    }
  }

  return {
    success: errors.length === 0,
    date,
    gscCollected: gscResult?.status === 'REAL',
    ga4Collected: ga4Result?.status === 'REAL',
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

// ─── Telemetría diferida (etapa finalize del modo por etapas) ──────────────

/**
 * Ejecuta saveTelemetry + emitMomentumAlerts con los insumos persistidos por
 * la fase analyze (deferTelemetrySave). La etapa finalize del cron la invoca
 * antes de la validación de tráfico. Idempotente: saveTelemetry escribe el
 * doc del día y los momentum alerts tienen dedup por cooldown.
 */
export async function runDeferredTelemetry(db: Firestore, date: string): Promise<{ saved: boolean; healthScore: number | null; error?: string }> {
  const metaDoc = await db
    .collection('nios_runs').doc(date).collection(STATE_COLLECTION).doc('meta')
    .get();
  const input = metaDoc.data()?.telemetryInput as PipelineTelemetryInput | undefined;
  if (!input) {
    logger.warn(`[nios-orchestrator:deferred] No telemetryInput for ${date}`);
    return { saved: false, healthScore: null, error: 'telemetry_input_missing' };
  }

  const { report } = computeTelemetryReport(input);
  const trafficLogHasTTL = await checkTrafficLogHasTTL(db);
  const health = calculateHealthScore(report, trafficLogHasTTL);
  let trafficMigration: Awaited<ReturnType<typeof getTrafficMigrationStatus>> | { dailyGenerated: boolean; fallbackReads: number; migrationHealth: number } = { dailyGenerated: false, fallbackReads: 0, migrationHealth: 0 };
  try {
    trafficMigration = await getTrafficMigrationStatus(db);
  } catch (err) {
    logger.warn('[nios-orchestrator:deferred] getTrafficMigrationStatus failed:', err);
  }

  try {
    await saveTelemetry(db, input.date, report, health, trafficMigration as never);
  } catch (err) {
    logger.error('[nios-orchestrator:deferred] Telemetry save failed:', err);
    return { saved: false, healthScore: health.score, error: err instanceof Error ? err.message : String(err) };
  }

  try {
    const { emitMomentumAlerts } = await import('./alerts');
    if (input.trafficPerformance) {
      await emitMomentumAlerts(db, input.trafficPerformance, input.previousTrafficPerformance);
    }
  } catch (err) {
    logger.warn('[nios-orchestrator:deferred] Momentum alert emit failed (non-fatal):', err);
  }

  return { saved: true, healthScore: health.score };
}

// ─── Ejecución monolítica (compatibilidad admin/tests) ──────────────────────

/**
 * Ejecuta el pipeline completo en una sola invocación.
 * Mismo comportamiento y orden que la versión anterior; ahora compone las
 * fases collect + analyze con estado en memoria.
 */
export async function runNIOSPipeline(
  db: Firestore,
  config: NIOSConfig = NIOS_CONFIG,
): Promise<NIOSRunResult> {
  const ctx = createPipelineContext(config);
  await runPipelineCollectPhase(db, ctx);
  return runPipelineAnalyzePhase(db, ctx);
}
