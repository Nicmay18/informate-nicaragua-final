/**
 * NIOS Intelligence Platform — Tests
 * ===================================
 * Tests para verificar que el sistema funciona correctamente.
 * Verifica que las reglas generan recomendaciones correctas.
 * Verifica que no se inventan datos.
 */

import { describe, it, expect } from 'vitest';
import { mergeArticleData } from '@/lib/nios/intelligence/data-merger';
import { generateRecommendations } from '@/lib/nios/intelligence/editorial-rules';
import { generateComplianceReport } from '@/lib/nios/intelligence/compliance';
import { generateReadinessReport } from '@/lib/nios/intelligence/readiness';
import { buildGoogleIntelligenceDashboard } from '@/lib/nios/intelligence/dashboard';
import { generateGoogleTrustReport } from '@/lib/nios/intelligence/google-trust';
import { generateContentRecoveryReport } from '@/lib/nios/intelligence/content-recovery';
import type { ArticleFusion, GSCSnapshot, GA4Snapshot, GoogleTrustArticle } from '@/lib/nios/intelligence/types';
import type { Noticia } from '@/lib/types';

// ─── Fixtures ──────────────────────────────────────────────────

const mockNoticia = (overrides: Partial<Noticia> = {}): Noticia => ({
  id: 'test-1',
  slug: 'test-article',
  titulo: 'Test Article',
  resumen: 'Test resumen',
  contenido: 'Test contenido',
  categoria: 'Política',
  imagen: '',
  fecha: new Date().toISOString(),
  autor: 'Test Author',
  palabras: 500,
  scoreCalidad: 85,
  tags: ['tag1', 'tag2'],
  related_links: [],
  estado: 'publicado',
  ...overrides,
});

const mockGSC = (): GSCSnapshot => ({
  date: '2026-08-05',
  collectedAt: new Date().toISOString(),
  status: 'REAL',
  siteUrl: 'https://nicaraguainformate.com',
  dateRange: { start: '2026-07-08', end: '2026-08-05' },
  totalImpressions: 50000,
  totalClicks: 2000,
  avgCtr: 4.0,
  avgPosition: 8.5,
  pages: [
    { url: 'https://nicaraguainformate.com/noticias/test-article', impressions: 5000, clicks: 200, ctr: 4.0, position: 5.0 },
    { url: 'https://nicaraguainformate.com/noticias/high-ctr-low-pos', impressions: 500, clicks: 50, ctr: 10.0, position: 15.0 },
    { url: 'https://nicaraguainformate.com/noticias/low-ctr-high-pos', impressions: 2000, clicks: 10, ctr: 0.5, position: 3.0 },
    { url: 'https://nicaraguainformate.com/noticias/many-imp-few-clicks', impressions: 5000, clicks: 5, ctr: 0.1, position: 12.0 },
  ],
  queries: [
    { query: 'nicaragua noticias', impressions: 10000, clicks: 500, ctr: 5.0, position: 3.0 },
  ],
  countries: [{ country: 'ni', impressions: 30000, clicks: 1500, ctr: 5.0, position: 7.0 }],
  devices: [
    { device: 'mobile', impressions: 35000, clicks: 1400, ctr: 4.0, position: 8.0 },
    { device: 'desktop', impressions: 15000, clicks: 600, ctr: 4.0, position: 9.0 },
  ],
});

const mockGA4 = (): GA4Snapshot => ({
  date: '2026-08-05',
  collectedAt: new Date().toISOString(),
  status: 'REAL',
  propertyId: '123456',
  dateRange: { start: '2026-07-08', end: '2026-08-05' },
  totalUsers: 15000,
  totalSessions: 20000,
  totalPageviews: 50000,
  averageEngagementTimeSec: 120,
  engagementRate: 0.55,
  pages: [
    { pagePath: '/noticias/test-article', screenPageviews: 5000, users: 3000, sessions: 4000, averageEngagementTimeSec: 180, engagementRate: 0.7 },
    { pagePath: '/noticias/high-engagement-low-imp', screenPageviews: 200, users: 150, sessions: 180, averageEngagementTimeSec: 300, engagementRate: 0.9 },
  ],
  sources: [
    { source: 'Facebook', users: 8000, sessions: 10000, screenPageviews: 25000, engagementRate: 0.5 },
    { source: 'Google', users: 5000, sessions: 7000, screenPageviews: 15000, engagementRate: 0.6 },
  ],
  devices: [
    { device: 'mobile', users: 10000, sessions: 14000 },
    { device: 'desktop', users: 5000, sessions: 6000 },
  ],
});

