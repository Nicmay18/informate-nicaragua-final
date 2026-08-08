/**
 * NIOS Production Reliability Monitor
 * ===================================
 * Analiza telemetría histórica para evaluar confiabilidad operativa.
 * No crea datos nuevos — solo lee y analiza snapshots existentes.
 */

import { logger } from '@/lib/logger';
import type { Firestore } from 'firebase-admin/firestore';
import type { NiosTelemetryDocument } from './telemetry';


const TELEMETRY_COLLECTION = 'nios_telemetry';

export interface ReliabilityPipeline {
  success: boolean;
  durationMs: number;
  failedModules: string[];
  weeklyTrend: 'improving' | 'stable' | 'degrading';
}

export interface ReliabilityFirestore {
  estimatedReads: number;
  estimatedWrites: number;
  collectionGrowth: 'normal' | 'elevated' | 'critical';
}

export interface ReliabilityTraffic {
  health: number;
  fallbackReads: number;
  trafficDailyCoverage: number;
}

export interface ReliabilitySnapshot {
  date: string;
  reliabilityScore: number;
  pipeline: ReliabilityPipeline;
  trafficMigration: ReliabilityTraffic;
  firestore: ReliabilityFirestore;
  warnings: string[];
}

/**
 * Lee los últimos N días de telemetría y construye un snapshot de confiabilidad.
 */
