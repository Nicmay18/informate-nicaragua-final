/**
 * Auditor Semanal V4.1 — FASE DE OBSERVACIÓN
 * =========================================
 * Genera reportes automáticos semanales sin modificar el motor.
 * Solo informa.
 */

import { getShadowHistory } from './shadow-logger';
import { getDisagreementStats, detectErrorPatterns, getModuleContributionStats } from './observatorio';

export interface WeeklyAuditReport {
  semana: string; // ISO week
  fechaGeneracion: string;
  
  // Top 20 reglas que más penalizan
  topReglasPenalizan: { regla: string; frecuencia: number; porcentaje: number }[];
  
  // Top 20 reglas que nunca se usan
  topReglasNuncaUsadas: { regla: string; categoria: string }[];
  
  // Top categorías con mayor diferencia motor-editor
  topCategoriasDiferencia: { categoria: string; discrepancias: number; porcentaje: number }[];
  
  // Top falsos positivos y falsos negativos
  topFalsosPositivos: { categoria: string; count: number }[];
  topFalsosNegativos: { categoria: string; count: number }[];
  
  // Top artículos donde el motor estuvo menos seguro (score cerca de umbrales)
  articulosInseguros: { slug: string; titulo: string; score: number; veredicto: string; distanciaUmbral: number }[];
  
  // Estadísticas de discrepancias
  discrepanciasStats: {
    total: number;
    coincidencias: number;
    porcentajeCoincidencia: number;
    diferenciasMasFrecuentes: { motor: string; editor: string; frecuencia: number }[];
  };
  
  // Patrones de errores detectados (10+ artículos)
  patronesErrores: { categoria: string; regla: string; frecuencia: number; descripcion: string }[];
  
  // Contribución por módulo
  moduleContribution: {
    promedioPorModulo: { seo: number; eeat: number; forense: number; adsense: number; discover: number; valorEditorial: number };
    modulosEnDesacuerdo: number;
  };
}

/**
 * Genera el reporte semanal de auditoría.
 */