// ─── Tests: Data Merger ───────────────────────────────────────

describe('Data Merger', () => {
  it('should merge Firestore, GSC and GA4 data correctly', () => {
    const noticias = [
      mockNoticia({ slug: 'test-article', titulo: 'Test Article' }),
      mockNoticia({ slug: 'no-google-data', titulo: 'No Google Data' }),
    ];

    const gsc = mockGSC();
    const ga4 = mockGA4();

    const result = mergeArticleData(noticias, gsc, ga4);

    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe('test-article');
    expect(result[0].hasGscData).toBe(true);
    expect(result[0].gscImpressions).toBe(5000);
    expect(result[0].hasGa4Data).toBe(true);
    expect(result[0].ga4Users).toBe(3000);
    expect(result[1].slug).toBe('no-google-data');
    expect(result[1].hasGscData).toBe(false);
    expect(result[1].gscImpressions).toBe(0);
  });

  it('should handle null GSC and GA4', () => {
    const noticias = [mockNoticia()];
    const result = mergeArticleData(noticias, null, null);

    expect(result).toHaveLength(1);
    expect(result[0].hasGscData).toBe(false);
    expect(result[0].hasGa4Data).toBe(false);
    expect(result[0].gscImpressions).toBe(0);
    expect(result[0].ga4Users).toBe(0);
  });
});

// ─── Tests: Editorial Rules ───────────────────────────────────

describe('Editorial Rules', () => {
  it('should recommend improving title when CTR high + position low', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'high-ctr-low-pos',
        url: 'https://nicaraguainformate.com/noticias/high-ctr-low-pos',
        titulo: 'High CTR Low Position',
        categoria: 'Política',
        autor: 'Test',
        fechaPublicacion: new Date().toISOString(),
        palabras: 500,
        scoreMeni: 85,
        tags: [],
        relatedLinksCount: 0,
        gscImpressions: 500,
        gscClicks: 50,
        gscCtr: 10.0,
        gscPosition: 15.0,
        gscTopQueries: [],
        ga4Users: 0,
        ga4Sessions: 0,
        ga4Pageviews: 0,
        ga4AvgEngagementTimeSec: 0,
        ga4EngagementRate: 0,
        hasGscData: true,
        hasGa4Data: false,
      },
    ];

    const gsc = mockGSC();
    const recs = generateRecommendations(articles, gsc, null, 28);

    const titleRec = recs.find(r => r.type === 'title');
    expect(titleRec).toBeDefined();
    expect(titleRec!.severity).toBe('info');
    expect(titleRec!.evidence).toHaveLength(3);
    expect(titleRec!.evidence[0].source).toBe('Google Search Console');
  });

  it('should recommend reviewing meta when position high + CTR low', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'low-ctr-high-pos',
        url: 'https://nicaraguainformate.com/noticias/low-ctr-high-pos',
        titulo: 'Low CTR High Position',
        categoria: 'Política',
        autor: 'Test',
        fechaPublicacion: new Date().toISOString(),
        palabras: 500,
        scoreMeni: 85,
        tags: [],
        relatedLinksCount: 0,
        gscImpressions: 2000,
        gscClicks: 10,
        gscCtr: 0.5,
        gscPosition: 3.0,
        gscTopQueries: [],
        ga4Users: 0,
        ga4Sessions: 0,
        ga4Pageviews: 0,
        ga4AvgEngagementTimeSec: 0,
        ga4EngagementRate: 0,
        hasGscData: true,
        hasGa4Data: false,
      },
    ];

    const gsc = mockGSC();
    const recs = generateRecommendations(articles, gsc, null, 28);

    const metaRec = recs.find(r => r.type === 'meta');
    expect(metaRec).toBeDefined();
    expect(metaRec!.severity).toBe('warning');
  });

  it('should recommend reviewing snippet when many impressions few clicks', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'many-imp-few-clicks',
        url: 'https://nicaraguainformate.com/noticias/many-imp-few-clicks',
        titulo: 'Many Impressions Few Clicks',
        categoria: 'Política',
        autor: 'Test',
        fechaPublicacion: new Date().toISOString(),
        palabras: 500,
        scoreMeni: 85,
        tags: [],
        relatedLinksCount: 0,
        gscImpressions: 5000,
        gscClicks: 5,
        gscCtr: 0.1,
        gscPosition: 12.0,
        gscTopQueries: [],
        ga4Users: 0,
        ga4Sessions: 0,
        ga4Pageviews: 0,
        ga4AvgEngagementTimeSec: 0,
        ga4EngagementRate: 0,
        hasGscData: true,
        hasGa4Data: false,
      },
    ];

    const gsc = mockGSC();
    const recs = generateRecommendations(articles, gsc, null, 28);

    const snippetRec = recs.find(r => r.type === 'snippet');
    expect(snippetRec).toBeDefined();
    expect(snippetRec!.severity).toBe('warning');
  });

  it('should flag URLs with zero impressions and high MENI', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'ignored-by-google',
        url: 'https://nicaraguainformate.com/noticias/ignored-by-google',
        titulo: 'Ignored By Google',
        categoria: 'Política',
        autor: 'Test',
        fechaPublicacion: new Date().toISOString(),
        palabras: 500,
        scoreMeni: 95,
        tags: [],
        relatedLinksCount: 0,
        gscImpressions: 0,
        gscClicks: 0,
        gscCtr: 0,
        gscPosition: 0,
        gscTopQueries: [],
        ga4Users: 0,
        ga4Sessions: 0,
        ga4Pageviews: 0,
        ga4AvgEngagementTimeSec: 0,
        ga4EngagementRate: 0,
        hasGscData: false,
        hasGa4Data: false,
      },
    ];

    const gsc = mockGSC();
    const recs = generateRecommendations(articles, gsc, null, 28);

    const seoRec = recs.find(r => r.type === 'seo' && r.severity === 'warning');
    expect(seoRec).toBeDefined();
    expect(seoRec!.description).toContain('Google Search Console');
    expect(seoRec!.description).toContain('no registra impresiones');
    expect(seoRec!.description).toContain('MENI score: 95');
  });

  it('should not generate recommendations when no data', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'no-data',
        url: 'https://nicaraguainformate.com/noticias/no-data',
        titulo: 'No Data',
        categoria: 'Política',
        autor: 'Test',
        fechaPublicacion: new Date().toISOString(),
        palabras: 500,
        scoreMeni: 0,
        tags: [],
        relatedLinksCount: 0,
        gscImpressions: 0,
        gscClicks: 0,
        gscCtr: 0,
        gscPosition: 0,
        gscTopQueries: [],
        ga4Users: 0,
        ga4Sessions: 0,
        ga4Pageviews: 0,
        ga4AvgEngagementTimeSec: 0,
        ga4EngagementRate: 0,
        hasGscData: false,
        hasGa4Data: false,
      },
    ];

    const recs = generateRecommendations(articles, null, null, 28);
    expect(recs).toHaveLength(0);
  });
});

