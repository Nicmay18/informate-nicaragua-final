/**
 * Metrics Calculator V4 — FASE 3
 * ================================
 * Calcula métricas obligatorias desde el historial de shadow logs.
 * Accuracy por categoría, FP, FN, consistencia, timing, desviación estándar.
 */

import type { ShadowLogEntry } from './shadow-logger';

export interface MetricasCategoria {
  categoria: string;
  total: number;
  scorePromedioV4: number;
  scorePromedioV3: number | null;
  desviacionEstandarV4: number;
  accuracyCategoria: number;
  falsosPositivos: number;
  falsosNegativos: number;
  coincidenciaV3V4: number;
  tiempoPromedioV4Ms: number;
  tiempoPromedioV3Ms: number | null;
}

export interface MetricasGlobales {
  totalAnalisis: number;
  scorePromedioV4: number;
  scorePromedioV3: number | null;
  desviacionEstandarV4: number;
  coincidenciaGlobalV3V4: number;
  tiempoPromedioV4Ms: number;
  tiempoPromedioV3Ms: number | null;
  inconsistenciasDetectadas: number;
  consistenciaOkPorcentaje: number;
  distribucionVeredictos: Record<string, number>;
  reglasQueMasPenalizan: { regla: string; frecuencia: number }[];
  metricasPorCategoria: MetricasCategoria[];
}

function desviacionEstandar(valores: number[]): number {
  if (valores.length === 0) return 0;
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const varianza = valores.reduce((acc, v) => acc + Math.pow(v - media, 2), 0) / valores.length;
  return Math.sqrt(varianza);
}

function promedio(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

export function calcularMetricas(logs: ShadowLogEntry[]): MetricasGlobales {
  const total = logs.length;

  // Scores globales
  const scoresV4 = logs.map(l => l.scoreV4);
  const scoresV3 = logs.filter(l => l.scoreV3 !== null).map(l => l.scoreV3!);
  const tiemposV4 = logs.map(l => l.tiempoV4Ms);
  const tiemposV3 = logs.filter(l => l.tiempoV3Ms !== null).map(l => l.tiempoV3Ms!);

  // Coincidencia V3-V4
  const coincidencias = logs.filter(l => l.coinciden).length;
  const coincidenciaGlobal = total > 0 ? (coincidencias / total) * 100 : 0;

  // Consistencia
  const inconsistencias = logs.filter(l => !l.consistenciaOk).length;
  const consistenciaOk = total > 0 ? ((total - inconsistencias) / total) * 100 : 0;

  // Distribución de veredictos
  const distVeredictos: Record<string, number> = {};
  for (const log of logs) {
    distVeredictos[log.veredictoV4] = (distVeredictos[log.veredictoV4] || 0) + 1;
  }

  // Reglas que más penalizan (aproximado desde observaciones)
  const reglasCount: Record<string, number> = {};
  for (const log of logs) {
    for (const obs of log.observaciones) {
      const match = obs.match(/\[([^\]]+)\]/);
      if (match) {
        reglasCount[match[1]] = (reglasCount[match[1]] || 0) + 1;
      }
    }
  }
  const reglasQueMasPenalizan = Object.entries(reglasCount)
    .map(([regla, frecuencia]) => ({ regla, frecuencia }))
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .slice(0, 10);

  // Métricas por categoría
  const categorias = new Set(logs.map(l => l.categoriaDetectadaV4));
  const metricasPorCategoria: MetricasCategoria[] = [];

  for (const cat of categorias) {
    const catLogs = logs.filter(l => l.categoriaDetectadaV4 === cat);
    const catScoresV4 = catLogs.map(l => l.scoreV4);
    const catScoresV3 = catLogs.filter(l => l.scoreV3 !== null).map(l => l.scoreV3!);
    const catTiemposV4 = catLogs.map(l => l.tiempoV4Ms);
    const catTiemposV3 = catLogs.filter(l => l.tiempoV3Ms !== null).map(l => l.tiempoV3Ms!);
    const catCoincidencias = catLogs.filter(l => l.coinciden).length;

    // Falsos positivos: V4 dice publicar pero score < 45
    const fp = catLogs.filter(l => l.scoreV4 < 45 && !['no_publicar', 'EDITOR_INCONSISTENT'].includes(l.veredictoV4)).length;
    // Falsos negativos: V4 dice no_publicar pero score >= 60
    const fn = catLogs.filter(l => l.scoreV4 >= 60 && l.veredictoV4 === 'no_publicar').length;

    metricasPorCategoria.push({
      categoria: cat,
      total: catLogs.length,
      scorePromedioV4: promedio(catScoresV4),
      scorePromedioV3: catScoresV3.length > 0 ? promedio(catScoresV3) : null,
      desviacionEstandarV4: desviacionEstandar(catScoresV4),
      accuracyCategoria: catLogs.length > 0 ? ((catLogs.length - fp - fn) / catLogs.length) * 100 : 0,
      falsosPositivos: fp,
      falsosNegativos: fn,
      coincidenciaV3V4: catLogs.length > 0 ? (catCoincidencias / catLogs.length) * 100 : 0,
      tiempoPromedioV4Ms: promedio(catTiemposV4),
      tiempoPromedioV3Ms: catTiemposV3.length > 0 ? promedio(catTiemposV3) : null,
    });
  }

  return {
    totalAnalisis: total,
    scorePromedioV4: promedio(scoresV4),
    scorePromedioV3: scoresV3.length > 0 ? promedio(scoresV3) : null,
    desviacionEstandarV4: desviacionEstandar(scoresV4),
    coincidenciaGlobalV3V4: coincidenciaGlobal,
    tiempoPromedioV4Ms: promedio(tiemposV4),
    tiempoPromedioV3Ms: tiemposV3.length > 0 ? promedio(tiemposV3) : null,
    inconsistenciasDetectadas: inconsistencias,
    consistenciaOkPorcentaje: consistenciaOk,
    distribucionVeredictos: distVeredictos,
    reglasQueMasPenalizan,
    metricasPorCategoria,
  };
}