export async function generateWeeklyAudit(): Promise<WeeklyAuditReport> {
  const logs = await getShadowHistory(1000);
  const discrepanciasStats = await getDisagreementStats();
  const patronesErrores = await detectErrorPatterns();
  const moduleContribution = await getModuleContributionStats();
  
  // Top 20 reglas que más penalizan
  const reglaCount: Record<string, number> = {};
  for (const log of logs) {
    for (const obs of log.observaciones) {
      const match = obs.match(/\[([^\]]+)\]/);
      if (match) {
        reglaCount[match[1]] = (reglaCount[match[1]] || 0) + 1;
      }
    }
  }
  const topReglasPenalizan = Object.entries(reglaCount)
    .map(([regla, frecuencia]) => ({
      regla,
      frecuencia,
      porcentaje: (frecuencia / logs.length) * 100,
    }))
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .slice(0, 20);
  
  // Top 20 reglas que nunca se usan
  // (esto requiere saber cuáles son todas las reglas posibles. Por ahora, usamos un conjunto estático)
  const todasLasReglas = [
    'seo.tituloLength', 'seo.resumenLength', 'seo.h2Count', 'seo.strongCount', 'seo.keywords',
    'eeat.autorVisible', 'eeat.fuentesDetectadas', 'eeat.atribucionesFalsas', 'eeat.citasEstructuradas',
    'forense.adjetivosEmocionales', 'forense.transicionesIA', 'forense.riesgosLegales', 'forense.nivelRiesgo',
    'adsense.palabraCount', 'adsense.clickbait', 'adsense.datosConcretos', 'adsense.palabrasSensibles',
    'discover.tieneImagen', 'discover.tituloClickbait', 'discover.fechaPublicacion',
    'valorEditorial.fuentePropia', 'valorEditorial.citaEspecifica', 'valorEditorial.atribucionVaga',
    'valorEditorial.nombresPropios', 'valorEditorial.instituciones', 'valorEditorial.parrafosSinDato',
    'requiredEvidence', 'requiredContext', 'requiredUtility',
  ];
  const topReglasNuncaUsadas = todasLasReglas
    .filter(regla => !reglaCount[regla])
    .map(regla => ({ regla, categoria: 'global' }))
    .slice(0, 20);
  
  // Top categorías con mayor diferencia
  const topCategoriasDiferencia = Object.entries(discrepanciasStats.porCategoria)
    .map(([categoria, data]) => ({
      categoria,
      discrepancias: data.discrepancias,
      porcentaje: data.porcentaje,
    }))
    .sort((a, b) => b.discrepancias - a.discrepancias)
    .slice(0, 10);
  
  // Top falsos positivos y falsos negativos
  const fpByCat: Record<string, number> = {};
  const fnByCat: Record<string, number> = {};
  for (const log of logs) {
    // Falso positivo: score < 45 pero veredicto no es no_publicar
    if (log.scoreV4 < 45 && !['no_publicar', 'EDITOR_INCONSISTENT'].includes(log.veredictoV4)) {
      fpByCat[log.categoriaDetectadaV4] = (fpByCat[log.categoriaDetectadaV4] || 0) + 1;
    }
    // Falso negativo: score >= 60 pero veredicto es no_publicar
    if (log.scoreV4 >= 60 && log.veredictoV4 === 'no_publicar') {
      fnByCat[log.categoriaDetectadaV4] = (fnByCat[log.categoriaDetectadaV4] || 0) + 1;
    }
  }
  const topFalsosPositivos = Object.entries(fpByCat)
    .map(([categoria, count]) => ({ categoria, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const topFalsosNegativos = Object.entries(fnByCat)
    .map(([categoria, count]) => ({ categoria, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Top artículos donde el motor estuvo menos seguro (score cerca de umbrales)
  const umbrales = [44, 45, 59, 60, 74, 75]; // umbrales entre veredictos
  const articulosInseguros = logs
    .map(log => {
      const distancia = umbrales.reduce((min, u) => Math.min(min, Math.abs(log.scoreV4 - u)), Infinity);
      return {
        slug: log.slug,
        titulo: log.titulo,
        score: log.scoreV4,
        veredicto: log.veredictoV4,
        distanciaUmbral: distancia,
      };
    })
    .filter(a => a.distanciaUmbral <= 3) // dentro de 3 puntos de un umbral
    .sort((a, b) => a.distanciaUmbral - b.distanciaUmbral)
    .slice(0, 20);
  
  // Determinar la semana ISO
  const now = new Date();
  const year = now.getFullYear();
  const week = getISOWeek(now);
  const semana = `${year}-W${week.toString().padStart(2, '0')}`;
  
  return {
    semana,
    fechaGeneracion: now.toISOString(),
    topReglasPenalizan,
    topReglasNuncaUsadas,
    topCategoriasDiferencia,
    topFalsosPositivos,
    topFalsosNegativos,
    articulosInseguros,
    discrepanciasStats,
    patronesErrores: patronesErrores.patrones,
    moduleContribution,
  };
}

/**
 * Obtiene el número de semana ISO de una fecha.
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Guarda el reporte semanal en Firestore.
 */
export async function saveWeeklyAudit(report: WeeklyAuditReport): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAdminDb } = require('../firebase-admin');
  try {
    const db = getAdminDb();
    await db.collection('weekly_audits').doc(report.semana).set(report);
  } catch (error) {
    console.error('[auditor] Error guardando reporte semanal:', error);
  }
}

/**
 * Recupera reportes semanales.
 */
export async function getWeeklyAudits(limit = 10): Promise<WeeklyAuditReport[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAdminDb } = require('../firebase-admin');
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('weekly_audits')
      .orderBy('semana', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map((doc: any) => doc.data() as WeeklyAuditReport);
  } catch (error) {
    console.error('[auditor] Error leyendo reportes semanales:', error);
    return [];
  }
}
