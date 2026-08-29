/**
 * Learning Engine Orchestrator — MENI OS v6.0
 * ==============================================
 * Punto de entrada del Learning Engine.
 * - runLearningCycle: ejecuta un ciclo completo de aprendizaje y persiste resultados.
 * - getLatestInsights: obtiene el último ciclo de aprendizaje desde Firestore.
 * - getLearningConfig / setLearningConfig: gestionar configuración.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type {
  LearningCycleResult,
  LearningConfig,
} from './types';
import { DEFAULT_LEARNING_CONFIG } from './types';
import { collectArticleMetrics, collectTrafficSources } from './metrics-collector';
import { analyzeCategoryPerformance, analyzeTemporalPatterns, analyzeCorrelations } from './pattern-analyzer';
import { tuneWeights } from './weight-tuner';
import { generateInsights } from './insight-generator';
import { persistActiveAdjustments } from './learning-adapter';
import { logger } from '@/lib/logger';

let cachedResult: LearningCycleResult | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function runLearningCycle(
  db: Firestore,
  configOverride?: Partial<LearningConfig>,
): Promise<LearningCycleResult> {
  const config: LearningConfig = { ...DEFAULT_LEARNING_CONFIG, ...configOverride };

  const articles = await collectArticleMetrics(db, config);
  const sources = await collectTrafficSources(db, config);

  if (articles.length < config.minArticlesForAnalysis) {
    return {
      runAt: new Date().toISOString(),
      totalArticlesAnalyzed: articles.length,
      totalViews: 0,
      avgViewsPerArticle: 0,
      categoryPerformance: [],
      sourcePerformance: sources,
      temporalPatterns: [],
      correlations: [],
      weightAdjustments: [],
      insights: [{
        id: 'alert-insufficient-data',
        type: 'alert',
        title: 'Datos insuficientes para aprendizaje',
        description: `Solo ${articles.length} artículos en el período analizado. Se necesitan al menos ${config.minArticlesForAnalysis} para generar insights.`,
        severity: 'warning',
        data: { count: articles.length, min: config.minArticlesForAnalysis },
        generatedAt: new Date().toISOString(),
      }],
      topPerformers: [],
      underperformers: [],
    };
  }

  const categoryPerformance = analyzeCategoryPerformance(articles);
  const temporalPatterns = analyzeTemporalPatterns(articles);
  const correlations = analyzeCorrelations(articles);
  const weightAdjustments = config.enableWeightTuning
    ? tuneWeights(correlations)
    : [];
  const insights = generateInsights(
    articles,
    categoryPerformance,
    sources,
    temporalPatterns,
    correlations,
    weightAdjustments,
  );

  const totalViews = articles.reduce((s, a) => s + a.vistas, 0);
  const sorted = [...articles].sort((a, b) => b.vistas - a.vistas);
  const topPerformers = sorted.slice(0, 10);
  const underperformers = sorted
    .filter((a) => a.scoreMeni !== null && a.scoreMeni > 70 && a.vistas < 2)
    .slice(0, 10);

  const result: LearningCycleResult = {
    runAt: new Date().toISOString(),
    totalArticlesAnalyzed: articles.length,
    totalViews,
    avgViewsPerArticle: Math.round(totalViews / articles.length),
    categoryPerformance,
    sourcePerformance: sources,
    temporalPatterns,
    correlations,
    weightAdjustments,
    insights,
    topPerformers,
    underperformers,
  };

  // Persistir en Firestore
  try {
    await db.collection('learning_cycles').add({
      ...result,
      createdAt: new Date().toISOString(),
    });
    await db.collection('learning_cycles').doc('latest').set({
      ...result,
      updatedAt: new Date().toISOString(),
    });

    // Aplicar ajustes de peso automáticamente si hay confianza suficiente
    if (config.enableWeightTuning && weightAdjustments.length > 0) {
      const highConfidence = weightAdjustments.filter((a) => a.confidence >= 0.6);
      if (highConfidence.length > 0) {
        await persistActiveAdjustments(db, highConfidence);
      }
    }
  } catch (err) {
    logger.warn('[learning-engine] Error persistiendo ciclo:', err);
  }

  cachedResult = result;
  cacheTime = Date.now();

  return result;
}

export async function getLatestInsights(
  db: Firestore,
  forceRefresh = false,
): Promise<LearningCycleResult | null> {
  if (cachedResult && !forceRefresh && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cachedResult;
  }

  try {
    const doc = await db.collection('learning_cycles').doc('latest').get();
    if (!doc.exists) return null;
    const data = doc.data() as unknown as LearningCycleResult;
    cachedResult = data;
    cacheTime = Date.now();
    return data;
  } catch {
    return null;
  }
}

export async function getLearningConfig(db: Firestore): Promise<LearningConfig> {
  try {
    const doc = await db.collection('learning_config').doc('main').get();
    if (!doc.exists) return DEFAULT_LEARNING_CONFIG;
    return { ...DEFAULT_LEARNING_CONFIG, ...(doc.data() as Partial<LearningConfig>) };
  } catch {
    return DEFAULT_LEARNING_CONFIG;
  }
}

export async function setLearningConfig(
  db: Firestore,
  config: Partial<LearningConfig>,
): Promise<void> {
  await db.collection('learning_config').doc('main').set(config, { merge: true });
}

export function invalidateLearningCache(): void {
  cachedResult = null;
  cacheTime = 0;
}

export { loadActiveAdjustments, persistActiveAdjustments, invalidateAdjustmentsCache } from './learning-adapter';
export type { ActiveAdjustments } from './learning-adapter';

export type {
  LearningCycleResult,
  LearningConfig,
  LearningInsight,
  WeightAdjustment,
  Correlation,
  ArticleMetrics,
  CategoryPerformance,
  SourcePerformance,
  TemporalPattern,
} from './types';
