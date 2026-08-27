import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkFirebaseHealth } from '@/lib/nios/intelligence/firebase-health';
import { generateNiosDiagnostics } from '@/lib/nios/intelligence/diagnostics';
import { collectGSC } from '@/lib/nios/intelligence/gsc-collector';
import { collectGA4 } from '@/lib/nios/intelligence/ga4-collector';
import { evaluateArticleMomentum } from '@/lib/nios/intelligence/article-momentum';
import { runAlertEngine } from '@/lib/nios/intelligence/alert-engine';
import {
  computeTrend,
  buildTrendReport,
} from '@/lib/nios/intelligence/trend-engine';
import { reconcileTraffic } from '@/lib/nios/intelligence/traffic-reconciler';
import { buildCeoVerdict } from '@/lib/nios/ceo-verdict';
import { getMetricDefinition } from '@/lib/nios/intelligence/metric-truth';
import { buildNotificationForensics } from '@/lib/nios/intelligence/notification-forensics';
import { DATA_STATUS_LABELS } from '@/lib/nios/intelligence/types';
import * as firebaseAdmin from '@/lib/firebase-admin';
import type { NiosAlert } from '@/lib/nios/intelligence/alerts';

function mockTraffic(views = 100, sources: Record<string, number> = {}): any {
  return {
    hasData: views > 0,
    generatedAt: new Date().toISOString(),
    topArticles: [
      { slug: 'test-article', views, sources },
    ],
    topSources: [],
    dailyGrowth: {},
    weeklyTrend: 0,
    totalViews: views,
    totalSessions: 0,
  };
}

