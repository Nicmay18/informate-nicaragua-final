/**
 * NIOS Telemetry Engine
 * =====================
 * Capa de observabilidad no invasiva para NIOS.
 * Mide tiempo, memoria y estado de cada módulo sin alterar lógica.
 */

import { logger } from '@/lib/logger';
import type { Firestore } from 'firebase-admin/firestore';
import type { NiosExecutionReport } from './performance-report';
import type { NiosHealthScore } from './health-score';

const TELEMETRY_COLLECTION = 'nios_telemetry';

export interface NiosTelemetryDocument {
  date: string;
  report: NiosExecutionReport;
  health: NiosHealthScore;
  savedAt: string;
}

/**
 * Guarda el Execution Report y Health Score en Firestore.
 * Nunca sobrescribe datos históricos.
 */
export async function saveTelemetry(
  db: Firestore,
  date: string,
  report: NiosExecutionReport,
  health: NiosHealthScore,
): Promise<void> {
  try {
    const docRef = db.collection(TELEMETRY_COLLECTION).doc(date);
    const existing = await docRef.get();
    if (existing.exists) {
      logger.warn(`[nios-telemetry] Telemetry for ${date} already exists. Skipping.`);
      return;
    }

    const payload: NiosTelemetryDocument = {
      date,
      report,
      health,
      savedAt: new Date().toISOString(),
    };

    await docRef.set(payload);
    logger.info(`[nios-telemetry] Saved telemetry for ${date}`);
  } catch (err) {
    logger.error('[nios-telemetry] Failed to save telemetry:', err);
  }
}


export interface TelemetryMetric {
  module: string;
  durationMs: number;
  status: 'success' | 'error';
  timestamp: string;
  error?: string;
  memoryMB?: number;
  metadata?: Record<string, unknown>;
}

export interface MemoryUsage {
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
}

function getMemoryUsage(): MemoryUsage | undefined {
  if (typeof process === 'undefined' || !process.memoryUsage) return undefined;
  const mem = process.memoryUsage();
  return {
    heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
    heapTotalMB: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
    rssMB: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
  };
}

/**
 * Mide una función asíncrona y registra métricas.
 * No altera el resultado de la función.
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<{ result: T; metric: TelemetryMetric }> {
  const start = process.hrtime.bigint();
  const memoryBefore = getMemoryUsage();

  try {
    const result = await fn();
    const end = process.hrtime.bigint();
    const durationMs = Number((end - start) / 1_000_000n);
    const memoryAfter = getMemoryUsage();

    const metric: TelemetryMetric = {
      module: name,
      durationMs,
      status: 'success',
      timestamp: new Date().toISOString(),
      memoryMB: memoryBefore && memoryAfter
        ? Math.round((memoryAfter.heapUsedMB - memoryBefore.heapUsedMB) * 100) / 100
        : undefined,
      metadata,
    };

    logger.info(`[nios-telemetry] ${name}: ${durationMs}ms | ${metric.status}`);
    return { result, metric };
  } catch (err) {
    const end = process.hrtime.bigint();
    const durationMs = Number((end - start) / 1_000_000n);

    const metric: TelemetryMetric = {
      module: name,
      durationMs,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
      metadata,
    };

    logger.error(`[nios-telemetry] ${name}: ${durationMs}ms | error`, err);
    throw Object.assign(err instanceof Error ? err : new Error(String(err)), { metric });
  }
}
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>,
): { result: T; metric: TelemetryMetric } {
  const start = process.hrtime.bigint();
  const memoryBefore = getMemoryUsage();

  try {
    const result = fn();
    const end = process.hrtime.bigint();
    const durationMs = Number((end - start) / 1_000_000n);
    const memoryAfter = getMemoryUsage();

    const metric: TelemetryMetric = {
      module: name,
      durationMs,
      status: 'success',
      timestamp: new Date().toISOString(),
      memoryMB: memoryBefore && memoryAfter
        ? Math.round((memoryAfter.heapUsedMB - memoryBefore.heapUsedMB) * 100) / 100
        : undefined,
      metadata,
    };

    logger.info(`[nios-telemetry] ${name}: ${durationMs}ms | ${metric.status}`);
    return { result, metric };
  } catch (err) {
    const end = process.hrtime.bigint();
    const durationMs = Number((end - start) / 1_000_000n);

    const metric: TelemetryMetric = {
      module: name,
      durationMs,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
      metadata,
    };

    logger.error(`[nios-telemetry] ${name}: ${durationMs}ms | error`, err);
    throw Object.assign(err instanceof Error ? err : new Error(String(err)), { metric });
  }
}

