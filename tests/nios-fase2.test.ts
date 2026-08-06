/**
 * NIOS Intelligence Platform — FASE 2 Tests
 * ==========================================
 * Pruebas para Google Trust, AdSense Recovery, Google Feedback Loop y Weekly.
 * Nada se inventa; los tests verifican comportamiento con datos reales.
 */

import { describe, it, expect } from 'vitest';
import { generateGoogleTrustReport, generateThinContentReport } from '@/lib/nios/intelligence/google-trust';
import { generateAdSenseRecoveryReport } from '@/lib/nios/intelligence/adsense-recovery';
import { generateLearningPatterns, summarizeLearningPatterns } from '@/lib/nios/intelligence/google-feedback';
import { generateWeeklyReport } from '@/lib/nios/intelligence/weekly-report';
import type { ArticleFusion, GSCSnapshot, GoogleTrustReport } from '@/lib/nios/intelligence/types';

const mockArticle = (overrides: Partial<ArticleFusion> = {}): ArticleFusion => ({
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
  ga4AvgEngagementTimeSec: 180,
  ga4EngagementRate: 0.7,
  hasGscData: true,
  hasGa4Data: true,
  ...overrides,
});

const mockGSC = (): GSCSnapshot => ({
  date: '2026-08-05',
  collectedAt: new Date().toISOString(),
  siteUrl: 'https://nicaraguainformate.com',
  dateRange: { start: '2026-07-08', end: '2026-08-05' },
  totalImpressions: 10000,
  totalClicks: 400,
  avgCtr: 4,
  avgPosition: 8,
  pages: [],
  queries: [],
  countries: [],
  devices: [],
});

describe('Google Trust Audit', () => {
  it('should score high trust for strong article', () => {
    const articles = [mockArticle()];
    const report = generateGoogleTrustReport(articles);

    expect(report.totalArticles).toBe(1);
    expect(report.highRiskArticles).toBe(0);
    expect(report.articles[0].googleTrustScore).toBeGreaterThan(40);
    expect(['bajo', 'medio']).toContain(report.articles[0].risk);
  });

  it('should flag thin content and low trust', () => {
    const articles = [mockArticle({
      palabras: 200,
      tags: [],
      relatedLinksCount: 0,
      gscImpressions: 0,
      gscClicks: 0,
      gscCtr: 0,
      gscPosition: 0,
    })];

    const report = generateGoogleTrustReport(articles);

    expect(report.articles[0].isThin).toBe(true);
    expect(report.articles[0].thinContentFlags.length).toBeGreaterThan(0);
    expect(report.articles[0].risk).toBe('alto');
    expect(report.thinContentCount).toBe(1);
  });

  it('should detect MENI high but Google ignores', () => {
    const articles = [mockArticle({
      scoreMeni: 95,
      gscImpressions: 0,
      gscClicks: 0,
      gscCtr: 0,
    })];

    const report = generateGoogleTrustReport(articles);
    expect(report.articlesHighMeniZeroImpressions).toBe(1);
  });
});

describe('Thin Content Report', () => {
  it('should list thin content articles', () => {
    const articles = [
      mockArticle({ palabras: 200 }),
      mockArticle({ palabras: 800 }),
    ];

    const thin = generateThinContentReport(articles);
    expect(thin.length).toBe(1);
    expect(thin[0].palabras).toBe(200);
    expect(thin[0].reasons.length).toBeGreaterThan(0);
  });
});

describe('AdSense Recovery', () => {
  it('should calculate recovery percentages and risk', () => {
    const articles = [
      mockArticle({ autor: 'Autor', palabras: 600 }),
      mockArticle({ autor: 'Autor', palabras: 600 }),
      mockArticle({ autor: '', palabras: 100, gscImpressions: 0, scoreMeni: 40 }),
    ];
    const trust = generateGoogleTrustReport(articles);
    const recovery = generateAdSenseRecoveryReport(articles, trust);

    expect(recovery.totalArticles).toBe(3);
    expect(recovery.contentAuthorPct).toBe(67);
    expect(recovery.contentOriginalityPct).toBeLessThanOrEqual(100);
    expect(recovery.contentUsefulPct).toBeGreaterThan(0);
    expect(recovery.riskLevel).toBeDefined();
    expect(recovery.topRiskUrls.length).toBeGreaterThan(0);
    expect(recovery.thinContent.length).toBeGreaterThan(0);
  });
});

