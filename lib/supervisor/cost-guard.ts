/**
 * Cost Guard — Control de costos de IA
 * =====================================
 * Vigila el gasto de IA. No llama modelos innecesariamente.
 * Persiste contadores en Firestore para que sobrevivan entre cold starts.
 *
 * Reglas:
 * - Límite por hora, día y mes.
 * - Cooldown por artículo (no re-investigar el mismo artículo cada minuto).
 * - Caché implícito: si ya se investigó y no hay cambios, no repetir.
 * - Deduplicación: si dos flujos piden investigación simultánea, solo una corre.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { CostGuardStatus, CostGuardConfig } from './types';
import { logger } from '@/lib/logger';

const COLLECTION = 'ia_cost_counters';
const DOC_ID = 'global';

const DEFAULT_CONFIG: CostGuardConfig = {
  maxCallsPerHour: parseInt(process.env.MAX_RESEARCH_CALLS_PER_HOUR || '50', 10),
  maxCallsPerDay: parseInt(process.env.MAX_RESEARCH_CALLS_PER_DAY || '300', 10),
  maxCallsPerMonth: parseInt(process.env.MAX_RESEARCH_CALLS_PER_MONTH || '6000', 10),
  costPerCall: parseFloat(process.env.IA_COST_PER_CALL || '0.008'),
  articleCooldownMs: parseInt(process.env.ARTICLE_COOLDOWN_MS || '300000', 10), // 5 min
};

// Caché en memoria para hot-path (evita leer Firestore en cada llamada)
let memoryCache: {
  data: CostGuardStatus & { lastUpdated: number };
  config: CostGuardConfig;
} | null = null;

const MEMORY_TTL_MS = 10000; // 10s

async function readCounters(db: Firestore): Promise<CostGuardStatus & { lastUpdated: number }> {
  try {
    const snap = await db.collection(COLLECTION).doc(DOC_ID).get();
    const data = snap.data() as (CostGuardStatus & { lastUpdated: number }) | undefined;
    if (data) {
      // Reset mensual
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      if (data.lastUpdated < monthStart) {
        return freshCounters();
      }
      return data;
    }
    return freshCounters();
  } catch (e) {
    logger.warn('[cost-guard] Error leyendo contadores:', e);
    return freshCounters();
  }
}

function freshCounters(): CostGuardStatus & { lastUpdated: number } {
  return {
    callsThisHour: 0,
    maxCallsPerHour: DEFAULT_CONFIG.maxCallsPerHour,
    callsToday: 0,
    maxCallsPerDay: DEFAULT_CONFIG.maxCallsPerDay,
    callsThisMonth: 0,
    maxCallsPerMonth: DEFAULT_CONFIG.maxCallsPerMonth,
    canCall: true,
    estimatedCostUsd: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Verifica si se puede hacer una llamada a IA.
 * No incrementa el contador; solo consulta.
 */
export async function canCallLLM(db?: Firestore): Promise<{ allowed: boolean; reason?: string; status: CostGuardStatus }> {
  const config = DEFAULT_CONFIG;

  // Fast path: usar caché en memoria si es reciente
  if (memoryCache && Date.now() - memoryCache.data.lastUpdated < MEMORY_TTL_MS) {
    const s = memoryCache.data;
    const blocked = checkLimits(s, config);
    return { allowed: !blocked, reason: blocked || undefined, status: stripCache(s) };
  }

  if (!db) {
    // Sin DB, usar solo memoria (no persistente)
    if (!memoryCache) memoryCache = { data: freshCounters(), config };
    const s = memoryCache.data;
    const blocked = checkLimits(s, config);
    return { allowed: !blocked, reason: blocked || undefined, status: stripCache(s) };
  }

  const counters = await readCounters(db);
  memoryCache = { data: counters, config };

  const blocked = checkLimits(counters, config);
  return { allowed: !blocked, reason: blocked || undefined, status: stripCache(counters) };
}

