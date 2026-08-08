/**
 * NIOS Weekly Reliability Report
 * ===============================
 * Responde 6 preguntas del CEO sobre confiabilidad operativa.
 * Consume ReliabilitySnapshot — no hace queries adicionales.
 */

import type { ReliabilitySnapshot } from './reliability-monitor';
import type { NiosTelemetryDocument } from './telemetry';

export interface WeeklyReliabilityReport {
  weekOf: string;
  questions: {
    pipelineExecutedCorrectly: boolean;
    slowestModule: string;
    hadErrors: boolean;
    trafficAggregatedCorrectly: boolean;
    operationalRisk: 'low' | 'medium' | 'high';
    requiresAttention: string[];
  };
  summary: string;
}

/**
 * Construye el reporte semanal a partir de telemetría y reliability snapshot.
 */
export function buildWeeklyReliabilityReport(
  snapshot: ReliabilitySnapshot,
  telemetryDocs: NiosTelemetryDocument[],
): WeeklyReliabilityReport {
  const latest = telemetryDocs[0];

  // 1. ¿NIOS ejecutó correctamente?
  const pipelineExecutedCorrectly = snapshot.pipeline.success;

  // 2. ¿Cuál fue el módulo más lento?
  let slowestModule = 'N/A';
  let slowestDuration = 0;
  if (latest?.report?.modules) {
    for (const m of latest.report.modules) {
      if (m.durationMs > slowestDuration) {
        slowestDuration = m.durationMs;
        slowestModule = m.name;
      }
    }
  }

  // 3. ¿Hubo errores?
  const hadErrors = !pipelineExecutedCorrectly || snapshot.pipeline.failedModules.length > 0;

  // 4. ¿Cuánto tráfico fue agregado correctamente?
  const trafficAggregatedCorrectly =
    snapshot.trafficMigration.trafficDailyCoverage >= 95 &&
    snapshot.trafficMigration.fallbackReads === 0;

  // 5. ¿Existe riesgo operativo?
  let operationalRisk: 'low' | 'medium' | 'high' = 'low';
  if (snapshot.reliabilityScore < 80 || snapshot.firestore.collectionGrowth === 'critical') {
    operationalRisk = 'high';
  } else if (snapshot.reliabilityScore < 90 || snapshot.firestore.collectionGrowth === 'elevated' || hadErrors) {
    operationalRisk = 'medium';
  }

  // 6. ¿Qué requiere atención?
  const requiresAttention: string[] = [];
  if (!pipelineExecutedCorrectly) {
    requiresAttention.push('Pipeline falló en última ejecución — revisar logs');
  }
  if (snapshot.pipeline.failedModules.length > 0) {
    requiresAttention.push(`Módulos fallidos: ${snapshot.pipeline.failedModules.join(', ')}`);
  }
  if (snapshot.trafficMigration.fallbackReads > 0) {
    requiresAttention.push(`Traffic fallback activo: ${snapshot.trafficMigration.fallbackReads} reads`);
  }
  if (snapshot.firestore.collectionGrowth !== 'normal') {
    requiresAttention.push(`Crecimiento Firestore ${snapshot.firestore.collectionGrowth}: ${snapshot.firestore.estimatedWrites} writes/run`);
  }
  if (slowestDuration > 10000) {
    requiresAttention.push(`Módulo lento: ${slowestModule} (${slowestDuration}ms)`);
  }
  for (const w of snapshot.warnings) {
    if (!requiresAttention.includes(w)) {
      requiresAttention.push(w);
    }
  }

  const summary = `Semana del ${snapshot.date}: Pipeline ${pipelineExecutedCorrectly ? 'OK' : 'FALLÓ'}. ` +
    `Módulo más lento: ${slowestModule} (${slowestDuration}ms). ` +
    `Errores: ${hadErrors ? 'SÍ' : 'NO'}. ` +
    `Tráfico: ${trafficAggregatedCorrectly ? 'OK' : 'con fallback'}. ` +
    `Riesgo: ${operationalRisk}. ` +
    `Reliability: ${snapshot.reliabilityScore}/100. ` +
    `Atención: ${requiresAttention.length} items.`;

  return {
    weekOf: snapshot.date,
    questions: {
      pipelineExecutedCorrectly,
      slowestModule,
      hadErrors,
      trafficAggregatedCorrectly,
      operationalRisk,
      requiresAttention,
    },
    summary,
  };
}
