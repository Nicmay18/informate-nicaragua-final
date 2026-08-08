import { describe, it, expect } from 'vitest';
import { buildReliabilitySnapshotFromTelemetry } from '@/lib/nios/intelligence/reliability-monitor';
import { buildWeeklyReliabilityReport } from '@/lib/nios/intelligence/weekly-reliability-report';
import { calculateHealthScore, calculateHealthScoreV11 } from '@/lib/nios/intelligence/health-score';
import { evaluateAlerts } from '@/lib/nios/intelligence/alerts';
import type { NiosTelemetryDocument } from '@/lib/nios/intelligence/telemetry';
import type { NiosExecutionReport } from '@/lib/nios/intelligence/performance-report';
import type { TrafficMigrationStatus } from '@/lib/analytics/traffic-reader';

function makeReport(overrides: Partial<NiosExecutionReport> = {}): NiosExecutionReport {
  return {
    date: '2026-08-07',
    totalDuration: 5000,
    modules: [
      { name: 'data-collector', durationMs: 2000, status: 'success' },
      { name: 'meni-evaluator', durationMs: 3000, status: 'success' },
    ],
    firestore: { reads: 500, writes: 100, deletes: 0 },
    traffic: { trafficLogWrites: 50, trafficDailyWrites: 50, dailyTotalViews: 1000 },
    cost: { monthlyFirestoreWrites: 3000, monthlyFirestoreReads: 15000, estimatedMonthlyCostUSD: 5 },
    healthSignals: [],
    errors: [],
    articlesAnalyzed: 100,
    snapshotSizeEstimate: 50000,
    ...overrides,
  };
}

function makeTrafficMigration(overrides: Partial<TrafficMigrationStatus> = {}): TrafficMigrationStatus {
  return {
    dailySource: 'traffic_daily',
    fallbackReads: 0,
    migrationHealth: 100,
    dailyGenerated: true,
    ...overrides,
  };
}

function makeTelemetryDoc(
  date: string,
  reportOverrides: Partial<NiosExecutionReport> = {},
  trafficOverrides: Partial<TrafficMigrationStatus> = {},
): NiosTelemetryDocument {
  return {
    date,
    report: makeReport({ date, ...reportOverrides }),
    health: { score: 95, level: 'MUY BUENO', warnings: [], breakdown: { performance: 24, firestore: 24, reliability: 24, scalability: 23 } },
    trafficMigration: makeTrafficMigration(trafficOverrides),
    savedAt: `${date}T12:00:00Z`,
  };
}

