import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildMomentumAlerts, emitMomentumAlerts } from '@/lib/nios/intelligence/alerts';
import { runAlertEngine } from '@/lib/nios/intelligence/alert-engine';
import { evaluateArticleMomentum } from '@/lib/nios/intelligence/article-momentum';

describe('Mission 16 — NIOS Production Closure', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makeTraffic = (slug: string, views: number, sources: Record<string, number> = {}) => ({
    topArticles: [{ slug, views, sources }],
    dailyGrowth: {},
    weeklyTrend: {},
    topSources: sources,
    generatedAt: new Date().toISOString(),
  } as any);

  it('1. actividad normal 100→105 es SILENT, no genera alertas', () => {
    const current = makeTraffic('sismo', 105, { direct: 105 });
    const previous = makeTraffic('sismo', 100, { direct: 100 });
    const momentum = evaluateArticleMomentum(current, previous);
    const alerts = buildMomentumAlerts(momentum);
    expect(momentum[0].level).toBe('SILENT');
    expect(alerts.length).toBe(0);
  });

  it('2. breakout 100→700 produce una sola alerta', () => {
    const current = makeTraffic('sismo', 700, { facebook: 500, direct: 200 });
    const previous = makeTraffic('sismo', 100, { direct: 100 });
    const momentum = evaluateArticleMomentum(current, previous);
    const alerts = buildMomentumAlerts(momentum);
    expect(momentum[0].level).toBe('ACTIONABLE');
    expect(momentum[0].trend).toBe('BREAKOUT');
    expect(alerts.length).toBe(1);
    expect(alerts[0].category).toBe('traffic');
    expect(alerts[0].severity).toBe('warning');
  });

  it('3. secuencia 100 → 250 → 400 → 700 genera solo un BREAKOUT', () => {
    // El motor evalúa snapshot vs snapshot; el crecimiento intermedio es informativo,
    // el único ACTIONABLE es el salto acumulado 100 → 700.
    const finalCurrent = makeTraffic('sismo', 700, { facebook: 500, direct: 200 });
    const firstPrevious = makeTraffic('sismo', 100, { direct: 100 });
    const finalMomentum = evaluateArticleMomentum(finalCurrent, firstPrevious);
    const finalCandidates = buildMomentumAlerts(finalMomentum);
    expect(finalCandidates.length).toBe(1);
    expect(finalCandidates[0].message).toContain('BREAKOUT');

    const intermediateCurrent = makeTraffic('sismo', 400, { facebook: 300, direct: 100 });
    const intermediatePrevious = makeTraffic('sismo', 250, { facebook: 250 });
    const intermediateMomentum = evaluateArticleMomentum(intermediateCurrent, intermediatePrevious);
    const intermediateCandidates = buildMomentumAlerts(intermediateMomentum);
    expect(intermediateCandidates.length).toBe(0);
    expect(intermediateMomentum[0].level).toBe('INFORMATIONAL');
  });

  it('4. emitMomentumAlerts no persiste duplicados en ventana corta', async () => {
    const persisted: any[] = [];
    const niosAlertsCollection = {
      where: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({
                docs: persisted.map((d) => ({ id: 'old', data: () => d })),
              }),
            })),
          })),
        })),
      })),
      doc: vi.fn(() => ({ id: 'new-alert-id' })),
    };

    const fakeDb = {
      collection: vi.fn((name: string) => {
        if (name === 'nios_alerts') return niosAlertsCollection;
        return { doc: vi.fn(() => ({ id: 'x' })) };
      }),
      batch: vi.fn(() => ({
        set: (_ref: any, alert: any) => persisted.push(alert),
        commit: vi.fn().mockResolvedValue(undefined),
      })),
    } as any;

    const current = makeTraffic('sismo', 700, { facebook: 500, direct: 200 });
    const previous = makeTraffic('sismo', 100, { direct: 100 });

    // Primera emisión
    const r1 = await emitMomentumAlerts(fakeDb, current, previous);
    expect(r1?.toEmit.length).toBe(1);
    expect(persisted.length).toBe(1);

    // Segunda emisión inmediata: dedupe/cooldown suprime
    const r2 = await emitMomentumAlerts(fakeDb, current, previous);
    expect(r2?.toEmit.length).toBe(0);
    expect(persisted.length).toBe(1);
  });
});