export async function buildReliabilitySnapshot(
  db: Firestore,
  days = 7,
): Promise<ReliabilitySnapshot> {
  const warnings: string[] = [];
  const telemetryDocs: NiosTelemetryDocument[] = [];

  try {
    const snap = await db
      .collection(TELEMETRY_COLLECTION)
      .orderBy('date', 'desc')
      .limit(days)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data() as NiosTelemetryDocument;
      if (data.report && data.health) {
        telemetryDocs.push(data);
      }
    }
  } catch (err) {
    logger.error('[reliability-monitor] Failed to read telemetry:', err);
  }

  if (telemetryDocs.length === 0) {
    return {
      date: new Date().toISOString().split('T')[0],
      reliabilityScore: 0,
      pipeline: {
        success: false,
        durationMs: 0,
        failedModules: [],
        weeklyTrend: 'stable',
      },
      trafficMigration: {
        health: 0,
        fallbackReads: 0,
        trafficDailyCoverage: 0,
      },
      firestore: {
        estimatedReads: 0,
        estimatedWrites: 0,
        collectionGrowth: 'normal',
      },
      warnings: ['Sin datos de telemetría disponibles'],
    };
  }

  const latest = telemetryDocs[0];
  const totalDocs = telemetryDocs.length;

  // Pipeline analysis
  const successes = telemetryDocs.filter((t) => t.report.errors.length === 0).length;
  const successRate = (successes / totalDocs) * 100;
  const pipelineSuccess = latest.report.errors.length === 0;
  const pipelineDuration = latest.report.totalDuration;

  const failedModules = new Set<string>();
  for (const t of telemetryDocs) {
    for (const m of t.report.modules) {
      if (m.status === 'error') failedModules.add(m.name);
    }
  }

  // Weekly trend: comparar primera mitad vs segunda mitad
  const halfPoint = Math.floor(totalDocs / 2);
  const recentDurations = telemetryDocs.slice(0, halfPoint).map((t) => t.report.totalDuration);
  const olderDurations = telemetryDocs.slice(halfPoint).map((t) => t.report.totalDuration);
  const recentAvg = recentDurations.length > 0
    ? recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length
    : 0;
  const olderAvg = olderDurations.length > 0
    ? olderDurations.reduce((a, b) => a + b, 0) / olderDurations.length
    : 0;

  let weeklyTrend: 'improving' | 'stable' | 'degrading' = 'stable';
  if (olderAvg > 0) {
    const delta = (recentAvg - olderAvg) / olderAvg;
    if (delta < -0.1) weeklyTrend = 'improving';
    else if (delta > 0.1) weeklyTrend = 'degrading';
  }

  // Traffic migration analysis
  const trafficHealthValues = telemetryDocs
    .map((t) => t.trafficMigration?.migrationHealth ?? 0)
    .filter((v) => v > 0);
  const avgTrafficHealth = trafficHealthValues.length > 0
    ? trafficHealthValues.reduce((a, b) => a + b, 0) / trafficHealthValues.length
    : 0;

  const totalFallbackReads = telemetryDocs
    .reduce((sum, t) => sum + (t.trafficMigration?.fallbackReads ?? 0), 0);

  const dailyCoverageDays = telemetryDocs
    .filter((t) => t.trafficMigration?.dailySource === 'traffic_daily')
    .length;
  const trafficDailyCoverage = totalDocs > 0 ? (dailyCoverageDays / totalDocs) * 100 : 0;

  // Firestore analysis
  const totalReads = telemetryDocs.reduce((sum, t) => sum + t.report.firestore.reads, 0);
  const totalWrites = telemetryDocs.reduce((sum, t) => sum + t.report.firestore.writes, 0);
  const avgReadsPerRun = totalDocs > 0 ? Math.round(totalReads / totalDocs) : 0;
  const avgWritesPerRun = totalDocs > 0 ? Math.round(totalWrites / totalDocs) : 0;

  let collectionGrowth: 'normal' | 'elevated' | 'critical' = 'normal';
  if (avgWritesPerRun > 5000) {
    collectionGrowth = 'elevated';
    warnings.push(`Escrituras Firestore promedio elevadas: ${avgWritesPerRun}/run`);
  }
  if (avgWritesPerRun > 10000) {
    collectionGrowth = 'critical';
    warnings.push(`Escrituras Firestore críticas: ${avgWritesPerRun}/run`);
  }

  // Reliability score (0-100)
  let score = 100;
  score -= (100 - successRate) * 0.5;
  if (pipelineDuration > 30000) score -= 5;
  if (failedModules.size > 0) score -= 3 * failedModules.size;
  if (avgTrafficHealth < 100) score -= (100 - avgTrafficHealth) * 0.2;
  if (totalFallbackReads > 0) score -= Math.min(10, totalFallbackReads * 2);
  if (collectionGrowth === 'elevated') score -= 3;
  if (collectionGrowth === 'critical') score -= 8;
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Warnings
  if (!pipelineSuccess) warnings.push(`Pipeline falló en última ejecución (${latest.date})`);
  if (successRate < 99) warnings.push(`Tasa de éxito pipeline: ${successRate.toFixed(1)}% (meta >99%)`);
  if (totalFallbackReads > 0) warnings.push(`Fallback traffic activo: ${totalFallbackReads} reads en ${totalDocs} días`);
  if (weeklyTrend === 'degrading') warnings.push('Tendencia semanal degradándose: duración aumentando');
  if (score < 90) warnings.push(`Reliability score por debajo de meta: ${score}/100`);

  return {
    date: latest.date,
    reliabilityScore: score,
    pipeline: {
      success: pipelineSuccess,
      durationMs: pipelineDuration,
      failedModules: Array.from(failedModules),
      weeklyTrend,
    },
    trafficMigration: {
      health: Math.round(avgTrafficHealth),
      fallbackReads: totalFallbackReads,
      trafficDailyCoverage: Math.round(trafficDailyCoverage),
    },
    firestore: {
      estimatedReads: avgReadsPerRun,
      estimatedWrites: avgWritesPerRun,
      collectionGrowth,
    },
    warnings,
  };
}

/**
 * Versión simplificada para tests — no requiere Firestore.
 */
