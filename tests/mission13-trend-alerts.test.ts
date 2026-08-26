// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  computeTrend,
  buildTrendReport,
  siteSeriesFromDailyGrowth,
  type TrendPoint,
} from '@/lib/nios/intelligence/trend-engine';
import {
  runAlertEngine,
  buildFingerprint,
  DEFAULT_COOLDOWN_POLICY,
} from '@/lib/nios/intelligence/alert-engine';
import type { NiosAlert } from '@/lib/nios/intelligence/alerts';

function seriesOf(values: number[], startDate = '2026-08-01'): TrendPoint[] {
  const start = new Date(startDate);
  return values.map((value, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().split('T')[0], value };
  });
}

function makeAlert(overrides: Partial<NiosAlert> = {}): NiosAlert {
  return {
    date: '2026-08-26',
    severity: 'critical',
    category: 'pipeline',
    message: 'Pipeline NIOS falló en última ejecución (2026-08-26)',
    resolved: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Misión 13 — Trend Engine', () => {
  it('1. serie insuficiente → INSUFFICIENT_DATA, sin inventar clasificación', () => {
    const t = computeTrend('site', 'visitas', seriesOf([10, 12, 11]));
    expect(t.classification).toBe('INSUFFICIENT_DATA');
    expect(t.velocityPct).toBeNull();
    expect(t.momentumPct).toBeNull();
    expect(t.explanation).toContain('3 día(s)');
  });

  it('2. serie estable → STABLE', () => {
    const t = computeTrend('site', 'visitas', seriesOf([100, 102, 98, 101, 99, 100, 103]));
    expect(t.classification).toBe('STABLE');
    expect(t.velocityPct).not.toBeNull();
    expect(Math.abs(t.velocityPct!)).toBeLessThan(25);
  });

  it('3. subida fuerte → BREAKOUT con velocidad positiva', () => {
    const t = computeTrend('site', 'visitas', seriesOf([10, 10, 10, 10, 10, 40, 60, 80]));
    expect(t.classification).toBe('BREAKOUT');
    expect(t.velocityPct!).toBeGreaterThanOrEqual(100);
  });

  it('4. caída fuerte → COLLAPSING', () => {
    const t = computeTrend('site', 'visitas', seriesOf([100, 100, 100, 100, 100, 20, 15, 10]));
    expect(t.classification).toBe('COLLAPSING');
    expect(t.velocityPct!).toBeLessThanOrEqual(-60);
  });

  it('5. momentum refleja aceleración', () => {
    const t = computeTrend('site', 'visitas', seriesOf([10, 10, 10, 12, 14, 16, 30, 45, 60]));
    expect(t.momentumPct).not.toBeNull();
    expect(t.momentumPct!).toBeGreaterThan(0);
  });

  it('6. serie corta pero clasificable se marca como hipótesis', () => {
    const t = computeTrend('site', 'visitas', seriesOf([10, 10, 30, 40, 50]));
    expect(t.classification).not.toBe('INSUFFICIENT_DATA');
    expect(t.isHypothesis).toBe(true);
    expect(t.explanation).toContain('provisional');
  });

  it('7. baseline cero con actividad reciente → BREAKOUT desde cero, sin ratio inventado', () => {
    const t = computeTrend('articulo-x', 'visitas', seriesOf([0, 0, 0, 0, 0, 25, 40, 55]));
    expect(t.classification).toBe('BREAKOUT');
    expect(t.velocityPct).toBeNull();
  });

  it('8. buildTrendReport separa señales accionables', () => {
    const report = buildTrendReport({
      estable: { metric: 'visitas', points: seriesOf([50, 51, 49, 50, 52, 50, 51]) },
      despegue: { metric: 'visitas', points: seriesOf([10, 10, 10, 10, 10, 50, 70, 90]) },
      corto: { metric: 'visitas', points: seriesOf([5, 6]) },
    });
    expect(report.signals).toHaveLength(3);
    expect(report.actionable).toHaveLength(1);
    expect(report.actionable[0].entityId).toBe('despegue');
    expect(report.summary).toContain('3 series evaluadas');
  });

  it('9. siteSeriesFromDailyGrowth ordena y filtra fechas inválidas', () => {
    const points = siteSeriesFromDailyGrowth({
      '2026-08-03': 30,
      '2026-08-01': 10,
      'invalid-date': 99,
      '2026-08-02': 20,
    });
    expect(points.map((p) => p.value)).toEqual([10, 20, 30]);
  });
});

describe('Misión 13 — Alert Engine (dedupe, cooldown, digest)', () => {
  it('10. fingerprint normaliza números variables', () => {
    const a = makeAlert({ message: 'Health score por debajo de 80: 72 (CRITICO)' });
    const b = makeAlert({ message: 'Health score por debajo de 80: 65 (CRITICO)' });
    expect(buildFingerprint(a)).toBe(buildFingerprint(b));
  });

  it('11. duplicados en la misma corrida se suprimen', () => {
    const result = runAlertEngine([makeAlert(), makeAlert()], []);
    expect(result.toEmit).toHaveLength(1);
    expect(result.suppressedDuplicates).toHaveLength(1);
  });

  it('12. cooldown activo suprime la re-emisión', () => {
    const now = new Date('2026-08-26T12:00:00Z');
    const recent = [makeAlert({ createdAt: '2026-08-26T10:00:00Z' })]; // hace 2h, cooldown critical = 6h
    const result = runAlertEngine([makeAlert()], recent, DEFAULT_COOLDOWN_POLICY, now);
    expect(result.toEmit).toHaveLength(0);
    expect(result.suppressedByCooldown).toHaveLength(1);
  });

  it('13. cooldown vencido permite re-emisión', () => {
    const now = new Date('2026-08-26T20:00:00Z');
    const recent = [makeAlert({ createdAt: '2026-08-26T10:00:00Z' })]; // hace 10h > 6h
    const result = runAlertEngine([makeAlert()], recent, DEFAULT_COOLDOWN_POLICY, now);
    expect(result.toEmit).toHaveLength(1);
    expect(result.suppressedByCooldown).toHaveLength(0);
  });

  it('14. digest agrupa por categoría y severidad, críticas primero', () => {
    const result = runAlertEngine(
      [
        makeAlert({ severity: 'warning', category: 'traffic', message: 'Fallback traffic alto A' }),
        makeAlert({ severity: 'warning', category: 'traffic', message: 'Fallback traffic alto B distinto' }),
        makeAlert({ severity: 'critical', category: 'pipeline', message: 'Pipeline caído' }),
      ],
      [],
    );
    expect(result.digest[0].severity).toBe('critical');
    const trafficGroup = result.digest.find((g) => g.category === 'traffic');
    expect(trafficGroup?.count).toBe(2);
  });

  it('15. alerta distinta no se ve afectada por cooldown de otra huella', () => {
    const now = new Date('2026-08-26T12:00:00Z');
    const recent = [makeAlert({ createdAt: '2026-08-26T11:00:00Z' })];
    const other = makeAlert({ category: 'health', message: 'Health score por debajo de 80: 70 (CRITICO)' });
    const result = runAlertEngine([other], recent, DEFAULT_COOLDOWN_POLICY, now);
    expect(result.toEmit).toHaveLength(1);
  });
});
