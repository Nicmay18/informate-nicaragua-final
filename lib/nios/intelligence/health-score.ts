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
  /** Diagnóstico textual: qué significa el score. */
  diagnosis?: string;
  /** Acciones operacionales derivadas del score y sus advertencias. */
  recommendedActions?: string[];
  healthScoreVersion?: string;
  extendedSignals?: HealthScoreExtendedSignals;
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

  const diagnosis =
    score >= 90
      ? 'Pipeline estable. Costos, errores y tiempos dentro de metas.'
      : score >= 75
        ? 'Pipeline operativo con riesgos menores; atender advertencias.'
        : score >= 60
          ? 'Pipeline en observación: se detectan degradaciones que pueden escalarse.'
          : 'Pipeline comprometido: requiere intervención directa en los pilares en rojo.';

  const recommendedActions = [
    ...warnings.map((w) => `Revisar: ${w}`),
    score < 90 ? 'Auditar el pilar con menor score y priorizar su corrección.' : undefined,
    reliability < 25 ? 'Revisar logs y reintentos del pipeline (módulos fallidos).' : undefined,
    performance < 20 ? 'Optimizar duración del pipeline o dividir ejecución.' : undefined,
    firestore < 20 ? 'Reducir operaciones Firestore o usar snapshots más pequeños.' : undefined,
    scalability < 20 ? 'Configurar TTL en traffic_log o paginar noticias.' : undefined,
  ].filter((a): a is string => typeof a === 'string');

  return { score, level, warnings, diagnosis, recommendedActions, breakdown: { performance, firestore, reliability, scalability } };
}

// ─────────────────────────────────────────────────────────────
// v1.1 Extended Signals — augments v1.0 without changing formula
// ─────────────────────────────────────────────────────────────

export interface HealthScoreExtendedSignals {
  reliabilityUptime: number;
  errorsLast7Days: number;
  trafficDailyPercentage: number;
  trafficFallback: number;
  firestoreCostTrend: 'decreasing' | 'stable' | 'increasing';
}

export interface NiosHealthScoreV11 extends NiosHealthScore {
  healthScoreVersion: '1.1';
  extendedSignals: HealthScoreExtendedSignals;
}

/**
 * Calculates health score v1.1 — wraps v1.0 and adds extended signals.
 * Does NOT modify the original formula.
 */
export function calculateHealthScoreV11(
  report: NiosExecutionReport,
  trafficLogHasTTL: boolean,
  extendedSignals: HealthScoreExtendedSignals,
): NiosHealthScoreV11 {
  const base = calculateHealthScore(report, trafficLogHasTTL);
  const warnings = [...base.warnings];

  if (extendedSignals.reliabilityUptime < 99) {
    warnings.push(`Pipeline uptime 7d: ${extendedSignals.reliabilityUptime.toFixed(1)}% (meta >99%)`);
  }
  if (extendedSignals.errorsLast7Days > 0) {
    warnings.push(`Errores en últimos 7 días: ${extendedSignals.errorsLast7Days}`);
  }
  if (extendedSignals.trafficDailyPercentage < 95) {
    warnings.push(`traffic_daily coverage: ${extendedSignals.trafficDailyPercentage}% (meta >95%)`);
  }
  if (extendedSignals.trafficFallback > 0) {
    warnings.push(`Traffic fallback activo: ${extendedSignals.trafficFallback} reads`);
  }
  if (extendedSignals.firestoreCostTrend === 'increasing') {
    warnings.push('Tendencia de costos Firestore: aumentando');
  }

  return {
    ...base,
    healthScoreVersion: '1.1',
    extendedSignals,
    warnings,
  };
}
