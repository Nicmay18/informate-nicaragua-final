/**
 * NIOS Trend Engine
 * =================
 * Detección de tendencias en tiempo real sobre series diarias.
 * Calcula: baseline histórico, ventana reciente, velocidad y momentum.
 * Clasifica sin inventar datos: si la evidencia es insuficiente lo declara.
 *
 * Módulo puro: no lee Firestore ni variables de entorno.
 */

export interface TrendPoint {
  /** Fecha ISO (YYYY-MM-DD) del dato. */
  date: string;
  /** Valor observado ese día (visitas, clics, usuarios...). */
  value: number;
}

export type TrendClassification =
  | 'BREAKOUT'
  | 'RISING'
  | 'STABLE'
  | 'DECLINING'
  | 'COLLAPSING'
  | 'INSUFFICIENT_DATA';

export interface TrendSignal {
  /** Identificador de la entidad medida (slug, categoría, 'site'...). */
  entityId: string;
  /** Nombre de la métrica medida (p. ej. 'visitas', 'clics'). */
  metric: string;
  classification: TrendClassification;
  /** Promedio diario de toda la serie disponible. */
  lifetimeBaseline: number | null;
  /** Promedio diario de la ventana reciente. */
  recentAverage: number | null;
  /** Cambio porcentual de la ventana reciente frente al baseline. Null sin evidencia. */
  velocityPct: number | null;
  /** Cambio de velocidad: ventana reciente vs ventana previa. Null sin evidencia. */
  momentumPct: number | null;
  /** Días con datos usados en el cálculo. */
  daysObserved: number;
  /** Explicación en lenguaje editorial de qué se observó. */
  explanation: string;
  /** True cuando la clasificación es una hipótesis con pocos datos. */
  isHypothesis: boolean;
}

export interface TrendEngineOptions {
  /** Días de la ventana reciente. Default 3. */
  recentWindowDays?: number;
  /** Mínimo de días con datos para clasificar. Default 5. */
  minDaysForClassification?: number;
  /** Umbral % para RISING/DECLINING. Default 25. */
  velocityThresholdPct?: number;
  /** Umbral % para BREAKOUT/COLLAPSING. Default 100 (subida) / -60 (caída). */
  breakoutThresholdPct?: number;
  collapseThresholdPct?: number;
}

const DEFAULTS: Required<TrendEngineOptions> = {
  recentWindowDays: 3,
  minDaysForClassification: 5,
  velocityThresholdPct: 25,
  breakoutThresholdPct: 100,
  collapseThresholdPct: -60,
};

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function pctChange(current: number | null, reference: number | null): number | null {
  if (current === null || reference === null) return null;
  if (reference === 0) {
    // Sin base de comparación: 0 → 0 es estable; 0 → algo es indeterminado numéricamente.
    return current === 0 ? 0 : null;
  }
  return Number((((current - reference) / reference) * 100).toFixed(1));
}

/**
 * Calcula la tendencia de una serie diaria.
 * Ordena por fecha, ignora puntos con valores negativos o fechas inválidas.
 */
