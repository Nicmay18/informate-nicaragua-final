/**
 * CEO Morning Brief — máximo 5 acciones accionables con evidencia real.
 * Si no hay datos, dice "NO HAY DATOS".
 */

import type { JourneyMetrics } from './aggregations';
import type { GrowthOpportunity } from './growth';

export interface BriefPoint {
  area: 'Google' | 'Contenido' | 'Oportunidad' | 'Audiencia' | 'Negocio' | 'Técnico';
  status: 'alert' | 'warning' | 'opportunity' | 'ok';
  headline: string;
  diagnosis: string;
  evidence: string;
  action: string;
  expectedImpact: string;
  dataStatus: 'DATA_AVAILABLE' | 'DATA_EMPTY' | 'ERROR' | 'UNKNOWN';
}

export interface MorningBrief {
  generatedAt: string;
  period: { from: string; to: string };
  points: BriefPoint[];
  dataStatus: 'DATA_AVAILABLE' | 'DATA_EMPTY' | 'ERROR' | 'UNKNOWN';
}

export function buildMorningBrief(
  journey: JourneyMetrics,
  opportunities: GrowthOpportunity[],
  externalErrors: number
): MorningBrief {
  const points: BriefPoint[] = [];

  if (journey.dataStatus === 'DATA_EMPTY') {
    return {
      generatedAt: new Date().toISOString(),
      period: journey.period,
      points: [{
        area: 'Técnico',
        status: 'warning',
        headline: 'NO HAY DATOS',
        diagnosis: 'No se recibieron eventos de journey en el periodo.',
        evidence: `Periodo ${journey.period.from} → ${journey.period.to}: 0 eventos.`,
        action: 'Verificar JourneyTracker, API /api/telemetry/journey y permisos de Firestore.',
        expectedImpact: 'Restaurar observabilidad.',
        dataStatus: 'DATA_EMPTY',
      }],
      dataStatus: 'DATA_EMPTY',
    };
  }

  if (journey.dataStatus === 'ERROR' || journey.dataStatus === 'UNKNOWN') {
    return {
      generatedAt: new Date().toISOString(),
      period: journey.period,
      points: [{
        area: 'Técnico',
        status: 'alert',
        headline: 'Error de observabilidad',
        diagnosis: 'El agregador no pudo leer los eventos.',
        evidence: 'Estado del agregador: ' + journey.dataStatus,
        action: 'Revisar logs de Firestore y reintentar.',
        expectedImpact: 'Restaurar lectura de datos.',
        dataStatus: 'ERROR',
      }],
      dataStatus: 'ERROR',
    };
  }

  // Google / search visibility
  const organicSearch = opportunities.find(o => o.type === 'CTR_LOW');
  if (organicSearch) {
    points.push({
      area: 'Google',
      status: 'alert',
      headline: `Google: ${organicSearch.articleSlug}`,
      diagnosis: organicSearch.diagnosis,
      evidence: organicSearch.evidence,
      action: organicSearch.action,
      expectedImpact: organicSearch.expectedImpact,
      dataStatus: organicSearch.dataStatus,
    });
  }

  // Contenido / recirculation
  const recirc = opportunities.find(o => o.type === 'RECIRCULATION_LOW');
  if (recirc) {
    points.push({
      area: 'Contenido',
      status: 'warning',
      headline: 'Recirculación baja',
      diagnosis: recirc.diagnosis,
      evidence: recirc.evidence,
      action: recirc.action,
      expectedImpact: recirc.expectedImpact,
      dataStatus: recirc.dataStatus,
    });
  }

  // Oportunidad / growth
  const sustained = opportunities.find(o => o.type === 'GROWTH_SUSTAINED');
  if (sustained) {
    points.push({
      area: 'Oportunidad',
      status: 'opportunity',
      headline: `Crecimiento sostenido: ${sustained.articleSlug}`,
      diagnosis: sustained.diagnosis,
      evidence: sustained.evidence,
      action: sustained.action,
      expectedImpact: sustained.expectedImpact,
      dataStatus: sustained.dataStatus,
    });
  }

  // Audiencia / source + exit
  points.push({
    area: 'Audiencia',
    status: journey.singlePageRate > 0.65 ? 'alert' : 'ok',
    headline: journey.singlePageRate > 0.65 ? 'Alta tasa de sesiones de una página' : 'Audiencia saludable',
    diagnosis: journey.singlePageRate > 0.65
      ? 'La mayoría de las sesiones terminan tras una sola página.'
      : 'Los lectores recorren múltiples páginas.',
    evidence: `${(journey.singlePageRate * 100).toFixed(1)}% de sesiones de una sola página, ${journey.avgPagesPerSession.toFixed(2)} páginas/sesión.`,
    action: journey.singlePageRate > 0.65
      ? 'Mejorar enlaces internos y recomendaciones en artículos.'
      : 'Mantener estrategia de recirculación.',
    expectedImpact: 'Aumentar páginas por sesión.',
    dataStatus: 'DATA_AVAILABLE',
  });

  // Negocio / engagement
  points.push({
    area: 'Negocio',
    status: journey.avgEngagementMs < 10_000 ? 'warning' : 'ok',
    headline: journey.avgEngagementMs < 10_000 ? 'Bajo engagement' : 'Engagement estable',
    diagnosis: journey.avgEngagementMs < 10_000
      ? 'El tiempo promedio de engagement es bajo.'
      : 'Los lectores permanecen activos en el sitio.',
    evidence: `${(journey.avgEngagementMs / 1000).toFixed(1)}s de engagement promedio.`,
    action: journey.avgEngagementMs < 10_000
      ? 'Revisar contenido, velocidad de carga y estructura de artículos.'
      : 'Monitorear y convertir en contenido pilar.',
    expectedImpact: 'Mejorar retención.',
    dataStatus: 'DATA_AVAILABLE',
  });

  // Técnico / errors
  if (externalErrors > 0) {
    points.push({
      area: 'Técnico',
      status: 'alert',
      headline: 'Errores detectados',
      diagnosis: 'Se registraron errores en el sitio.',
      evidence: `${externalErrors} eventos de error en el periodo.`,
      action: 'Revisar Sentry/logs y corregir causas raíz.',
      expectedImpact: 'Reducir churn por errores.',
      dataStatus: 'DATA_AVAILABLE',
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    period: journey.period,
    points: points.slice(0, 5),
    dataStatus: 'DATA_AVAILABLE',
  };
}
