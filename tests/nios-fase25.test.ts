/**
 * NIOS Intelligence Platform — FASE 2.5 Tests
 * ============================================
 * Pruebas para Content Recovery, AdSense Trust Check, Content Improvement
 * y AdSense Recovery Full Report.
 */

import { describe, it, expect } from 'vitest';
import { generateContentRecoveryReport, calculateRecoveryScore } from '@/lib/nios/intelligence/content-recovery';
import { generateAdSenseTrustCheck } from '@/lib/nios/intelligence/adsense-trust-check';
import { generateImprovementRecommendations } from '@/lib/nios/intelligence/content-improvement';
import { generateAdSenseRecoveryFullReport } from '@/lib/nios/intelligence/adsense-recovery-report';
import type { ArticleFusion, ImprovementRecommendation } from '@/lib/nios/intelligence/types';

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
  gscStatus: 'REAL',
  ga4Status: 'REAL',
  ...overrides,
});

describe('Content Recovery Analyzer', () => {
  it('should calculate recovery score between 0 and 100', () => {
    const a = mockArticle();
    const score = calculateRecoveryScore(a);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should classify healthy article as green', () => {
    const articles = [mockArticle()];
    const map = new Map([['test', { googleTrustScore: 80, risk: 'bajo' as const }]]);
    const report = generateContentRecoveryReport(articles, map);

    expect(report.totalArticles).toBe(1);
    expect(report.articles[0].status).toBe('green');
    expect(report.greenCount).toBe(1);
    expect(report.redCount).toBe(0);
    expect(report.summary).toContain('NO borrar automáticamente');
  });

  it('should classify thin content as red', () => {
    const articles = [mockArticle({
      palabras: 150,
      autor: '',
      tags: [],
      relatedLinksCount: 0,
      gscImpressions: 0,
      gscClicks: 0,
      gscCtr: 0,
      gscPosition: 0,
      ga4Users: 0,
      ga4AvgEngagementTimeSec: 0,
      scoreMeni: 50,
      fechaPublicacion: '2020-01-01T00:00:00Z',
    })];
    const map = new Map([['test', { googleTrustScore: 30, risk: 'alto' as const }]]);
    const report = generateContentRecoveryReport(articles, map);

    expect(report.articles[0].status).toBe('red');
    expect(report.redCount).toBe(1);
    expect(report.articles[0].mainProblem).toContain('Thin');
  });

  it('should return insufficient data message for empty input', () => {
    const report = generateContentRecoveryReport([], new Map());
    expect(report.summary).toBe('Datos insuficientes para evaluar.');
    expect(report.totalArticles).toBe(0);
  });
});

describe('AdSense Trust Checklist', () => {
  it('should evaluate trust check and return status', async () => {
    const articles = [mockArticle()];
    const trust = { averageGoogleTrustScore: 75, thinContentCount: 0 } as any;
    const ga4 = { totalUsers: 1000, averageEngagementTimeSec: 120, devices: [{ device: 'mobile', users: 600 }] };
    const check = await generateAdSenseTrustCheck({ articles, trust }, ga4);

    expect(check.adSenseTrustScore).toBeGreaterThanOrEqual(0);
    expect(check.adSenseTrustScore).toBeLessThanOrEqual(100);
    expect(['preparado', 'mejorar', 'no_solicitar']).toContain(check.status);
    expect(check.recommendations.length).toBeGreaterThanOrEqual(0);
    expect(check.identity.aboutComplete).toBeNull();
  });

  it('should return insufficient data when no articles', async () => {
    const check = await generateAdSenseTrustCheck({ articles: [], trust: { averageGoogleTrustScore: 0, thinContentCount: 0 } as any }, null);
    expect(check.summary).toBe('Datos insuficientes para evaluar.');
    expect(check.status).toBe('no_solicitar');
  });
});

describe('Content Improvement Engine', () => {
  it('should generate recommendation for high MENI low Google', () => {
    const articles = [mockArticle({ scoreMeni: 95, gscImpressions: 5 })];
    const recs = generateImprovementRecommendations(articles);

    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].trigger).toBe('high-meni-low-google');
    expect(recs[0].recommendedAction).toContain('Google no está encontrando');
  });

  it('should generate recommendation for short sucesos', () => {
    const articles = [mockArticle({ categoria: 'Sucesos', palabras: 300 })];
    const recs = generateImprovementRecommendations(articles);

    const found = recs.some((r: ImprovementRecommendation) => r.trigger === 'sucesos-corto');
    expect(found).toBe(true);
  });

  it('should generate recommendation for missing author', () => {
    const articles = [mockArticle({ autor: '' })];
    const recs = generateImprovementRecommendations(articles);

    const found = recs.some((r: ImprovementRecommendation) => r.trigger === 'missing-author');
    expect(found).toBe(true);
  });
});

describe('AdSense Recovery Full Report', () => {
  it('should answer all 6 questions', async () => {
    const articles = [
      mockArticle({ slug: 'good', titulo: 'Good', gscImpressions: 10000, gscClicks: 400 }),
      mockArticle({
        slug: 'bad', titulo: 'Bad', palabras: 150, autor: '', tags: [], relatedLinksCount: 0,
        gscImpressions: 0, gscClicks: 0, gscCtr: 0, scoreMeni: 50,
        ga4Users: 0, ga4AvgEngagementTimeSec: 0,
        fechaPublicacion: '2020-01-01T00:00:00Z',
      }),
      mockArticle({ slug: 'medium', titulo: 'Medium', gscImpressions: 100, gscClicks: 2 }),
    ];
    const ga4 = { totalUsers: 2000, averageEngagementTimeSec: 90, devices: [{ device: 'mobile', users: 1200 }] };
    const report = await generateAdSenseRecoveryFullReport(articles, ga4);

    expect(report.likelyRejectionReason).toBeDefined();
    expect(report.topAffectingUrls.length).toBeGreaterThan(0);
    expect(report.topPotentialUrls.length).toBeGreaterThan(0);
    expect(report.authorityCategories.length).toBeGreaterThan(0);
    expect(report.transformationCategories.length).toBeGreaterThanOrEqual(0);
    expect(['no', 'maybe', 'yes']).toContain(report.readyToReapply);
    expect(report.trustCheck.adSenseTrustScore).toBeGreaterThanOrEqual(0);
    expect(report.contentRecovery.totalArticles).toBe(3);
    expect(report.improvements.length).toBeGreaterThanOrEqual(0);
  });

  it('should return insufficient data for empty input', async () => {
    const report = await generateAdSenseRecoveryFullReport([], null);
    expect(report.summary).toBe('Datos insuficientes para evaluar.');
    expect(report.readyToReapply).toBe('no');
  });
});