export function computeTrend(
  entityId: string,
  metric: string,
  series: TrendPoint[],
  options?: TrendEngineOptions,
): TrendSignal {
  const opts = { ...DEFAULTS, ...options };

  const clean = (series || [])
    .filter((p) => p && typeof p.value === 'number' && p.value >= 0 && !Number.isNaN(Date.parse(p.date)))
    .sort((a, b) => a.date.localeCompare(b.date));

  const daysObserved = clean.length;
  const values = clean.map((p) => p.value);

  if (daysObserved < opts.minDaysForClassification) {
    return {
      entityId,
      metric,
      classification: 'INSUFFICIENT_DATA',
      lifetimeBaseline: mean(values),
      recentAverage: null,
      velocityPct: null,
      momentumPct: null,
      daysObserved,
      explanation: `Solo ${daysObserved} día(s) con datos de ${metric}. Se requieren al menos ${opts.minDaysForClassification} para clasificar la tendencia.`,
      isHypothesis: false,
    };
  }

  const recent = values.slice(-opts.recentWindowDays);
  const previous = values.slice(-(opts.recentWindowDays * 2), -opts.recentWindowDays);
  const baselineValues = values.slice(0, -opts.recentWindowDays);

  const lifetimeBaseline = mean(baselineValues.length > 0 ? baselineValues : values);
  const recentAverage = mean(recent);
  const previousAverage = mean(previous);

  const velocityPct = pctChange(recentAverage, lifetimeBaseline);
  const previousVelocityPct = pctChange(previousAverage, lifetimeBaseline);
  const momentumPct =
    velocityPct !== null && previousVelocityPct !== null
      ? Number((velocityPct - previousVelocityPct).toFixed(1))
      : null;

  let classification: TrendClassification = 'STABLE';
  if (velocityPct === null) {
    // Baseline en cero con actividad reciente = brote desde cero (evidencia real, no inventada).
    classification = (recentAverage ?? 0) > 0 ? 'BREAKOUT' : 'STABLE';
  } else if (velocityPct >= opts.breakoutThresholdPct) {
    classification = 'BREAKOUT';
  } else if (velocityPct >= opts.velocityThresholdPct) {
    classification = 'RISING';
  } else if (velocityPct <= opts.collapseThresholdPct) {
    classification = 'COLLAPSING';
  } else if (velocityPct <= -opts.velocityThresholdPct) {
    classification = 'DECLINING';
  }

  const isHypothesis = daysObserved < opts.minDaysForClassification * 2;

  const velocityText =
    velocityPct === null
      ? 'sin base histórica comparable'
      : `${velocityPct > 0 ? '+' : ''}${velocityPct}% frente a su promedio histórico`;
  const momentumText =
    momentumPct === null
      ? ''
      : momentumPct > 0
        ? ` La tendencia se acelera (+${momentumPct} puntos).`
        : momentumPct < 0
          ? ` La tendencia pierde fuerza (${momentumPct} puntos).`
          : '';

  const explanation = `${metric} promedio reciente ${recentAverage?.toFixed(1) ?? '—'}/día, ${velocityText}.${momentumText}${
    isHypothesis ? ' Clasificación provisional: la serie histórica aún es corta.' : ''
  }`;

  return {
    entityId,
    metric,
    classification,
    lifetimeBaseline: lifetimeBaseline !== null ? Number(lifetimeBaseline.toFixed(2)) : null,
    recentAverage: recentAverage !== null ? Number(recentAverage.toFixed(2)) : null,
    velocityPct,
    momentumPct,
    daysObserved,
    explanation,
    isHypothesis,
  };
}

export interface TrendReport {
  generatedAt: string;
  signals: TrendSignal[];
  /** Señales con actividad significativa (no STABLE ni INSUFFICIENT_DATA). */
  actionable: TrendSignal[];
  summary: string;
}

/**
 * Genera un reporte de tendencias para múltiples series.
 */
export function buildTrendReport(
  seriesById: Record<string, { metric: string; points: TrendPoint[] }>,
  options?: TrendEngineOptions,
): TrendReport {
  const signals = Object.entries(seriesById).map(([entityId, s]) =>
    computeTrend(entityId, s.metric, s.points, options),
  );

  const actionable = signals.filter(
    (s) => s.classification !== 'STABLE' && s.classification !== 'INSUFFICIENT_DATA',
  );

  const breakouts = actionable.filter((s) => s.classification === 'BREAKOUT').length;
  const collapses = actionable.filter((s) => s.classification === 'COLLAPSING').length;
  const insufficient = signals.filter((s) => s.classification === 'INSUFFICIENT_DATA').length;

  const summary = `Tendencias: ${signals.length} series evaluadas, ${actionable.length} con movimiento significativo (${breakouts} en despegue, ${collapses} en caída fuerte). ${insufficient} sin evidencia suficiente.`;

  return {
    generatedAt: new Date().toISOString(),
    signals,
    actionable,
    summary,
  };
}

/**
 * Construye la serie diaria del sitio a partir de trafficPerformance.dailyGrowth
 * (Record<fecha, visitas>). Devuelve puntos ordenados por fecha.
 */
export function siteSeriesFromDailyGrowth(dailyGrowth: Record<string, number> | null | undefined): TrendPoint[] {
  if (!dailyGrowth) return [];
  return Object.entries(dailyGrowth)
    .filter(([date, value]) => typeof value === 'number' && !Number.isNaN(Date.parse(date)))
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