export function buildReliabilitySnapshotFromTelemetry(
  telemetryDocs: NiosTelemetryDocument[],
): ReliabilitySnapshot {
  const warnings: string[] = [];

  if (telemetryDocs.length === 0) {
    return {
      date: new Date().toISOString().split('T')[0],
      reliabilityScore: 0,
      pipeline: { success: false, durationMs: 0, failedModules: [], weeklyTrend: 'stable' },
      trafficMigration: { health: 0, fallbackReads: 0, trafficDailyCoverage: 0 },
      firestore: { estimatedReads: 0, estimatedWrites: 0, collectionGrowth: 'normal' },
      warnings: ['Sin datos de telemetría disponibles'],
    };
  }

  const latest = telemetryDocs[0];
  const totalDocs = telemetryDocs.length;
  const successes = telemetryDocs.filter((t) => t.report.errors.length === 0).length;
  const successRate = (successes / totalDocs) * 100;
  const pipelineSuccess = latest.report.errors.length === 0;
  const pipelineDuration = latest.report.totalDuration;

  const failedModules = new Set<string>();
  for (const t of telemetryDocs) {
    for (const m of t.report.modules) {
      if (m.status === 'error') failedModules.add(m.name);
    }
  }

  const trafficHealthValues = telemetryDocs
    .map((t) => t.trafficMigration?.migrationHealth ?? 0)
    .filter((v) => v > 0);
  const avgTrafficHealth = trafficHealthValues.length > 0
    ? trafficHealthValues.reduce((a, b) => a + b, 0) / trafficHealthValues.length
    : 0;

  const totalFallbackReads = telemetryDocs
    .reduce((sum, t) => sum + (t.trafficMigration?.fallbackReads ?? 0), 0);

  const dailyCoverageDays = telemetryDocs
    .filter((t) => t.trafficMigration?.dailySource === 'traffic_daily')
    .length;
  const trafficDailyCoverage = totalDocs > 0 ? (dailyCoverageDays / totalDocs) * 100 : 0;

  const totalReads = telemetryDocs.reduce((sum, t) => sum + t.report.firestore.reads, 0);
  const totalWrites = telemetryDocs.reduce((sum, t) => sum + t.report.firestore.writes, 0);
  const avgReadsPerRun = totalDocs > 0 ? Math.round(totalReads / totalDocs) : 0;
  const avgWritesPerRun = totalDocs > 0 ? Math.round(totalWrites / totalDocs) : 0;

  let collectionGrowth: 'normal' | 'elevated' | 'critical' = 'normal';
  if (avgWritesPerRun > 5000) {
    collectionGrowth = 'elevated';
    warnings.push(`Escrituras Firestore promedio elevadas: ${avgWritesPerRun}/run`);
  }
  if (avgWritesPerRun > 10000) {
    collectionGrowth = 'critical';
    warnings.push(`Escrituras Firestore críticas: ${avgWritesPerRun}/run`);
  }

  let score = 100;
  score -= (100 - successRate) * 0.5;
  if (pipelineDuration > 30000) score -= 5;
  if (failedModules.size > 0) score -= 3 * failedModules.size;
  if (avgTrafficHealth < 100) score -= (100 - avgTrafficHealth) * 0.2;
  if (totalFallbackReads > 0) score -= Math.min(10, totalFallbackReads * 2);
  if (collectionGrowth === 'elevated') score -= 3;
  if (collectionGrowth === 'critical') score -= 8;
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (!pipelineSuccess) warnings.push(`Pipeline falló en última ejecución (${latest.date})`);
  if (successRate < 99) warnings.push(`Tasa de éxito pipeline: ${successRate.toFixed(1)}% (meta >99%)`);
  if (totalFallbackReads > 0) warnings.push(`Fallback traffic activo: ${totalFallbackReads} reads en ${totalDocs} días`);
  if (score < 90) warnings.push(`Reliability score por debajo de meta: ${score}/100`);

  return {
    date: latest.date,
    reliabilityScore: score,
    pipeline: {
      success: pipelineSuccess,
      durationMs: pipelineDuration,
      failedModules: Array.from(failedModules),
      weeklyTrend: 'stable',
    },
    trafficMigration: {
      health: Math.round(avgTrafficHealth),
      fallbackReads: totalFallbackReads,
      trafficDailyCoverage: Math.round(trafficDailyCoverage),
    },
    firestore: {
      estimatedReads: avgReadsPerRun,
      estimatedWrites: avgWritesPerRun,
      collectionGrowth,
    },
    warnings,
  };
}
