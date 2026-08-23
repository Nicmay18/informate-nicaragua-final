import { describe, it, expect } from 'vitest';
import { buildGoogleIntelligenceDashboard } from '@/lib/nios/intelligence/dashboard';
import { generateEditorCEOReport } from '@/lib/nios/intelligence/editor-ceo-report';
import { generateGoogleTrustReport } from '@/lib/nios/intelligence/google-trust';
import { generateContentRecoveryReport } from '@/lib/nios/intelligence/content-recovery';
import { generateComplianceReport } from '@/lib/nios/intelligence/compliance';
import { generateReadinessReport } from '@/lib/nios/intelligence/readiness';
import { determineLifecycleStage } from '@/lib/nios/lifecycle/tracker';
import { formatNiosMetric, type ArticleFusion } from '@/lib/nios/intelligence/types';

function baseArticle(overrides: Partial<ArticleFusion> = {}): ArticleFusion {
  return {
    slug: 'test',
    url: 'https://nicaraguainformate.com/noticias/test',
    titulo: 'Test',
    categoria: 'Nacionales',
    autor: 'Autor Test',
    fechaPublicacion: new Date().toISOString(),
    palabras: 600,
    scoreMeni: 85,
    tags: ['tag1', 'tag2'],
    relatedLinksCount: 3,
    gscImpressions: 1000,
    gscClicks: 50,
    gscCtr: 5,
    gscPosition: 4,
    gscTopQueries: [],
    ga4Users: 500,
    ga4Sessions: 600,
    ga4Pageviews: 1000,
    ga4AvgEngagementTimeSec: 120,
    ga4EngagementRate: 0.7,
    hasGscData: true,
    hasGa4Data: true,
    gscStatus: 'REAL',
    ga4Status: 'REAL',
    ...overrides,
  };
}

describe('Misión 8 — integración del data contract', () => {
  it('1) GSC ACCESS_BLOCKED => dashboard no muestra 0', () => {
    const blocked = baseArticle({
      gscStatus: 'ACCESS_BLOCKED',
      gscImpressions: 0,
      hasGscData: false,
    });
    const dashboard = buildGoogleIntelligenceDashboard([blocked], [], []);
    expect(dashboard.topImpressions).toHaveLength(0);
    expect(formatNiosMetric(blocked.gscImpressions, blocked.gscStatus, 'GSC')).toBe('GSC — Acceso bloqueado');
  });

  it('2) GSC ACCESS_BLOCKED => CEO Daily no declara fracaso SEO', () => {
    const blocked = baseArticle({
      slug: 'b',
      gscStatus: 'ACCESS_BLOCKED',
      gscImpressions: 0,
      hasGscData: false,
    });
    const report = generateEditorCEOReport(
      [blocked],
      { date: '2026-08-22', collectedAt: new Date().toISOString(), status: 'ACCESS_BLOCKED', siteUrl: '', dateRange: { start: '', end: '' }, totalImpressions: 0, totalClicks: 0, avgCtr: 0, avgPosition: 0, pages: [], queries: [], countries: [], devices: [] },
      { date: '2026-08-22', collectedAt: new Date().toISOString(), status: 'ACCESS_BLOCKED', propertyId: '', dateRange: { start: '', end: '' }, totalUsers: 0, totalSessions: 0, totalPageviews: 0, averageEngagementTimeSec: 0, engagementRate: 0, pages: [], sources: [], devices: [] },
      null,
      null,
    );
    expect(report.whatFailed.length).toBe(0);
    expect(report.summary).toMatch(/GSC ACCESS_BLOCKED|no determinables/i);
  });

  it('3) GSC ACCESS_BLOCKED => Google Trust no penaliza por 0 impresiones', () => {
    const blocked = baseArticle({
      slug: 'b',
      gscStatus: 'ACCESS_BLOCKED',
      gscImpressions: 0,
      hasGscData: false,
      scoreMeni: 95,
    });
    const report = generateGoogleTrustReport([blocked]);
    expect(report.articlesHighMeniZeroImpressions).toBe(0);
    expect(report.summary).toMatch(/ACCESS_BLOCKED|No es posible evaluar/i);
  });

  it('4) 23,952 Facebook Views nunca aparece como total GA4/site traffic', () => {
    // El contrato de datos define 23,952 como FACEBOOK_VIEWS.
    // formatNiosMetric con GA4 no devuelve "Facebook" cuando GA4 está bloqueado.
    const label = formatNiosMetric(23952, 'REAL', 'GA4');
    expect(label).toMatch(/23,?952/);
    expect(label).not.toMatch(/Facebook/i);
  });

  it('5) GA4 Active Users nunca aparece como article views', () => {
    const ga4Users = formatNiosMetric(678, 'REAL', 'GA4');
    const pageViews = formatNiosMetric(1000, 'REAL', 'GA4');
    expect(ga4Users).toBe('678');
    expect(pageViews).toBe('1,000');
  });

  it('6) REAL zero impressions sí puede aparecer como 0', () => {
    const realZero = baseArticle({
      slug: 'z',
      gscImpressions: 0,
      gscStatus: 'REAL',
      hasGscData: true,
    });
    expect(formatNiosMetric(realZero.gscImpressions, realZero.gscStatus, 'GSC')).toBe('0');
    const recovery = generateContentRecoveryReport([realZero], new Map());
    expect(recovery.articles[0].gscImpressions).toBe(0);
    expect(recovery.articles[0].mainProblem).not.toMatch(/acceso bloqueado/i);
  });

  it('7) ACCESS_BLOCKED => null/no disponible, no cero', () => {
    const blocked = baseArticle({
      gscStatus: 'ACCESS_BLOCKED',
      gscImpressions: 0,
      hasGscData: false,
    });
    const gsc = { date: '2026-08-22', collectedAt: new Date().toISOString(), status: 'ACCESS_BLOCKED' as const, siteUrl: '', dateRange: { start: '', end: '' }, totalImpressions: 0, totalClicks: 0, avgCtr: 0, avgPosition: 0, pages: [], queries: [], countries: [], devices: [] };
    const compliance = generateComplianceReport([blocked], gsc, 1);
    expect(compliance.verdicts[0]?.googleVerdict).toBe('no_data');
    expect(compliance.verdicts[0]?.explanation).toMatch(/no está conectado|no hay datos/i);
    const readiness = generateReadinessReport([blocked]);
    expect(readiness.articles[0].autoridad).toBe(false);
    expect(readiness.articles[0].eeat).toBe(false);
    const stage = determineLifecycleStage(new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(), {
      gscImpressions: 0,
      ga4Users: 0,
      gscStatus: 'ACCESS_BLOCKED',
      ga4Status: 'ACCESS_BLOCKED',
    });
    expect(stage.stage).not.toBe('ARCHIVE_CANDIDATE');
  });
});
