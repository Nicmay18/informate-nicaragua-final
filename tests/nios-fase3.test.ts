/**
 * NIOS Intelligence Platform — FASE 3 Tests
 * ===========================================
 * Pruebas para Content Opportunity, Category Intelligence, Content Mix,
 * Article Update, Editor CEO Report y MENI Learning.
 */

import { describe, it, expect } from 'vitest';
import { generateContentOpportunityReport } from '@/lib/nios/intelligence/opportunity-engine';
import { generateCategoryIntelligence } from '@/lib/nios/intelligence/category-intelligence';
import { generateContentMixReport } from '@/lib/nios/intelligence/content-mix-intelligence';
import { generateArticleUpdateReport } from '@/lib/nios/intelligence/update-engine';
import { generateEditorCEOReport } from '@/lib/nios/intelligence/editor-ceo-report';
import type { ArticleFusion, GSCSnapshot, GA4Snapshot, GoogleTrustReport } from '@/lib/nios/intelligence/types';

function mockArticle(overrides: Partial<ArticleFusion> = {}): ArticleFusion {
  return {
    slug: 'test',
    url: 'https://nicaraguainformate.com/noticias/test',
    titulo: 'Test Article',
    categoria: 'Nacionales',
    autor: 'Autor Test',
    fechaPublicacion: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    palabras: 800,
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

function mockGSC(overrides: Partial<GSCSnapshot> = {}): GSCSnapshot {
  return {
    date: '2026-08-05',
    status: 'REAL',
    collectedAt: new Date().toISOString(),
    siteUrl: 'https://nicaraguainformate.com',
    dateRange: { start: '2026-07-08', end: '2026-08-05' },
    totalImpressions: 50000,
    totalClicks: 2000,
    avgCtr: 4,
    avgPosition: 8,
    pages: [],
    queries: [
      { query: 'salario mínimo Nicaragua 2026', impressions: 50000, clicks: 500, ctr: 1, position: 7 },
      { query: 'noticias nicaragua', impressions: 20000, clicks: 800, ctr: 4, position: 3 },
      { query: 'turismo nicaragua', impressions: 500, clicks: 0, ctr: 0, position: 12 },
    ],
    countries: [],
    devices: [],
    ...overrides,
  };
}

function mockGA4(overrides: Partial<GA4Snapshot> = {}): GA4Snapshot {
  return {
    date: '2026-08-05',
    status: 'REAL',
    collectedAt: new Date().toISOString(),
    propertyId: 'test',
    dateRange: { start: '2026-07-08', end: '2026-08-05' },
    totalUsers: 5000,
    totalSessions: 6000,
    totalPageviews: 10000,
    averageEngagementTimeSec: 90,
    engagementRate: 0.65,
    pages: [],
    sources: [
      { source: 'Google', users: 3000, sessions: 4000, screenPageviews: 7000, engagementRate: 0.7 },
      { source: 'Facebook', users: 1500, sessions: 1800, screenPageviews: 2500, engagementRate: 0.5 },
    ],
    devices: [{ device: 'mobile', users: 3500, sessions: 4200 }],
    ...overrides,
  };
}

function mockTrust(overrides: Partial<GoogleTrustReport> = {}): GoogleTrustReport {
  return {
    generatedAt: new Date().toISOString(),
    totalArticles: 1,
    highRiskArticles: 0,
    mediumRiskArticles: 0,
    lowRiskArticles: 1,
    averageGoogleTrustScore: 75,
    thinContentCount: 0,
    duplicateRiskCount: 0,
    articlesWithoutAuthor: 0,
    articlesWithoutSources: 0,
    articlesWithLowGoogle: 0,
    articlesHighMeniZeroImpressions: 0,
    articlesLowMeniHighImpressions: 0,
    articles: [{
      slug: 'test',
      titulo: 'Test Article',
      categoria: 'Nacionales',
      autor: 'Autor Test',
      fechaPublicacion: new Date().toISOString(),
      palabras: 800,
      scoreMeni: 85,
      gscImpressions: 1000,
      gscClicks: 50,
      gscCtr: 5,
      gscPosition: 4,
      ga4AvgEngagementTimeSec: 120,
      relatedLinksCount: 3,
      hasAutor: true,
      hasFecha: true,
      hasFuente: true,
      hasContexto: true,
      isThin: false,
      isDuplicateRisk: false,
      isUpdated: false,
      googleTrustScore: 75,
      editorialAuthorityScore: 80,
      contentValueScore: 85,
      thinContentFlags: [],
      risk: 'bajo',
    }],
    topBlocked: [],
    summary: 'Test trust report',
    ...overrides,
  };
}

describe('Content Opportunity Engine (FASE 3.1)', () => {
  it('should detect low CTR high impression opportunities', () => {
    const articles = [mockArticle()];
    const gsc = mockGSC();
    const report = generateContentOpportunityReport(articles, gsc);

    expect(report.totalQueries).toBe(3);
    expect(report.opportunities.length).toBeGreaterThan(0);

    const lowCtr = report.opportunities.find(o => o.opportunityType === 'low_ctr_high_impressions');
    expect(lowCtr).toBeDefined();
    expect(lowCtr!.query).toBe('salario mínimo Nicaragua 2026');
    expect(lowCtr!.recommendation).toContain('Optimizar título');
  });

  it('should detect zero click opportunities', () => {
    const articles = [mockArticle()];
    const gsc = mockGSC();
    const report = generateContentOpportunityReport(articles, gsc);

    const zeroClick = report.opportunities.find(o => o.opportunityType === 'zero_clicks');
    expect(zeroClick).toBeDefined();
    expect(zeroClick!.query).toBe('turismo nicaragua');
  });

  it('should return insufficient data for empty input', () => {
    const report = generateContentOpportunityReport([], null);
    expect(report.summary).toContain('Datos insuficientes');
    expect(report.opportunities.length).toBe(0);
  });
});

describe('Category Intelligence (FASE 3.2)', () => {
  it('should analyze categories with real data', () => {
    const articles = [
      mockArticle({ categoria: 'Nacionales', gscImpressions: 5000, gscClicks: 150, gscCtr: 3, gscPosition: 5 }),
      mockArticle({ slug: 's1', titulo: 'S1', categoria: 'Sucesos', gscImpressions: 0, gscClicks: 0, gscCtr: 0, gscPosition: 0 }),
      mockArticle({ slug: 's2', titulo: 'S2', categoria: 'Sucesos', gscImpressions: 0, gscClicks: 0, gscCtr: 0, gscPosition: 0 }),
      mockArticle({ slug: 's3', titulo: 'S3', categoria: 'Sucesos', gscImpressions: 0, gscClicks: 0, gscCtr: 0, gscPosition: 0 }),
      mockArticle({ slug: 's4', titulo: 'S4', categoria: 'Sucesos', gscImpressions: 0, gscClicks: 0, gscCtr: 0, gscPosition: 0 }),
      mockArticle({ slug: 's5', titulo: 'S5', categoria: 'Sucesos', gscImpressions: 0, gscClicks: 0, gscCtr: 0, gscPosition: 0 }),
      mockArticle({ slug: 'tech', titulo: 'Tech', categoria: 'Tecnología', gscImpressions: 2000, gscClicks: 20, gscCtr: 1, gscPosition: 12 }),
    ];
    const gsc = mockGSC();
    const ga4 = mockGA4();
    const trust = mockTrust();
    const report = generateCategoryIntelligence(articles, gsc, ga4, trust);

    expect(report.categories.length).toBe(3);

    const nacionales = report.categories.find(c => c.categoria === 'Nacionales');
    expect(nacionales).toBeDefined();
    expect(nacionales!.opportunity).toBe('aumentar');

    const sucesos = report.categories.find(c => c.categoria === 'Sucesos');
    expect(sucesos).toBeDefined();
    expect(sucesos!.opportunity).toBe('limitar');
  });

  it('should return insufficient data for empty input', () => {
    const report = generateCategoryIntelligence([], null, null, null);
    expect(report.summary).toContain('Datos insuficientes');
  });
});

describe('Content Mix Optimizer (FASE 3.3)', () => {
  it('should recommend content based on category opportunities', () => {
    const articles = [
      mockArticle({ categoria: 'Nacionales', gscImpressions: 5000, gscClicks: 150, gscCtr: 3, gscPosition: 5 }),
    ];
    const gsc = mockGSC();
    const ga4 = mockGA4();
    const trust = mockTrust();
    const report = generateContentMixReport(articles, gsc, ga4, trust);

    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.totalArticles).toBeGreaterThan(0);
    const hasGoogleReasoning = report.recommendations.some(r => r.razon.includes('Google'));
    expect(hasGoogleReasoning).toBe(true);
  });

  it('should return insufficient data for empty input', () => {
    const report = generateContentMixReport([], null, null, null);
    expect(report.summary).toContain('Datos insuficientes');
  });
});

describe('Article Update Intelligence (FASE 3.4)', () => {
  it('should detect outdated articles with traffic', () => {
    const articles = [
      mockArticle({
        slug: 'old-popular',
        titulo: 'Old Popular',
        fechaPublicacion: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        gscImpressions: 2000,
        gscPosition: 8,
      }),
    ];
    const report = generateArticleUpdateReport(articles);

    expect(report.totalCandidates).toBeGreaterThan(0);
    const outdated = report.candidates.find(c => c.updateReason === 'outdated_content');
    expect(outdated).toBeDefined();
    expect(outdated!.recommendedAction).toContain('Actualizar');
  });

  it('should detect low CTR good position articles', () => {
    const articles = [
      mockArticle({
        slug: 'low-ctr',
        titulo: 'Low CTR',
        fechaPublicacion: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        gscImpressions: 1000,
        gscCtr: 0.5,
        gscPosition: 5,
      }),
    ];
    const report = generateArticleUpdateReport(articles);

    const lowCtr = report.candidates.find(c => c.updateReason === 'low_ctr_good_position');
    expect(lowCtr).toBeDefined();
  });

  it('should return insufficient data for empty input', () => {
    const report = generateArticleUpdateReport([]);
    expect(report.summary).toContain('Datos insuficientes');
  });
});

describe('Editor CEO Report (FASE 3.5)', () => {
  it('should answer all 6 CEO questions', () => {
    const articles = [
      mockArticle({ slug: 'good', titulo: 'Good', gscImpressions: 2000, gscCtr: 4, ga4AvgEngagementTimeSec: 120 }),
      mockArticle({ slug: 'bad', titulo: 'Bad', scoreMeni: 90, gscImpressions: 0 }),
      mockArticle({
        slug: 'old',
        titulo: 'Old',
        fechaPublicacion: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        gscImpressions: 1500,
        gscPosition: 8,
      }),
    ];
    const gsc = mockGSC();
    const ga4 = mockGA4();
    const trust = mockTrust();
    const report = generateEditorCEOReport(articles, gsc, ga4, trust, null);

    expect(report.hasData).toBe(true);
    expect(report.whatWorked.length).toBeGreaterThan(0);
    expect(report.whatFailed.length).toBeGreaterThan(0);
    expect(report.whatToRepeat.length).toBeGreaterThan(0);
    expect(report.topicOpportunities.length).toBeGreaterThan(0);
    expect(report.articlesToUpdate.length).toBeGreaterThan(0);
    expect(report.contentMix.length).toBeGreaterThan(0);
    expect(report.summary).toContain('Reporte editorial');
  });

  it('should return insufficient data for empty input', () => {
    const report = generateEditorCEOReport([], null, null, null, null);
    expect(report.hasData).toBe(false);
    expect(report.summary).toContain('Datos insuficientes');
  });
});