// ─── Tests: Compliance Intelligence ───────────────────────────

describe('Compliance Intelligence', () => {
  it('should detect MENI overestimates when Google ignores', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'meni-high-google-ignores',
        url: 'https://nicaraguainformate.com/noticias/meni-high-google-ignores',
        titulo: 'MENI High Google Ignores',
        categoria: 'Política',
        autor: 'Test',
        fechaPublicacion: new Date().toISOString(),
        palabras: 500,
        scoreMeni: 95,
        tags: [],
        relatedLinksCount: 0,
        gscImpressions: 0,
        gscClicks: 0,
        gscCtr: 0,
        gscPosition: 0,
        gscTopQueries: [],
        ga4Users: 0,
        ga4Sessions: 0,
        ga4Pageviews: 0,
        ga4AvgEngagementTimeSec: 0,
        ga4EngagementRate: 0,
        hasGscData: true,
        hasGa4Data: false,
        gscStatus: 'REAL',
        ga4Status: 'NO_DATA',
      },
    ];

    const gsc = mockGSC();
    const report = generateComplianceReport(articles, gsc, 1);

    expect(report.totalArticles).toBe(1);
    expect(report.articlesGoogleIgnores).toBe(1);
    expect(report.meniOverestimates).toBe(1);
    expect(report.verdicts[0].googleVerdict).toBe('low_gsc_visibility');
    expect(report.verdicts[0].meniVsGoogleGap).toBe('meni_gsc_gap_hypothesis');
    expect(report.verdicts[0].explanation).toContain('MENI otorga 95');
    expect(report.verdicts[0].explanation).toContain('0 impresiones');
  });

  it('should detect MENI underestimates when Google values', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'meni-low-google-values',
        url: 'https://nicaraguainformate.com/noticias/meni-low-google-values',
        titulo: 'MENI Low Google Values',
        categoria: 'Política',
        autor: 'Test',
        fechaPublicacion: new Date().toISOString(),
        palabras: 500,
        scoreMeni: 70,
        tags: [],
        relatedLinksCount: 0,
        gscImpressions: 5000,
        gscClicks: 200,
        gscCtr: 4.0,
        gscPosition: 5.0,
        gscTopQueries: [],
        ga4Users: 0,
        ga4Sessions: 0,
        ga4Pageviews: 0,
        ga4AvgEngagementTimeSec: 0,
        ga4EngagementRate: 0,
        hasGscData: true,
        hasGa4Data: false,
      },
    ];

    const gsc = mockGSC();
    const report = generateComplianceReport(articles, gsc, 1);

    expect(report.articlesGoogleValues).toBe(1);
    expect(report.meniUnderestimates).toBe(1);
    expect(report.verdicts[0].googleVerdict).toBe('google_values');
    expect(report.verdicts[0].meniVsGoogleGap).toBe('meni_underestimates');
  });

  it('should return insufficient data message when no GSC', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'test',
        url: 'test',
        titulo: 'Test',
        categoria: 'Test',
        autor: 'Test',
        fechaPublicacion: new Date().toISOString(),
        palabras: 500,
        scoreMeni: 85,
        tags: [],
        relatedLinksCount: 0,
        gscImpressions: 0,
        gscClicks: 0,
        gscCtr: 0,
        gscPosition: 0,
        gscTopQueries: [],
        ga4Users: 0,
        ga4Sessions: 0,
        ga4Pageviews: 0,
        ga4AvgEngagementTimeSec: 0,
        ga4EngagementRate: 0,
        hasGscData: false,
        hasGa4Data: false,
      },
    ];

    const report = generateComplianceReport(articles, null, 1);
    expect(report.summary).toBe('No hay datos suficientes para emitir una recomendación.');
  });
});

