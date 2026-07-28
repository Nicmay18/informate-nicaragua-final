/**
 * Learning Adapter — Puente entre el Learning Engine y el scoring de MENI
 * =====================================================================
 * Carga los ajustes de peso sugeridos por el Learning Engine desde Firestore
 * y los aplica dinámicamente al scoring, cerrando el loop de aprendizaje.
 *
 * Sin este adaptador, el Learning Engine genera sugerencias que nadie aplica.
 * Con él, MENI ajusta sus umbrales según el rendimiento real del sitio.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { WeightAdjustment } from './types';

/** Ajustes activos cargados desde Firestore */
export interface ActiveAdjustments {
  weights: Record<string, number>;
  tierOverrides: Partial<Record<string, { minAdnNI?: number; minQualityGateScore?: number }>>;
  updatedAt: string;
  source: 'learning-engine' | 'default';
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  scoreThin: 0.25,
  scoreImagen: 0.15,
  scoreAutor: 0.15,
  scoreFrescura: 0.10,
  scoreTitulos: 0.10,
  scoreMeta: 0.10,
  scoreLinks: 0.10,
  scoreEeat: 0.05,
};

let cachedAdjustments: ActiveAdjustments | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Carga los ajustes activos desde Firestore.
 * Si no hay ajustes persistidos, retorna los pesos por defecto.
 */
export async function loadActiveAdjustments(db: Firestore): Promise<ActiveAdjustments> {
  if (cachedAdjustments && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cachedAdjustments;
  }

  try {
    const doc = await db.collection('learning_config').doc('active_adjustments').get();
    if (doc.exists) {
      const data = doc.data() as ActiveAdjustments;
      cachedAdjustments = {
        weights: { ...DEFAULT_WEIGHTS, ...data.weights },
        tierOverrides: data.tierOverrides || {},
        updatedAt: data.updatedAt || new Date().toISOString(),
        source: 'learning-engine',
      };
    } else {
      cachedAdjustments = {
        weights: { ...DEFAULT_WEIGHTS },
        tierOverrides: {},
        updatedAt: new Date().toISOString(),
        source: 'default',
      };
    }
  } catch {
    cachedAdjustments = {
      weights: { ...DEFAULT_WEIGHTS },
      tierOverrides: {},
      updatedAt: new Date().toISOString(),
      source: 'default',
    };
  }

  cacheTime = Date.now();
  return cachedAdjustments;
}

/**
 * Aplica los ajustes del Learning Engine a los pesos de scoring.
 * Retorna los pesos efectivos (default + ajustes activos).
 */
export function applyWeightAdjustments(
  baseWeights: Record<string, number>,
  adjustments: WeightAdjustment[],
): Record<string, number> {
  const result = { ...baseWeights };
  for (const adj of adjustments) {
    if (adj.component in result && adj.confidence >= 0.6) {
      result[adj.component] = adj.suggestedWeight;
    }
  }
  // Normalizar para que sumen 1.0
  const total = Object.values(result).reduce((a, b) => a + b, 0);
  if (total > 0 && Math.abs(total - 1.0) > 0.01) {
    for (const key of Object.keys(result)) {
      result[key] = Math.round((result[key] / total) * 100) / 100;
    }
  }
  return result;
}

/**
 * Persiste los ajustes activos en Firestore para que se apliquen en futuras ejecuciones.
 */
export async function persistActiveAdjustments(
  db: Firestore,
  adjustments: WeightAdjustment[],
): Promise<void> {
  const weights = applyWeightAdjustments(DEFAULT_WEIGHTS, adjustments);
  const active: ActiveAdjustments = {
    weights,
    tierOverrides: {},
    updatedAt: new Date().toISOString(),
    source: 'learning-engine',
  };

  await db.collection('learning_config').doc('active_adjustments').set(active);
  cachedAdjustments = active;
  cacheTime = Date.now();
}

/**
 * Invalida la caché de ajustes activos.
 */
export function invalidateAdjustmentsCache(): void {
  cachedAdjustments = null;
  cacheTime = 0;
}
