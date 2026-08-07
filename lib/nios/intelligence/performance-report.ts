/**
 * NIOS Performance Report
 * =======================
 * Agrega métricas de telemetría en un Execution Report estructurado.
 */

import type { TelemetryMetric } from './telemetry';

export interface FirestoreMetrics {
  reads: number;
  writes: number;
  deletes: number;
}

export interface TrafficMetrics {
  trafficLogWrites: number;
  trafficDailyWrites: number;
  dailyTotalViews: number;
}

export interface CostEstimate {
  monthlyFirestoreWrites: number;
  monthlyFirestoreReads: number;
  estimatedMonthlyCostUSD: number;
}

export interface ModuleMetric {
  name: string;
  durationMs: number;
  status: 'success' | 'error';
  error?: string;
  memoryMB?: number;
}

export interface NiosExecutionReport {
  date: string;
  totalDuration: number;
  modules: ModuleMetric[];
  firestore: FirestoreMetrics;
  traffic: TrafficMetrics;
  cost: CostEstimate;
  healthSignals: string[];
  errors: string[];
  articlesAnalyzed: number;
  snapshotSizeEstimate: number;
}

export function buildExecutionReport(
  date: string,
  metrics: TelemetryMetric[],
  firestore: FirestoreMetrics,
  healthSignals: string[],
  errors: string[],
  articlesAnalyzed: number,
  snapshotSizeEstimate: number,
  traffic: TrafficMetrics,
  cost: CostEstimate,
): NiosExecutionReport {
  const totalDuration = metrics.reduce((sum, m) => sum + m.durationMs, 0);

  return {
    date,
    totalDuration,
    modules: metrics.map((m) => ({
      name: m.module,
      durationMs: m.durationMs,
      status: m.status,
      error: m.error,
      memoryMB: m.memoryMB,
    })),
    firestore,
    traffic,
    cost,
    healthSignals,
    errors,
    articlesAnalyzed,
    snapshotSizeEstimate,
  };
}
