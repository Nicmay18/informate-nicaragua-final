/**
 * NIOS Production Health Score
 * =============================
 * Calcula un score 0-100 de salud del sistema basado en métricas del pipeline.
 */

import type { NiosExecutionReport } from './performance-report';

export type HealthLevel = 'EXCELENTE' | 'MUY BUENO' | 'BUENO' | 'ACEPTABLE' | 'REQUIERE INTERVENCIÓN';

export interface NiosHealthScore {
  score: number;
  level: HealthLevel;
  warnings: string[];
  breakdown: {
    performance: number;
    firestore: number;
    reliability: number;
    scalability: number;
  };
}

export function calculateHealthScore(
  report: NiosExecutionReport,
  trafficLogHasTTL: boolean,
): NiosHealthScore {
  const warnings: string[] = [];

  // Performance (0-25)
  let performance = 25;
  if (report.totalDuration > 30000) {
    performance = 15;
    warnings.push('Pipeline supera 30s (riesgo timeout Vercel 60s)');
  } else if (report.totalDuration > 15000) {
    performance = 20;
    warnings.push('Pipeline supera 15s');
  }
  const slowModules = report.modules.filter((m) => m.durationMs > 5000);
  if (slowModules.length > 0) {
    performance -= 2 * slowModules.length;
    warnings.push(`Módulos lentos: ${slowModules.map((m) => m.name).join(', ')}`);
  }
  performance = Math.max(0, performance);

  // Firestore (0-25)
  let firestore = 25;
  const totalFirestoreOps = report.firestore.reads + report.firestore.writes;
  if (totalFirestoreOps > 100000) {
    firestore = 10;
    warnings.push('Más de 100K operaciones Firestore por ejecución');
  } else if (totalFirestoreOps > 10000) {
    firestore = 18;
    warnings.push('Más de 10K operaciones Firestore por ejecución');
  }
  if (report.firestore.writes > 5000) {
    firestore -= 3;
    warnings.push('Alto volumen de escrituras Firestore');
  }
  firestore = Math.max(0, firestore);

  // Reliability (0-25)
  let reliability = 25;
  if (report.errors.length > 0) {
    reliability -= 5 * Math.min(report.errors.length, 5);
    warnings.push(`Errores en pipeline: ${report.errors.length}`);
  }
  const errorModules = report.modules.filter((m) => m.status === 'error');
  if (errorModules.length > 0) {
    reliability -= 4 * errorModules.length;
    warnings.push(`Módulos fallidos: ${errorModules.map((m) => m.name).join(', ')}`);
  }
  reliability = Math.max(0, reliability);

  // Scalability (0-25)
  let scalability = 25;
  if (report.articlesAnalyzed > 400) {
    scalability = 20;
    warnings.push('Más de 400 artículos: snapshot usa subcolecciones');
  }
  if (report.snapshotSizeEstimate > 900000) {
    scalability = 15;
    warnings.push('Snapshot cercano al límite 1MB');
  }
  if (!trafficLogHasTTL) {
    scalability = 10;
    warnings.push('traffic_log sin TTL: riesgo de crecimiento ilimitado');
  }
  scalability = Math.max(0, scalability);

  const total = performance + firestore + reliability + scalability;
  const score = Math.max(0, Math.min(100, total));

  let level: HealthLevel;
  if (score >= 95) level = 'EXCELENTE';
  else if (score >= 90) level = 'MUY BUENO';
  else if (score >= 80) level = 'BUENO';
  else if (score >= 70) level = 'ACEPTABLE';
  else level = 'REQUIERE INTERVENCIÓN';

  return { score, level, warnings, breakdown: { performance, firestore, reliability, scalability } };
}
