/**
 * NIOS Article Momentum
 * =====================
 * Clasifica el movimiento individual de cada artículo en:
 * - SILENT: actividad normal, no genera notificación.
 * - INFORMATIONAL: tendencia interesante para el panel/digest.
 * - ACTIONABLE: condición que requiere una decisión (p. ej. redistribuir).
 *
 * NO emite alertas. Solo clasifica. La capa de alertas (alert-engine.ts)
 * decide si una condición ACTIONABLE se emite una sola vez.
 */

import type { TrafficPerformance } from '@/lib/analytics/traffic-aggregator';

export type NotificationLevel = 'SILENT' | 'INFORMATIONAL' | 'ACTIONABLE';

export interface ArticleMomentum {
  slug: string;
  currentViews: number;
  previousViews: number;
  delta: number;
  deltaPercent: number | null;
  velocity: number; // vistas/día en el período actual
  trend: 'BREAKOUT' | 'BREAKOUT_FROM_ZERO' | 'RISING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
  level: NotificationLevel;
  confidence: number; // 0-100
  sources: Record<string, number>;
  attribution: { source: string; confidence: number } | null;
  reason: string;
  recommendedAction: string | null;
}

export interface ArticleMomentumOptions {
  minActionableViews?: number;
  minInfoViews?: number;
  actionableGrowthPct?: number;
  infoGrowthPct?: number;
  minConfidence?: number;
  baselineDays?: number;
}

const DEFAULT_OPTIONS: Required<ArticleMomentumOptions> = {
  minActionableViews: 100,
  minInfoViews: 50,
  actionableGrowthPct: 100,
  infoGrowthPct: 25,
  minConfidence: 60,
  baselineDays: 7,
};

function dominantSource(sources: Record<string, number>): { source: string; confidence: number } | null {
  const entries = Object.entries(sources || {}).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return null;

  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [name, value] = sorted[0];
  const share = value / total;

  // Necesitamos una fuente claramente dominante (>50%) para evitar false-positives.
  if (share < 0.5) {
    const ambiguity = Math.round((1 - share) * 100);
    return { source: 'unknown', confidence: Math.min(45, ambiguity) };
  }

  return { source: name, confidence: Math.round(share * 100) };
}

function clampConfidence(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Evalúa el momentum de cada artículo comparando el período actual con el anterior.
 * No genera notificaciones; solo clasifica.
 */
export function evaluateArticleMomentum(
  current: TrafficPerformance | null,
  previous: TrafficPerformance | null,
  options?: ArticleMomentumOptions,
): ArticleMomentum[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (!current) return [];

  const previousMap = new Map<string, number>();
  if (previous?.topArticles) {
    for (const a of previous.topArticles) {
      previousMap.set(a.slug, a.views ?? 0);
    }
  }

  const results: ArticleMomentum[] = [];
  const seen = new Set<string>();

  for (const article of current.topArticles || []) {
    const slug = article.slug;
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const currentViews = article.views ?? 0;
    const previousViews = previousMap.get(slug) ?? 0;
    const delta = currentViews - previousViews;
    const deltaPercent = previousViews > 0
      ? Number((((delta) / previousViews) * 100).toFixed(1))
      : (currentViews > 0 ? null : null);

    const velocity = currentViews / opts.baselineDays;
    const sources = article.sources || {};
    const attribution = dominantSource(sources);

    // Confianza: datos observados + baseline claro + atribución no-unknown.
    let confidence = 50;
    confidence += currentViews >= opts.minInfoViews ? 10 : 0;
    confidence += previousViews > 0 ? 10 : 0;
    const attributionBonus = attribution
      ? attribution.source === 'unknown'
        ? attribution.confidence * 0.05
        : attribution.confidence * 0.25
      : 0;
    confidence += attributionBonus;
    confidence = clampConfidence(confidence);

    let trend: ArticleMomentum['trend'] = 'STABLE';
    let level: NotificationLevel = 'SILENT';
    let reason = 'Actividad dentro de rango normal.';
    let recommendedAction: string | null = null;

    if (currentViews === 0) {
      trend = 'INSUFFICIENT_DATA';
      level = 'SILENT';
      reason = 'Sin vistas en el período.';
    } else if (previousViews === 0) {
      // Sin baseline: breakout desde cero, hipótesis fuerte.
      if (currentViews >= opts.minActionableViews) {
        trend = 'BREAKOUT_FROM_ZERO';
        level = 'INFORMATIONAL';
        reason = `Artículo recién activo con ${currentViews} vistas sin baseline anterior.`;
        recommendedAction = 'Monitorear atentamente; no redistribuir sin confirmar atribución real.';
      } else if (currentViews >= opts.minInfoViews) {
        trend = 'RISING';
        level = 'SILENT';
        reason = `Artículo recién activo con ${currentViews} vistas (por debajo del umbral de acción).`;
      } else {
        trend = 'INSUFFICIENT_DATA';
        level = 'SILENT';
        reason = 'Muy pocas vistas para clasificar.';
      }
    } else if (deltaPercent !== null && deltaPercent >= opts.actionableGrowthPct && currentViews >= opts.minActionableViews) {
      trend = 'BREAKOUT';
      const hasReliableAttribution = !!attribution && attribution.source !== 'unknown';
      level = (confidence >= opts.minConfidence && hasReliableAttribution) ? 'ACTIONABLE' : 'INFORMATIONAL';
      reason = `Crecimiento de ${deltaPercent}% respecto al período anterior (${previousViews} → ${currentViews} vistas).`;
      recommendedAction = level === 'ACTIONABLE' ? 'Distribuir nuevamente si la atribución es confiable.' : 'Observar evolución antes de actuar.';
    } else if (deltaPercent !== null && deltaPercent >= opts.infoGrowthPct && currentViews >= opts.minInfoViews) {
      trend = 'RISING';
      level = 'INFORMATIONAL';
      reason = `Crecimiento sostenido del ${deltaPercent}% (${previousViews} → ${currentViews} vistas).`;
      recommendedAction = 'Revisar posición en portada o redes.';
    } else if (deltaPercent !== null && deltaPercent <= -50) {
      trend = 'DECLINING';
      level = 'SILENT';
      reason = `Caída del ${deltaPercent}% en vistas.`;
    } else {
      trend = 'STABLE';
      level = 'SILENT';
      reason = `Movimiento ${deltaPercent !== null ? `${deltaPercent}%` : 'sin cambio'} dentro del rango esperado.`;
    }

    results.push({
      slug,
      currentViews,
      previousViews,
      delta,
      deltaPercent,
      velocity,
      trend,
      level,
      confidence,
      sources,
      attribution,
      reason,
      recommendedAction,
    });
  }

  return results.sort((a, b) => b.currentViews - a.currentViews);
}
