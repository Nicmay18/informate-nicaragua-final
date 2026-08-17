/**
 * NIOS Growth Engine — detecta oportunidades reales a partir de datos observados.
 * NUNCA inventa métricas. Si no hay datos, dice "NO HAY DATOS".
 */

import type { JourneyMetrics } from './aggregations';

export interface GrowthOpportunity {
  id: string;
  type: 'CTR_LOW' | 'RECIRCULATION_LOW' | 'EXIT_HIGH' | 'GROWTH_SUSTAINED' | 'EXPANSION';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  articleSlug?: string;
  diagnosis: string;
  evidence: string;
  action: string;
  expectedImpact: string;
  dataStatus: 'DATA_AVAILABLE' | 'DATA_EMPTY' | 'ERROR' | 'UNKNOWN';
}

export interface GrowthInput {
  journey: JourneyMetrics;
  articleMetrics?: Record<string, {
    views: number;
    recirculation: number;
    exitRate: number;
    avgEngagementMs: number;
    gscClicks?: number;
    gscImpressions?: number;
    gscCtr?: number;
    ga4Users?: number;
    relatedClicks?: number;
    uniqueQueries?: number;
  }>;
}

export function detectOpportunities(input: GrowthInput): GrowthOpportunity[] {
  const ops: GrowthOpportunity[] = [];
  const { journey, articleMetrics = {} } = input;

  if (journey.dataStatus === 'DATA_EMPTY') {
    return [noDataOpportunity()];
  }

  if (journey.dataStatus === 'ERROR' || journey.dataStatus === 'UNKNOWN') {
    return [{
      id: 'error-1',
      type: 'EXPANSION',
      severity: 'LOW',
      diagnosis: 'No se pudieron leer los datos del journey.',
      evidence: 'El agregador devolvió estado ERROR o UNKNOWN.',
      action: 'Revisar conectividad de Firestore y permisos de nios_telemetry.',
      expectedImpact: 'Bajo: restaurar observabilidad.',
      dataStatus: 'ERROR',
    }];
  }

  // Site-wide opportunity: recirculation low
  if (journey.avgArticlesPerSession < 1.3 && journey.pageViews > 100) {
    ops.push({
      id: 'site-recirculation-1',
      type: 'RECIRCULATION_LOW',
      severity: 'HIGH',
      diagnosis: 'El sitio atrae lectores pero no los mueve a una segunda nota.',
      evidence: `${journey.pageViews} pageviews, ${journey.avgArticlesPerSession.toFixed(2)} artículos/sesión.`,
      action: 'Revisar bloques "Leer también" en artículos y posicionar enlaces internos relevantes en homepage.',
      expectedImpact: 'Alto: aumentar páginas/sesión y tiempo en sitio.',
      dataStatus: 'DATA_AVAILABLE',
    });
  }

  // Site-wide opportunity: high single-page rate
  if (journey.singlePageRate > 0.65 && journey.sessions > 50) {
    ops.push({
      id: 'site-exit-1',
      type: 'EXIT_HIGH',
      severity: 'HIGH',
      diagnosis: 'Más del 65% de las sesiones terminan tras una sola página.',
      evidence: `${(journey.singlePageRate * 100).toFixed(1)}% de sesiones de una página.`,
      action: 'Añadir recomendaciones contextuales en artículos y portada.',
      expectedImpact: 'Alto: reducir rebote y aumentar recirculación.',
      dataStatus: 'DATA_AVAILABLE',
    });
  }

  for (const [slug, m] of Object.entries(articleMetrics)) {
    if (m.gscImpressions && m.gscCtr !== undefined && m.gscCtr < 0.02 && m.gscImpressions > 1000) {
      ops.push({
        id: `${slug}-ctr-low`,
        type: 'CTR_LOW',
        severity: 'HIGH',
        articleSlug: slug,
        diagnosis: 'El artículo aparece en Google pero no consigue clics.',
        evidence: `${m.gscImpressions} impresiones, CTR ${(m.gscCtr * 100).toFixed(1)}%.`,
        action: 'Revisar título SEO y meta description.',
        expectedImpact: 'Alto: mejorar CTR y tráfico orgánico.',
        dataStatus: 'DATA_AVAILABLE',
      });
    }

    if (m.views > 500 && m.recirculation < 0.15) {
      ops.push({
        id: `${slug}-recirc-low`,
        type: 'RECIRCULATION_LOW',
        severity: 'MEDIUM',
        articleSlug: slug,
        diagnosis: 'El artículo atrae audiencia pero envía pocos lectores a otra nota.',
        evidence: `${m.views} views, tasa de recirculación ${(m.recirculation * 100).toFixed(1)}%.`,
        action: 'Mejorar enlaces relacionados al final del artículo.',
        expectedImpact: 'Medio: aumentar páginas/sesión.',
        dataStatus: 'DATA_AVAILABLE',
      });
    }

    if (m.exitRate > 0.8 && m.avgEngagementMs > 120_000) {
      ops.push({
        id: `${slug}-exit-high`,
        type: 'EXIT_HIGH',
        severity: 'MEDIUM',
        articleSlug: slug,
        diagnosis: 'Contenido fuerte pero los lectores salen sin siguiente paso.',
        evidence: `${(m.exitRate * 100).toFixed(1)}% de salidas, ${m.avgEngagementMs / 1000}s de engagement.`,
        action: 'Crear cluster/enlaces internos relevantes.',
        expectedImpact: 'Medio: convertir en contenido pilar.',
        dataStatus: 'DATA_AVAILABLE',
      });
    }

    if (m.relatedClicks && m.relatedClicks > 20) {
      ops.push({
        id: `${slug}-sustained`,
        type: 'GROWTH_SUSTAINED',
        severity: 'LOW',
        articleSlug: slug,
        diagnosis: 'El artículo genera clics internos sostenidos.',
        evidence: `${m.relatedClicks} related clicks observados.`,
        action: 'Actualizar, enlazar desde portada y convertir en contenido pilar si corresponde.',
        expectedImpact: 'Medio: consolidar autoridad del tema.',
        dataStatus: 'DATA_AVAILABLE',
      });
    }

    if (m.uniqueQueries && m.uniqueQueries > 5) {
      ops.push({
        id: `${slug}-expansion`,
        type: 'EXPANSION',
        severity: 'MEDIUM',
        articleSlug: slug,
        diagnosis: 'Existen múltiples búsquedas distintas relacionadas con el tema.',
        evidence: `${m.uniqueQueries} consultas diferentes apuntando al artículo.`,
        action: 'Ampliar/actualizar el artículo para cubrir las variantes de búsqueda.',
        expectedImpact: 'Alto: captar más intenciones de búsqueda.',
        dataStatus: 'DATA_AVAILABLE',
      });
    }
  }

  return ops;
}

function noDataOpportunity(): GrowthOpportunity {
  return {
    id: 'no-data-1',
    type: 'EXPANSION',
    severity: 'LOW',
    diagnosis: 'NO HAY DATOS',
    evidence: 'La colección nios_telemetry no contiene eventos para el periodo consultado.',
    action: 'Verificar que JourneyTracker esté enviando eventos y que Firestore tenga permisos.',
    expectedImpact: 'Restaurar observabilidad antes de detectar oportunidades.',
    dataStatus: 'DATA_EMPTY',
  };
}