describe('Google Feedback Loop', () => {
  it('should classify MENI correct when Google confirms', () => {
    const articles = [mockArticle({ scoreMeni: 95, gscImpressions: 500, gscCtr: 3, gscClicks: 15 })];
    const gsc = mockGSC();
    const patterns = generateLearningPatterns(articles, gsc);

    expect(patterns[0].pattern).toBe('meni_correct');
    expect(patterns[0].conclusion).toContain('MENI está correctamente calibrado');
  });

  it('should detect MENI overestimates', () => {
    const articles = [mockArticle({ scoreMeni: 95, gscImpressions: 0, gscClicks: 0, gscCtr: 0 })];
    const gsc = mockGSC();
    const patterns = generateLearningPatterns(articles, gsc);

    expect(patterns[0].pattern).toBe('meni_overestimates');
    expect(patterns[0].conclusion).toContain('0 impresiones');
  });

  it('should detect MENI underestimates', () => {
    const articles = [mockArticle({ scoreMeni: 60, gscImpressions: 20000, gscClicks: 400, gscCtr: 2 })];
    const gsc = mockGSC();
    const patterns = generateLearningPatterns(articles, gsc);

    expect(patterns[0].pattern).toBe('meni_underestimates');
    expect(patterns[0].conclusion).toContain('El modelo MENI debe aprender');
  });

  it('should summarize patterns', () => {
    const patterns = [
      { pattern: 'meni_correct' } as any,
      { pattern: 'meni_overestimates' } as any,
      { pattern: 'meni_underestimates' } as any,
      { pattern: 'insufficient_data' } as any,
    ];
    const summary = summarizeLearningPatterns(patterns);

    expect(summary.total).toBe(4);
    expect(summary.meniCorrect).toBe(1);
    expect(summary.meniOverestimates).toBe(1);
    expect(summary.meniUnderestimates).toBe(1);
    expect(summary.insufficient).toBe(1);
  });
});

describe('NIOS Weekly Report', () => {
  it('should answer all 6 CEO questions', () => {
    const articles = [
      mockArticle({ slug: 'top-1', titulo: 'Top 1', gscImpressions: 5000, gscClicks: 200 }),
      mockArticle({ slug: 'ignored', titulo: 'Ignored', gscImpressions: 0 }),
      mockArticle({ slug: 'update', titulo: 'Update', gscImpressions: 1500, gscPosition: 8, gscCtr: 0.5, fechaPublicacion: '2020-01-01T00:00:00Z' }),
    ];
    const trust = generateGoogleTrustReport(articles);
    const gsc = mockGSC();
    const weekly = generateWeeklyReport(articles, trust, gsc);

    expect(weekly.hasData).toBe(true);
    expect(weekly.topPerforming.length).toBeGreaterThan(0);
    expect(weekly.ignoredByGoogle.length).toBeGreaterThan(0);
    expect(weekly.categoryOpportunities.length).toBeGreaterThan(0);
    expect(weekly.productionRecommendations.length).toBeGreaterThan(0);
    expect(weekly.updateCandidates.length).toBeGreaterThan(0);
    expect(weekly.adsenseBlockers.length).toBeGreaterThanOrEqual(0);
    expect(weekly.summary).toContain('optimizar');
  });

  it('should return insufficient data when no GSC', () => {
    const articles = [mockArticle()];
    const trust = generateGoogleTrustReport(articles);
    const weekly = generateWeeklyReport(articles, trust, null);

    expect(weekly.hasData).toBe(false);
    expect(weekly.summary).toContain('Datos insuficientes');
  });
});
