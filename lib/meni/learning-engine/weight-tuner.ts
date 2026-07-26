/**
 * Weight Tuner — Learning Engine
 * ================================
 * Ajusta los pesos de scoring de MENI según las correlaciones reales encontradas.
 * No modifica el código directamente, sino que sugiere ajustes que se persisten
 * en Firestore y pueden ser aplicados manualmente o automáticamente.
 */

import type { Correlation, WeightAdjustment } from './types';

/** Pesos actuales del sistema MENI (espejo de scoring.ts / core.ts) */
const CURRENT_WEIGHTS: Record<string, number> = {
  scoreThin: 0.25,
  scoreImagen: 0.15,
  scoreAutor: 0.15,
  scoreFrescura: 0.10,
  scoreTitulos: 0.10,
  scoreMeta: 0.10,
  scoreLinks: 0.10,
  scoreEeat: 0.05,
};

export function tuneWeights(
  correlations: Correlation[],
): WeightAdjustment[] {
  const adjustments: WeightAdjustment[] = [];

  const scoreMeniCorr = correlations.find((c) => c.feature === 'score_meni');
  const imagenCorr = correlations.find((c) => c.feature === 'tiene_imagen');
  const resumenCorr = correlations.find((c) => c.feature === 'tiene_resumen');
  const titleCorr = correlations.find((c) => c.feature === 'longitud_titulo');
  const contentCorr = correlations.find((c) => c.feature === 'longitud_contenido');

  // Ajuste: peso de imagen
  if (imagenCorr && imagenCorr.sampleSize >= 10) {
    const current = CURRENT_WEIGHTS.scoreImagen;
    const impact = Math.abs(imagenCorr.correlation);
    if (impact > 0.3 && imagenCorr.correlation > 0) {
      const suggested = Math.min(0.30, current + 0.05);
      adjustments.push({
        component: 'scoreImagen',
        currentWeight: current,
        suggestedWeight: Math.round(suggested * 100) / 100,
        reason: `Las noticias con imagen reciben significativamente más vistas. Aumentar peso de imagen mejora la predicción.`,
        confidence: Math.min(1, impact),
      });
    } else if (impact < 0.1) {
      const suggested = Math.max(0.05, current - 0.03);
      adjustments.push({
        component: 'scoreImagen',
        currentWeight: current,
        suggestedWeight: Math.round(suggested * 100) / 100,
        reason: `La imagen no correlaciona con vistas. Reducir peso libera espacio para factores más predictivos.`,
        confidence: 0.5,
      });
    }
  }

  // Ajuste: peso de meta/resumen
  if (resumenCorr && resumenCorr.sampleSize >= 10) {
    const current = CURRENT_WEIGHTS.scoreMeta;
    const impact = Math.abs(resumenCorr.correlation);
    if (impact > 0.3 && resumenCorr.correlation > 0) {
      const suggested = Math.min(0.20, current + 0.05);
      adjustments.push({
        component: 'scoreMeta',
        currentWeight: current,
        suggestedWeight: Math.round(suggested * 100) / 100,
        reason: `El resumen/meta descripción correlaciona positivamente con vistas. Aumentar peso.`,
        confidence: Math.min(1, impact),
      });
    }
  }

  // Ajuste: peso de títulos
  if (titleCorr && titleCorr.sampleSize >= 10) {
    const current = CURRENT_WEIGHTS.scoreTitulos;
    if (titleCorr.correlation < -0.2) {
      const suggested = Math.min(0.20, current + 0.03);
      adjustments.push({
        component: 'scoreTitulos',
        currentWeight: current,
        suggestedWeight: Math.round(suggested * 100) / 100,
        reason: `Los títulos más cortos performan mejor. Reforzar el peso de optimización de títulos.`,
        confidence: Math.min(1, Math.abs(titleCorr.correlation)),
      });
    }
  }

  // Ajuste: score MENI general — si la correlación es baja, sugerir recalibración
  if (scoreMeniCorr && scoreMeniCorr.sampleSize >= 15) {
    const corr = scoreMeniCorr.correlation;
    if (corr < 0.1) {
      adjustments.push({
        component: 'scoreMaestro',
        currentWeight: 1.0,
        suggestedWeight: 1.0,
        reason: `La correlación entre score MENI y vistas reales es muy baja (r=${corr.toFixed(2)}). Se recomienda recalibrar los pesos del scoring completo.`,
        confidence: 0.8,
      });
    } else if (corr > 0.4) {
      adjustments.push({
        component: 'scoreMaestro',
        currentWeight: 1.0,
        suggestedWeight: 1.0,
        reason: `El score MENI correlaciona bien con vistas reales (r=${corr.toFixed(2)}). El sistema está bien calibrado.`,
        confidence: corr,
      });
    }
  }

  // Ajuste: peso de contenido (longitud)
  if (contentCorr && contentCorr.sampleSize >= 10) {
    if (contentCorr.correlation > 0.25) {
      adjustments.push({
        component: 'scoreThin',
        currentWeight: CURRENT_WEIGHTS.scoreThin,
        suggestedWeight: Math.min(0.35, CURRENT_WEIGHTS.scoreThin + 0.05),
        reason: `El contenido más extenso recibe más vistas. Aumentar peso anti-thin-content.`,
        confidence: Math.min(1, contentCorr.correlation),
      });
    }
  }

  return adjustments;
}