describe('Mission 17 — Production Observability & Control Center', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('1. GSC CONFIG_REQUIRED cuando no hay siteUrl', async () => {
    const gsc = await collectGSC('', 7);
    expect(gsc).not.toBeNull();
    expect(gsc!.status).toBe('CONFIG_REQUIRED');
    expect(gsc!.errorMessage).toContain('NIOS_GSC_SITE_URL');
  });

  it('2. GSC TIMEOUT produce diagnóstico con acción RETRY_LATER', () => {
    const ds = generateNiosDiagnostics(
      { status: 'TIMEOUT', collectedAt: new Date().toISOString(), siteUrl: 'https://example.com', errorMessage: 'timeout' } as any,
      null,
    );
    const gsc = ds.find((d) => d.source === 'GSC');
    expect(gsc?.status).toBe('TIMEOUT');
    expect(gsc?.action).toBe('RETRY_LATER');
    expect(gsc?.severity).toBe('high');
  });

  it('3. GSC NETWORK_ERROR produce diagnóstico con acción RETRY_LATER', () => {
    const ds = generateNiosDiagnostics(
      { status: 'NETWORK_ERROR', collectedAt: new Date().toISOString(), siteUrl: 'https://example.com', errorMessage: 'ENOTFOUND' } as any,
      null,
    );
    const gsc = ds.find((d) => d.source === 'GSC');
    expect(gsc?.status).toBe('NETWORK_ERROR');
    expect(gsc?.action).toBe('RETRY_LATER');
  });

  it('4. GA4 CONFIG_REQUIRED cuando no hay propertyId', async () => {
    const ga4 = await collectGA4('', 7);
    expect(ga4).not.toBeNull();
    expect(ga4.status).toBe('CONFIG_REQUIRED');
    expect(ga4.errorMessage).toContain('NIOS_GA4_PROPERTY_ID');
  });

  it('5. GA4 TIMEOUT diagnostic label exists and maps to action', () => {
    expect(DATA_STATUS_LABELS.TIMEOUT).toBe('Tiempo de espera agotado');
    expect(DATA_STATUS_LABELS.NETWORK_ERROR).toBe('Error de red');
  });

  it('6. Firebase health reporta DOWN con credenciales ausentes', async () => {
    vi.stubEnv('FIREBASE_PROJECT_ID', '');
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', '');
    vi.stubEnv('FIREBASE_PRIVATE_KEY', '');
    const health = await checkFirebaseHealth();
    expect(health.health).toBe('DOWN');
    expect(health.status).toBe('CREDENTIALS_MISSING');
    expect(health.confidence).toBe(0);
  });

  it('7. Firebase health reporta HEALTHY con lectura simulada', async () => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'test-project');
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', 'sa@test.iam.gserviceaccount.com');
    vi.stubEnv('FIREBASE_PRIVATE_KEY', '-----BEGIN PRIVATE KEY-----\nfoo\n-----END PRIVATE KEY-----');
    const fakeSnap = { empty: true, docs: [] } as any;
    const fakeGet = vi.fn().mockResolvedValue(fakeSnap);
    const fakeLimit = { get: fakeGet } as any;
    const fakeQuery = { limit: () => fakeLimit } as any;
    const fakeCollection = { orderBy: () => fakeQuery } as any;
    const fakeDb = { collection: vi.fn().mockReturnValue(fakeCollection) } as any;
    vi.spyOn(firebaseAdmin, 'getAdminDb').mockReturnValue(fakeDb as any);
    const health = await checkFirebaseHealth();
    expect(health.health).toBe('HEALTHY');
    expect(health.status).toBe('CONNECTED');
    expect(health.readCount).toBeGreaterThan(0);
  });

  it('8. Article momentum INSUFFICIENT_DATA para artículo sin vistas', () => {
    const current = mockTraffic(0);
    const [m] = evaluateArticleMomentum(current, null);
    expect(m.trend).toBe('INSUFFICIENT_DATA');
    expect(m.level).toBe('SILENT');
  });

  it('9. Article momentum STABLE para cambio pequeño', () => {
    const current = mockTraffic(100);
    const previous = mockTraffic(95);
    const [m] = evaluateArticleMomentum(current, previous);
    expect(m.trend).toBe('STABLE');
    expect(m.level).toBe('SILENT');
  });

  it('10. Article momentum RISING cuando supera umbral informativo', () => {
    const current = mockTraffic(80);
    const previous = mockTraffic(40);
    const [m] = evaluateArticleMomentum(current, previous, { infoGrowthPct: 25, minInfoViews: 10 });
    expect(m.trend).toBe('RISING');
    expect(m.level).toBe('INFORMATIONAL');
  });

  it('11. Article momentum BREAKOUT/ACTIONABLE cuando supera umbral con atribución', () => {
    const current = mockTraffic(300, { direct: 200, organic: 80, social: 20 });
    const previous = mockTraffic(100, { direct: 60, organic: 30, social: 10 });
    const [m] = evaluateArticleMomentum(current, previous, {
      actionableGrowthPct: 100,
      minActionableViews: 100,
      minConfidence: 60,
    });
    expect(m.trend).toBe('BREAKOUT');
    expect(m.level).toBe('ACTIONABLE');
    expect(m.momentum).toBe(m.delta);
    expect(m.timestamp).toBeDefined();
    expect(m.window).toBe(7);
  });

  it('12. Article momentum emite SILENT cuando la atribución es unknown', () => {
    const current = mockTraffic(300, { direct: 80, organic: 80, social: 80 });
    const previous = mockTraffic(100, { direct: 30, organic: 30, social: 40 });
    const [m] = evaluateArticleMomentum(current, previous, {
      actionableGrowthPct: 100,
      minActionableViews: 100,
    });
    expect(m.trend).toBe('BREAKOUT');
    // Sin fuente dominante > 50% la confianza cae y es informativo, no accionable.
    expect(m.level).toBe('INFORMATIONAL');
  });

  it('13. Alert engine deduplica alertas duplicadas en la misma corrida', () => {
    const a1: NiosAlert = {
      date: '2026-08-27',
      severity: 'warning',
      category: 'traffic',
      message: 'Breakout de tráfico en test-article: +200 vistas',
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    const a2: NiosAlert = { ...a1 };
    const result = runAlertEngine([a1, a2], []);
    expect(result.toEmit).toHaveLength(1);
    expect(result.suppressedDuplicates).toHaveLength(1);
    expect(result.digest).toHaveLength(1);
  });

  it('14. Alert engine respeta cooldown y no reemite la misma alerta', () => {
    const a1: NiosAlert = {
      date: '2026-08-27',
      severity: 'warning',
      category: 'traffic',
      message: 'Breakout de tráfico en test-article: +200 vistas',
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    const first = runAlertEngine([a1], []);
    expect(first.toEmit).toHaveLength(1);
    const second = runAlertEngine([a1], first.toEmit);
    expect(second.toEmit).toHaveLength(0);
    expect(second.suppressedByCooldown).toHaveLength(1);
  });

  it('15. ReconcileTraffic nunca mezcla métricas incompatibles', () => {
    const intel = reconcileTraffic(
      {
        hasData: true,
        generatedAt: new Date().toISOString(),
        topArticles: [],
        topSources: [{ name: 'direct', views: 100 }],
        dailyGrowth: { '2026-08-26': 100 },
        weeklyTrend: 0,
      } as any,
      { status: 'REAL', totalClicks: 55 } as any,
      { status: 'REAL', totalUsers: 120, totalSessions: 150 } as any,
    );
    // Cada fuente conserva su propia unidad; nunca se suman entre ellas.
    const units = intel.sources.map((s: { unit: string }) => s.unit);
    expect(new Set(units).size).toBe(units.length);
    expect(intel.hasData).toBe(true);
    expect(intel.totalTrafficViews7d).toBe(100);
    expect(intel.gscClicks).toBe(55);
    expect(intel.ga4Users).toBe(120);
  });

  it('16. Metric truth distingue lifetime vs ventana reciente', () => {
    const lifetime = getMetricDefinition('article.views.canonical');
    const recent = getMetricDefinition('site.traffic.recent24h');
    expect(lifetime?.period).toBe('lifetime');
    expect(recent?.period).toBeDefined();
    expect(recent?.period).not.toBe('lifetime');
  });

  it('17. Trend engine detecta crecimiento fuerte en series con datos suficientes', () => {
    const points = [
      { date: '2024-01-01', value: 100 },
      { date: '2024-01-02', value: 100 },
      { date: '2024-01-03', value: 100 },
      { date: '2024-01-04', value: 100 },
      { date: '2024-01-05', value: 300 },
      { date: '2024-01-06', value: 350 },
      { date: '2024-01-07', value: 400 },
    ];
    const trend = computeTrend('site', 'visitas', points);
    expect(['BREAKOUT', 'RISING']).toContain(trend.classification);
    expect(trend.daysObserved).toBe(7);
  });

  it('18. Trend report reporta señales y resumen para series largas', () => {
    const points = Array.from({ length: 20 }, (_, i) => ({ date: `2024-01-${String(i + 1).padStart(2, '0')}`, value: 100 + i * 40 }));
    const report = buildTrendReport({ site: { metric: 'visitas', points } });
    expect(report.signals).toHaveLength(1);
    expect(report.signals[0].isHypothesis).toBe(false);
    expect(report.summary).toContain('series evaluadas');
  });

  it('19. CEO verdict integra firebaseHealth y articleMomentum en evidencia', () => {
    const verdict = buildCeoVerdict({
      articlesCount: 10,
      trafficIntelligence: { hasData: true, message: 'OK', sources: [] },
      gsc: { status: 'REAL' } as any,
      ga4: { status: 'REAL' } as any,
      trust: { averageGoogleTrustScore: 85 } as any,
      alerts: [],
      socialConversion: { status: 'SALUDABLE', mainProblem: 'NONE', confidence: 80, actions: [], doNotDo: [], facebook: { status: 'OK' }, web: { sessions: 0, articleViews: 0, summary: '' }, conversion: { point: 'NONE', attributionConfidence: 'UNAVAILABLE' } } as any,
      snapshot: null,
      snapshotDate: null,
      google: null,
      adsense: null,
      traffic: null,
      meniLearning: null,
      learningPatterns: [],
      reliability: null,
      weekly: null,
      telemetry: null,
      telemetryHistory: [],
      ttlStatus: 'pendiente',
      contentOpportunity: null,
      categoryIntelligence: null,
      editorCEOReport: null,
      snapshotHistory: [],
      trends: null,
      articleMomentum: [
        { slug: 'noticia-a', currentViews: 300, previousViews: 100, delta: 200, deltaPercent: 200, velocity: 42, momentum: 200, trend: 'BREAKOUT', level: 'ACTIONABLE', alertLevel: 'ACTIONABLE', confidence: 90, window: 7, timestamp: new Date().toISOString(), sources: { direct: 200 }, attribution: { source: 'direct', confidence: 100 }, reason: 'Breakout', recommendedAction: 'Redistribuir' },
      ],
      firebaseHealth: {
        source: 'Firebase',
        status: 'CONNECTED',
        health: 'HEALTHY',
        lastAttemptAt: new Date().toISOString(),
        lastSuccessAt: new Date().toISOString(),
        lastDataAt: new Date().toISOString(),
        dataAgeHours: 2,
        readCount: 4,
        writeCount: 0,
        errorCount: 0,
        latencyMs: 120,
        collectionsChecked: ['noticias'],
        projectId: 'test',
        clientEmail: 'sa***@test',
        note: 'OK',
        errorMessage: '',
        confidence: 95,
        recommendedAction: 'No requiere acción.',
      },
      diagnostics: [],
      topMovingArticles: [],
      topLifetimeArticles: [],
      lastRunAt: new Date().toISOString(),
      dataAgeHours: 2,
      stale: false,
    } as any);
    const firebaseEvidence = verdict.evidence.find((e) => e.source === 'Firebase');
    const momentumEvidence = verdict.evidence.find((e) => e.source === 'Momentum');
    expect(firebaseEvidence?.status).toBe('HEALTHY');
    expect(momentumEvidence?.status).toBe('REAL');
    expect(verdict.whatMatters.some((m) => m.toLowerCase().includes('momentum'))).toBe(true);
  });

  it('20. CEO verdict no usa lenguaje dramático con datos insuficientes', () => {
    const verdict = buildCeoVerdict({
      articlesCount: 10,
      trafficIntelligence: { hasData: false, message: 'Sin datos', sources: [] },
      gsc: { status: 'NO_DATA' } as any,
      ga4: { status: 'NO_DATA' } as any,
      trust: null,
      alerts: [],
      socialConversion: { status: 'EVIDENCIA_INSUFICIENTE', mainProblem: 'NONE', confidence: 25, actions: [], doNotDo: [], facebook: { status: 'NOT_CONFIGURED' }, web: { sessions: 0, articleViews: 0, summary: '' }, conversion: { point: 'NONE', attributionConfidence: 'UNAVAILABLE' } } as any,
      snapshot: null,
      snapshotDate: null,
      google: null,
      adsense: null,
      traffic: null,
      meniLearning: null,
      learningPatterns: [],
      reliability: null,
      weekly: null,
      telemetry: null,
      telemetryHistory: [],
      ttlStatus: 'pendiente',
      contentOpportunity: null,
      categoryIntelligence: null,
      editorCEOReport: null,
      snapshotHistory: [],
      trends: null,
    } as any);
    const combined = [verdict.status, verdict.statusLabel, verdict.whatIsHappening, ...verdict.whatMatters, ...verdict.whatToDoToday, ...verdict.doNotDo].join(' ');
    expect(combined).not.toMatch(/LA ESTÁS CAGANDO|LA CAGASTE|EL NEGOCIO ESTÁ FRACASANDO|TODO ESTÁ MAL|NO SIRVE/i);
    expect(['SALUDABLE', 'REQUIERE_ATENCION', 'RIESGO_CRITICO', 'EVIDENCIA_INSUFICIENTE']).toContain(verdict.status);
  });

  it('21. Notification forensics reporta NO_DATA sin registros', () => {
    const report = buildNotificationForensics([], [], 7);
    expect(report.recordsAnalyzed).toBe(0);
    expect(report.channels).toHaveLength(5);
    expect(report.channels.every((c) => c.health === 'NO_DATA')).toBe(true);
  });

  it('22. Notification forensics clasifica HEALTHY, DOWN y reintentos por canal', () => {
    const now = new Date().toISOString();
    const records = [
      {
        slug: 'noticia-1',
        fecha: now,
        resultados: {
          telegram: { ok: true },
          facebook: { ok: false, error: 'Token expirado' },
          push: { ok: true, skipped: true },
        },
      },
      {
        slug: 'noticia-2',
        fecha: now,
        resultados: {
          telegram: { ok: true },
          facebook: { ok: false, error: 'Token expirado' },
        },
      },
    ];
    const pending = [
      { slug: 'noticia-1', canalesFallidos: ['facebook'], reintentos: 1, proximoIntento: now },
    ];
    const report = buildNotificationForensics(records, pending, 7);

    const telegram = report.channels.find((c) => c.channel === 'telegram');
    const facebook = report.channels.find((c) => c.channel === 'facebook');
    const push = report.channels.find((c) => c.channel === 'push');

    expect(telegram?.health).toBe('HEALTHY');
    expect(telegram?.successRate).toBe(100);
    expect(facebook?.health).toBe('DEGRADED'); // Tiene reintentos en cola
    expect(facebook?.failures).toBe(2);
    expect(facebook?.lastError).toBe('Token expirado');
    expect(facebook?.pendingRetries).toBe(1);
    expect(push?.health).toBe('NO_DATA'); // Solo skipped, sin intentos reales
    expect(push?.skipped).toBe(1);
  });

  it('23. Notification forensics ignora registros fuera de la ventana', () => {
    const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const records = [
      { slug: 'vieja', fecha: old, resultados: { telegram: { ok: true } } },
    ];
    const report = buildNotificationForensics(records, [], 7);
    expect(report.recordsAnalyzed).toBe(0);
    expect(report.channels.find((c) => c.channel === 'telegram')?.health).toBe('NO_DATA');
  });
});
