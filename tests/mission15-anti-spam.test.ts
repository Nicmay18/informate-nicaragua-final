import { describe, it, expect } from 'vitest';
import { evaluateArticleMomentum } from '@/lib/nios/intelligence/article-momentum';
import { runAlertEngine, buildFingerprint } from '@/lib/nios/intelligence/alert-engine';

describe('Mission 15 — NIOS Anti-Spam y Article Momentum', () => {
  it('1. actividad normal de +3 vistas es SILENT', () => {
    const current = { topArticles: [{ slug: 'sismo', views: 12, sources: { direct: 3, facebook: 9 } }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const previous = { topArticles: [{ slug: 'sismo', views: 9, sources: { direct: 3, facebook: 6 } }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const m = evaluateArticleMomentum(current, previous);
    expect(m[0].level).toBe('SILENT');
    expect(m[0].trend).toBe('STABLE');
  });

  it('2. múltiples views rápidas menores al umbral no generan ACTIONABLE', () => {
    const current = { topArticles: [{ slug: 'sismo', views: 45, sources: { facebook: 30, direct: 15 } }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const previous = { topArticles: [{ slug: 'sismo', views: 5, sources: { direct: 5 } }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const m = evaluateArticleMomentum(current, previous);
    expect(m[0].level).not.toBe('ACTIONABLE');
  });

  it('3. breakout 10 → 500 es ACTIONABLE con atribución', () => {
    const current = { topArticles: [{ slug: 'sismo', views: 510, sources: { facebook: 370, direct: 90, google: 50 } }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const previous = { topArticles: [{ slug: 'sismo', views: 10, sources: { direct: 10 } }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const m = evaluateArticleMomentum(current, previous);
    expect(m[0].level).toBe('ACTIONABLE');
    expect(m[0].trend).toBe('BREAKOUT');
    expect(m[0].attribution?.source).toBe('facebook');
  });

  it('4. breakout con confianza baja queda en INFORMATIONAL', () => {
    const current = { topArticles: [{ slug: 'sismo', views: 120, sources: { unknown: 120 } }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const previous = { topArticles: [{ slug: 'sismo', views: 10, sources: {} }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const m = evaluateArticleMomentum(current, previous, { minConfidence: 80 });
    expect(m[0].level).toBe('INFORMATIONAL');
  });

  it('5. breakout desde cero sin baseline es INFORMATIONAL, no ACTIONABLE', () => {
    const current = { topArticles: [{ slug: 'eclipse', views: 150, sources: { facebook: 100, google: 50 } }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const previous = { topArticles: [] as any[], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const m = evaluateArticleMomentum(current, previous);
    expect(m[0].level).toBe('INFORMATIONAL');
    expect(m[0].trend).toBe('BREAKOUT_FROM_ZERO');
  });

  it('6. no se duplican slugs dentro de la misma corrida', () => {
    const current = { topArticles: [
      { slug: 'sismo', views: 250, sources: { facebook: 200 } },
      { slug: 'sismo', views: 250, sources: { facebook: 200 } },
    ], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const previous = { topArticles: [{ slug: 'sismo', views: 50, sources: {} }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const m = evaluateArticleMomentum(current, previous);
    expect(m).toHaveLength(1);
  });

  it('7. caída fuerte se marca DECLINING pero SILENT', () => {
    const current = { topArticles: [{ slug: 'economia', views: 50, sources: { direct: 50 } }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const previous = { topArticles: [{ slug: 'economia', views: 200, sources: { direct: 200 } }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const m = evaluateArticleMomentum(current, previous);
    expect(m[0].trend).toBe('DECLINING');
    expect(m[0].level).toBe('SILENT');
  });

  it('8. atribución unknown cuando no hay fuente dominante', () => {
    const current = { topArticles: [{ slug: 'sismo', views: 100, sources: { direct: 30, facebook: 35, google: 35 } }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const previous = { topArticles: [{ slug: 'sismo', views: 20, sources: {} }], dailyGrowth: {}, weeklyTrend: {}, topSources: {}, generatedAt: '' } as any;
    const m = evaluateArticleMomentum(current, previous);
    expect(m[0].attribution?.source).toBe('unknown');
    expect(m[0].attribution!.confidence).toBeLessThan(50);
  });

  it('9. alert-engine no emite la misma condición dos veces en la misma corrida', () => {
    const candidate = {
      date: '2026-08-26',
      severity: 'warning' as const,
      category: 'traffic' as const,
      message: 'BREAKOUT: sismo',
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    const result = runAlertEngine([candidate, candidate], []);
    expect(result.toEmit).toHaveLength(1);
    expect(result.suppressedDuplicates).toHaveLength(1);
  });

  it('10. fingerprint normaliza números para evitar duplicados de mismo incidente', () => {
    const a = {
      date: '2026-08-26',
      severity: 'warning' as const,
      category: 'traffic' as const,
      message: 'BREAKOUT: sismo +120 vistas',
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    const b = { ...a, message: 'BREAKOUT: sismo +250 vistas' };
    expect(buildFingerprint(a)).toBe(buildFingerprint(b));
  });
});