describe('Reliability Monitor (FASE 3.9)', () => {
  it('pipeline exitoso genera estado saludable', () => {
    const docs = [
      makeTelemetryDoc('2026-08-07'),
      makeTelemetryDoc('2026-08-06'),
      makeTelemetryDoc('2026-08-05'),
    ];
    const snapshot = buildReliabilitySnapshotFromTelemetry(docs);

    expect(snapshot.reliabilityScore).toBe(100);
    expect(snapshot.pipeline.success).toBe(true);
    expect(snapshot.pipeline.failedModules).toEqual([]);
    expect(snapshot.warnings).toEqual([]);
  });

  it('fallback tráfico genera warning', () => {
    const docs = [
      makeTelemetryDoc('2026-08-07', {}, { dailySource: 'traffic_log_fallback', fallbackReads: 1, migrationHealth: 0, dailyGenerated: false }),
      makeTelemetryDoc('2026-08-06'),
      makeTelemetryDoc('2026-08-05'),
    ];
    const snapshot = buildReliabilitySnapshotFromTelemetry(docs);

    expect(snapshot.trafficMigration.fallbackReads).toBe(1);
    expect(snapshot.trafficMigration.trafficDailyCoverage).toBeLessThan(100);
    expect(snapshot.warnings.length).toBeGreaterThan(0);
    expect(snapshot.warnings.some((w) => w.includes('Fallback'))).toBe(true);
    expect(snapshot.reliabilityScore).toBeLessThan(100);
  });

  it('errores bajan Health Score', () => {
    const report = makeReport({
      errors: ['Module X failed'],
      modules: [
        { name: 'data-collector', durationMs: 2000, status: 'success' },
        { name: 'broken-module', durationMs: 1000, status: 'error', error: 'timeout' },
      ],
    });

    const health = calculateHealthScore(report, true);
    expect(health.score).toBeLessThan(95);
    expect(health.breakdown.reliability).toBeLessThan(25);
    expect(health.warnings.some((w) => w.includes('errores') || w.includes('fallidos'))).toBe(true);
  });

  it('reporte semanal correcto', () => {
    const docs = [
      makeTelemetryDoc('2026-08-07', { totalDuration: 6000, modules: [
        { name: 'data-collector', durationMs: 1500, status: 'success' },
        { name: 'meni-evaluator', durationMs: 4500, status: 'success' },
      ]}),
      makeTelemetryDoc('2026-08-06'),
      makeTelemetryDoc('2026-08-05'),
    ];
    const snapshot = buildReliabilitySnapshotFromTelemetry(docs);
    const report = buildWeeklyReliabilityReport(snapshot, docs);

    expect(report.questions.pipelineExecutedCorrectly).toBe(true);
    expect(report.questions.slowestModule).toBe('meni-evaluator');
    expect(report.questions.hadErrors).toBe(false);
    expect(report.questions.trafficAggregatedCorrectly).toBe(true);
    expect(report.questions.operationalRisk).toBe('low');
    expect(report.questions.requiresAttention.length).toBe(0);
  });

  it('compatibilidad snapshot existente: v1.0 health score sin cambios', () => {
    const report = makeReport();
    const healthV1 = calculateHealthScore(report, true);

    expect(healthV1.score).toBeGreaterThanOrEqual(90);
    expect(healthV1.healthScoreVersion).toBeUndefined();
    expect(healthV1.extendedSignals).toBeUndefined();
  });

  it('health score v1.1 agrega señales extendidas sin cambiar fórmula', () => {
    const report = makeReport();
    const healthV1 = calculateHealthScore(report, true);
    const healthV11 = calculateHealthScoreV11(report, true, {
      reliabilityUptime: 100,
      errorsLast7Days: 0,
      trafficDailyPercentage: 100,
      trafficFallback: 0,
      firestoreCostTrend: 'stable',
    });

    expect(healthV11.healthScoreVersion).toBe('1.1');
    expect(healthV11.score).toBe(healthV1.score);
    expect(healthV11.extendedSignals).toBeDefined();
    expect(healthV11.extendedSignals.reliabilityUptime).toBe(100);
  });

  it('alertas: pipeline falla genera alerta crítica', () => {
    const docs = [makeTelemetryDoc('2026-08-07', {
      errors: ['Pipeline crash'],
      modules: [{ name: 'data-collector', durationMs: 1000, status: 'error', error: 'crash' }],
    })];
    const snapshot = buildReliabilitySnapshotFromTelemetry(docs);
    const health = { score: 75, level: 'REQUIERE INTERVENCIÓN' as const, warnings: [], breakdown: { performance: 20, firestore: 20, reliability: 15, scalability: 20 } };
    const alerts = evaluateAlerts(snapshot, health);

    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts.some((a) => a.severity === 'critical' && a.category === 'pipeline')).toBe(true);
    expect(alerts.some((a) => a.severity === 'critical' && a.category === 'health')).toBe(true);
  });

  it('alertas: duración >50% genera warning', () => {
    const docs = [makeTelemetryDoc('2026-08-07', { totalDuration: 9000 })];
    const snapshot = buildReliabilitySnapshotFromTelemetry(docs);
    const health = { score: 90, level: 'MUY BUENO' as const, warnings: [], breakdown: { performance: 22, firestore: 24, reliability: 24, scalability: 20 } };
    const alerts = evaluateAlerts(snapshot, health, 5000);

    expect(alerts.some((a) => a.severity === 'warning' && a.category === 'performance')).toBe(true);
  });

  it('snapshot vacío devuelve estado seguro', () => {
    const snapshot = buildReliabilitySnapshotFromTelemetry([]);

    expect(snapshot.reliabilityScore).toBe(0);
    expect(snapshot.warnings).toContain('Sin datos de telemetría disponibles');
    expect(snapshot.pipeline.success).toBe(false);
  });
});