function checkLimits(s: CostGuardStatus, config: CostGuardConfig): string | null {
  if (s.callsThisHour >= config.maxCallsPerHour) {
    return `Límite horario excedido (${s.callsThisHour}/${config.maxCallsPerHour})`;
  }
  if (s.callsToday >= config.maxCallsPerDay) {
    return `Límite diario excedido (${s.callsToday}/${config.maxCallsPerDay})`;
  }
  if (s.callsThisMonth >= config.maxCallsPerMonth) {
    return `Límite mensual excedido (${s.callsThisMonth}/${config.maxCallsPerMonth})`;
  }
  return null;
}

function stripCache(s: CostGuardStatus & { lastUpdated: number }): CostGuardStatus {
  const { lastUpdated, ...rest } = s;
  void lastUpdated;
  return rest;
}

/**
 * Registra una llamada a IA. Incrementa todos los contadores.
 * Debe llamarse DESPUÉS de confirmar que la llamada se va a ejecutar.
 */
export async function recordCall(db?: Firestore): Promise<void> {
  if (!db) {
    if (memoryCache) {
      memoryCache.data.callsThisHour++;
      memoryCache.data.callsToday++;
      memoryCache.data.callsThisMonth++;
      memoryCache.data.estimatedCostUsd += DEFAULT_CONFIG.costPerCall;
      memoryCache.data.lastUpdated = Date.now();
    }
    return;
  }

  try {
    const current = await readCounters(db);
    const updated: CostGuardStatus & { lastUpdated: number } = {
      ...current,
      callsThisHour: current.callsThisHour + 1,
      callsToday: current.callsToday + 1,
      callsThisMonth: current.callsThisMonth + 1,
      estimatedCostUsd: current.estimatedCostUsd + DEFAULT_CONFIG.costPerCall,
      lastUpdated: Date.now(),
    };
    updated.canCall = !checkLimits(updated, DEFAULT_CONFIG);
    if (updated.canCall === false) {
      updated.blockedReason = checkLimits(updated, DEFAULT_CONFIG) || undefined;
    }

    await db.collection(COLLECTION).doc(DOC_ID).set(updated);
    memoryCache = { data: updated, config: DEFAULT_CONFIG };
  } catch (e) {
    logger.warn('[cost-guard] Error registrando llamada:', e);
  }
}

/**
 * Verifica si un artículo específico está en cooldown.
 * Evita re-investigar el mismo artículo repetidamente.
 */
export function isArticleInCooldown(
  articleId: string,
  lastResearchAt: Record<string, number>
): boolean {
  const last = lastResearchAt[articleId];
  if (!last) return false;
  return Date.now() - last < DEFAULT_CONFIG.articleCooldownMs;
}

/**
 * Detecta operaciones que generarían llamadas innecesarias.
 * Retorna el número de llamadas que se bloquearían.
 */
export function detectWastefulCalls(
  planned: number,
  status: CostGuardStatus
): { wasteful: number; reason: string } {
  if (planned <= 0) return { wasteful: 0, reason: '' };

  const remaining = status.maxCallsPerHour - status.callsThisHour;
  if (planned > remaining) {
    const wasteful = planned - Math.max(0, remaining);
    return {
      wasteful,
      reason: `Esta operación generaría ${planned} llamadas pero solo quedan ${Math.max(0, remaining)} disponibles en la hora. ${wasteful} serían innecesarias.`,
    };
  }
  return { wasteful: 0, reason: '' };
}

export function getConfig(): CostGuardConfig {
  return { ...DEFAULT_CONFIG };
}

/**
 * Resetea los contadores horarios (lo llama el cron si fuera necesario).
 */
export async function resetHourly(db?: Firestore): Promise<void> {
  if (!memoryCache) return;
  memoryCache.data.callsThisHour = 0;
  memoryCache.data.lastUpdated = Date.now();
  if (db) {
    try {
      await db.collection(COLLECTION).doc(DOC_ID).set(memoryCache.data, { merge: true });
    } catch (e) {
      logger.warn('[cost-guard] Error reseteando contadores:', e);
    }
  }
}
