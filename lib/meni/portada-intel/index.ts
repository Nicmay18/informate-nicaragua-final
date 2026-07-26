/**
 * Inteligencia de Portada — Orquestador
 * ========================================
 * Punto de entrada para equilibrio y estrategia editorial.
 * - analyzePortada: analiza la portada actual y genera sugerencias.
 * - getLatestAnalysis: obtiene el último análisis desde Firestore.
 * - getStrategyConfig / setStrategyConfig: gestionar configuración.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { Noticia } from '@/lib/types';
import type {
  PortadaAnalysis,
  StrategyConfig,
} from './types';
import { DEFAULT_STRATEGY_CONFIG } from './types';
import { analyzeBalance } from './balance-analyzer';
import { detectConflicts } from './conflict-detector';
import { generateSuggestions, buildEditorialSummary } from './strategy-engine';

let cachedAnalysis: PortadaAnalysis | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Analiza la portada actual.
 * @param db Firestore
 * @param portadaArticles Artículos actualmente en portada
 * @param allArticles Todos los artículos disponibles (para sugerencias)
 * @param configOverride Configuración opcional
 */
export async function analyzePortada(
  db: Firestore,
  portadaArticles: Noticia[],
  allArticles: Noticia[],
  configOverride?: Partial<StrategyConfig>,
): Promise<PortadaAnalysis> {
  const config: StrategyConfig = { ...DEFAULT_STRATEGY_CONFIG, ...configOverride };

  const balance = analyzeBalance(portadaArticles, config);
  const conflicts = detectConflicts(portadaArticles, config);
  const suggestions = generateSuggestions(portadaArticles, allArticles, balance, conflicts, config);

  // Top candidatos para promoción
  const portadaSlugs = new Set(portadaArticles.map((a) => a.slug || a.id));
  const topCandidates = allArticles
    .filter((a) => !portadaSlugs.has(a.slug || a.id))
    .sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0))
    .slice(0, 5)
    .map((a) => ({
      slug: a.slug || a.id,
      title: a.titulo || '',
      category: a.categoria || 'General',
      score: a.vistas ?? 0,
      reason: `${a.vistas ?? 0} vistas, categoría ${a.categoria || 'General'}`,
    }));

  // Underperforming en portada
  const underperformingInPortada = portadaArticles
    .filter((a) => (a.vistas ?? 0) < 2)
    .slice(0, 5)
    .map((a) => ({
      slug: a.slug || a.id,
      title: a.titulo || '',
      category: a.categoria || 'General',
      reason: `Solo ${a.vistas ?? 0} vistas en portada`,
    }));

  const editorialSummary = buildEditorialSummary(balance, conflicts, suggestions);

  const analysis: PortadaAnalysis = {
    analyzedAt: new Date().toISOString(),
    totalArticles: portadaArticles.length,
    balance,
    conflicts,
    suggestions,
    topCandidates,
    underperformingInPortada,
    editorialSummary,
  };

  // Persistir en Firestore
  try {
    await db.collection('portada_intel').doc('latest').set({
      ...analysis,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[portada-intel] Error persistiendo análisis:', err);
  }

  cachedAnalysis = analysis;
  cacheTime = Date.now();

  return analysis;
}

/**
 * Obtiene el último análisis desde caché o Firestore.
 */
export async function getLatestAnalysis(
  db: Firestore,
  forceRefresh = false,
): Promise<PortadaAnalysis | null> {
  if (cachedAnalysis && !forceRefresh && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cachedAnalysis;
  }

  try {
    const doc = await db.collection('portada_intel').doc('latest').get();
    if (!doc.exists) return null;
    const data = doc.data() as unknown as PortadaAnalysis;
    cachedAnalysis = data;
    cacheTime = Date.now();
    return data;
  } catch {
    return null;
  }
}

/**
 * Obtiene la configuración de estrategia.
 */
export async function getStrategyConfig(db: Firestore): Promise<StrategyConfig> {
  try {
    const doc = await db.collection('portada_intel_config').doc('main').get();
    if (!doc.exists) return DEFAULT_STRATEGY_CONFIG;
    return { ...DEFAULT_STRATEGY_CONFIG, ...(doc.data() as Partial<StrategyConfig>) };
  } catch {
    return DEFAULT_STRATEGY_CONFIG;
  }
}

/**
 * Actualiza la configuración de estrategia.
 */
export async function setStrategyConfig(
  db: Firestore,
  config: Partial<StrategyConfig>,
): Promise<void> {
  await db.collection('portada_intel_config').doc('main').set(config, { merge: true });
  invalidateAnalysisCache();
}

export function invalidateAnalysisCache(): void {
  cachedAnalysis = null;
  cacheTime = 0;
}

export type {
  PortadaAnalysis,
  StrategyConfig,
  BalanceReport,
  PortadaConflict,
  PortadaSuggestion,
} from './types';