// ─── Tests: AdSense Readiness ─────────────────────────────────

describe('AdSense Readiness', () => {
  it('should calculate readiness score correctly', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'high-quality',
        url: 'test',
        titulo: 'High Quality',
        categoria: 'Política',
        autor: 'Test',
        fechaPublicacion: new Date().toISOString(),
        palabras: 600,
        scoreMeni: 92,
        tags: ['tag1', 'tag2', 'tag3'],
        relatedLinksCount: 5,
        gscImpressions: 500,
        gscClicks: 20,
        gscCtr: 4.0,
        gscPosition: 5.0,
        gscTopQueries: [],
        ga4Users: 100,
        ga4Sessions: 120,
        ga4Pageviews: 200,
        ga4AvgEngagementTimeSec: 180,
        ga4EngagementRate: 0.7,
        hasGscData: true,
        hasGa4Data: true,
      },
    ];

    const report = generateReadinessReport(articles);

    expect(report.totalArticles).toBe(1);
    expect(report.articles[0].readinessScore).toBeGreaterThanOrEqual(80);
    expect(report.articles[0].issues).toHaveLength(0);
  });

  it('should flag low quality articles', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'low-quality',
        url: 'test',
        titulo: 'Low Quality',
        categoria: 'Política',
        autor: 'Test',
        fechaPublicacion: '2020-01-01T00:00:00Z',
        palabras: 100,
        scoreMeni: 50,
        tags: [],
        relatedLinksCount: 0,
        gscImpressions: 0,
        gscClicks: 0,
        gscCtr: 0,
        gscPosition: 0,
        gscTopQueries: [],
        ga4Users: 0,
        ga4Sessions: 0,
        ga4Pageviews: 0,
        ga4AvgEngagementTimeSec: 0,
        ga4EngagementRate: 0,
        hasGscData: false,
        hasGa4Data: false,
      },
    ];

    const report = generateReadinessReport(articles);

    expect(report.articles[0].readinessScore).toBeLessThan(50);
    expect(report.articles[0].issues.length).toBeGreaterThan(5);
    expect(report.criticalArticles).toBe(1);
  });
});

// ─── Tests: Dashboard Builder ─────────────────────────────────

describe('Dashboard Builder', () => {
  it('should build dashboard with correct totals', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'top-article',
        url: 'https://nicaraguainformate.com/noticias/top-article',
        titulo: 'Top Article',
        categoria: 'Política',
        autor: 'Test',
        fechaPublicacion: new Date().toISOString(),
        palabras: 500,
        scoreMeni: 90,
        tags: [],
        relatedLinksCount: 0,
        gscImpressions: 10000,
        gscClicks: 500,
        gscCtr: 5.0,
        gscPosition: 3.0,
        gscTopQueries: [],
        ga4Users: 5000,
        ga4Sessions: 6000,
        ga4Pageviews: 10000,
        ga4AvgEngagementTimeSec: 120,
        ga4EngagementRate: 0.6,
        hasGscData: true,
        hasGa4Data: true,
      },
    ];

    const gsc = mockGSC();
    const ga4 = mockGA4();

    const dashboard = buildGoogleIntelligenceDashboard(articles, gsc, ga4, []);

    expect(dashboard.hasData).toBe(true);
    expect(dashboard.totalImpressions).toBe(50000);
    expect(dashboard.topImpressions).toHaveLength(1);
    expect(dashboard.topImpressions[0].slug).toBe('top-article');
  });

  it('should return empty dashboard when no GSC data', () => {
    const dashboard = buildGoogleIntelligenceDashboard([], null, null, []);

    expect(dashboard.hasData).toBe(false);
    expect(dashboard.topImpressions).toHaveLength(0);
  });
});

// ─── Tests: Misión 14 — Forensic Repair ───────────────────────

describe('Misión 14 — Source Status & Forensic Coherence', () => {
  it('distinguishes GSC CONFIG_REQUIRED and preserves GA4 REAL totals', () => {
    const gsc: GSCSnapshot = {
      ...mockGSC(),
      status: 'CONFIG_REQUIRED',
      totalImpressions: 0,
      totalClicks: 0,
      errorMessage: 'GSC not configured',
    };
    const ga4 = mockGA4();
    const dashboard = buildGoogleIntelligenceDashboard([], gsc, ga4, []);

    expect(dashboard.hasData).toBe(false);
    expect(dashboard.gscStatus).toBe('CONFIG_REQUIRED');
    expect(dashboard.totalUsers).toBe(ga4.totalUsers);
    expect(dashboard.totalSessions).toBe(ga4.totalSessions);
  });

  it('sets GA4 totals to null when GA4 is CONFIG_REQUIRED', () => {
    const gsc = mockGSC();
    const ga4: GA4Snapshot = {
      ...mockGA4(),
      status: 'CONFIG_REQUIRED',
      errorMessage: 'GA4 property missing',
    };
    const dashboard = buildGoogleIntelligenceDashboard([], gsc, ga4, []);

    expect(dashboard.gscStatus).toBe('REAL');
    expect(dashboard.ga4Status).toBe('CONFIG_REQUIRED');
    expect(dashboard.hasData).toBe(true);
    expect(dashboard.totalUsers).toBeNull();
    expect(dashboard.totalSessions).toBeNull();
  });

  it('data-merger marks matched, no_traffic and no_data correctly', () => {
    const noticias = [
      mockNoticia({ slug: 'test-article' }),
      mockNoticia({ slug: 'sin-trafico' }),
    ];
    const gsc = mockGSC();
    const ga4 = null;
    const result = mergeArticleData(noticias, gsc, ga4);

    const matched = result.find((a: ArticleFusion) => a.slug === 'test-article');
    const noTraffic = result.find((a: ArticleFusion) => a.slug === 'sin-trafico');

    expect(matched?.gscMatchStatus).toBe('matched');
    expect(noTraffic?.gscMatchStatus).toBe('no_traffic');

    const noGsc = mergeArticleData(noticias, null, null);
    expect(noGsc[0].gscMatchStatus).toBe('no_data');
  });

  it('does not mark a healthy article as RED only because GSC/GA4 are not REAL', () => {
    const articles: ArticleFusion[] = [
      {
        slug: 'saludable-sin-google',
        url: 'https://nicaraguainformate.com/noticias/saludable-sin-google',
        titulo: 'Saludable sin Google',
        categoria: 'Nacionales',
        autor: 'Test Author',
        fechaPublicacion: new Date().toISOString(),
        palabras: 600,
        scoreMeni: 85,
        tags: ['a', 'b'],
        relatedLinksCount: 2,
        gscImpressions: 0,
        gscClicks: 0,
        gscCtr: 0,
        gscPosition: 0,
        gscTopQueries: [],
        ga4Users: 0,
        ga4Sessions: 0,
        ga4Pageviews: 0,
        ga4AvgEngagementTimeSec: 0,
        ga4EngagementRate: 0,
        hasGscData: false,
        hasGa4Data: false,
        gscStatus: 'NO_DATA',
        ga4Status: 'NO_DATA',
      },
    ];

    const trust = generateGoogleTrustReport(articles);
    const trustMap = new Map(
      trust.articles.map((a: GoogleTrustArticle) => [a.slug, { googleTrustScore: a.googleTrustScore, risk: a.risk }]),
    );
    const recovery = generateContentRecoveryReport(articles, trustMap);

    expect(recovery.articles[0].status).not.toBe('red');
    expect(recovery.articles[0].mainProblem).not.toBe('Contenido saludable');
    expect(recovery.articles[0].mainProblem).toBe('Datos insuficientes');
  });
});
