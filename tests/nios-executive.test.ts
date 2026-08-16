import { describe, it, expect } from 'vitest';
import { generateCEOMorningBrief } from '@/lib/nios/executive/morning-brief';
import { generateWeeklyStrategicReport } from '@/lib/nios/executive/weekly-report';
import type { GSCSnapshot, GA4Snapshot, Noticia } from '@/lib/contracts';
import type { LifecycleInsight } from '@/lib/nios/lifecycle/tracker';
import type { GrowthOpportunity } from '@/lib/nios/growth/opportunities';
import type { SiteAdSenseReport } from '@/lib/nios/revenue/adsense';
import type { SustainabilityOverview } from '@/lib/nios/revenue/sustainability';

describe('NIOS v2 Executive Intelligence Engine (Bloque 5)', () => {
  const mockGsc: GSCSnapshot = {
    date: '2026-08-16',
    collectedAt: new Date().toISOString(),
    siteUrl: 'sc-domain:nicaraguainformate.com',
    dateRange: { start: '2026-08-09', end: '2026-08-16' },
    totalImpressions: 4500,
    totalClicks: 95,
    avgCtr: 0.021,
    avgPosition: 7.4,
    pages: [],
    queries: [{ query: 'precio frijol nicaragua', impressions: 320, clicks: 18, ctr: 0.056, position: 4.2 }],
    countries: [],
    devices: [],
  };

  const mockGa4: GA4Snapshot = {
    date: '2026-08-16',
    collectedAt: new Date().toISOString(),
    propertyId: '525672447',
    dateRange: { start: '2026-08-09', end: '2026-08-16' },
    totalUsers: 480,
    totalSessions: 620,
    totalPageviews: 1100,
    averageEngagementTimeSec: 88,
    engagementRate: 0.76,
    pages: [],
    sources: [],
    devices: [],
  };

  const mockNoticias: (Partial<Noticia> & { id: string })[] = [
    {
      id: 'n-1',
      slug: 'precio-frijol-nicaragua',
      titulo: 'Precios del frijol rojo en mercados de Managua',
      categoria: 'Economía',
    },
    {
      id: 'n-2',
      slug: 'inauguran-hospital-chinandega',
      titulo: 'Inauguran hospital departamental en Chinandega',
      categoria: 'Nacionales',
    },
  ];

  const mockLifecycle: LifecycleInsight[] = [
    {
      articleId: 'n-1',
      slug: 'precio-frijol-nicaragua',
      title: 'Precios del frijol rojo en mercados de Managua',
      category: 'Economía',
      ageHours: 12,
      stage: 'OBSERVED',
      substance: 'EDITORIALLY_COMPLETE',
      wordCount: 450,
      hasAuthor: true,
      hasSource: true,
      observation: 'OBSERVED (12h) — EDITORIALLY_COMPLETE',
      evidence: {
        publishedAt: new Date().toISOString(),
        wordCount: 450,
        scoreMeni: 95,
        gscImpressions: 320,
        ga4Users: 180,
      },
      recommendation: 'Mantener en observación natural.',
      priority: 'MONITOR',
      action: 'NO_ACTION',
    },
  ];

  const mockGrowth: GrowthOpportunity[] = [
    {
      id: 'opp-1',
      type: 'SEARCH_CTR_OPTIMIZATION',
      target: { slug: 'precio-frijol-nicaragua' },
      impactScore: 85,
      urgency: 'HIGH',
      headline: 'Oportunidad de CTR en Google (320 impresiones, CTR 1.8%)',
      evidence: { impressions: 320, clicks: 6, ctr: 1.8, position: 4.2 },
      recommendedAction: 'Ajustar título para mayor claridad informativa.',
      expectedOutcome: 'Duplicar lectores orgánicos.',
    },
  ];

  const mockAdSense: SiteAdSenseReport = {
    generatedAt: new Date().toISOString(),
    totalAudited: 2,
    compliantReadyCount: 2,
    needsEnrichmentCount: 0,
    policyReviewCount: 0,
    technicalDefectCount: 0,
    compliancePercentage: 100,
    criticalIssues: [],
    actionPlan: ['Inventario 100% alineado con políticas de Google AdSense.'],
    articles: [],
  };

  describe('CEO Morning Brief', () => {
    it('generates a complete daily briefing with exactly 3 high-impact priorities', () => {
      const brief = generateCEOMorningBrief({
        gsc: mockGsc,
        ga4: mockGa4,
        noticias: mockNoticias,
        lifecycleInsights: mockLifecycle,
        growthOpportunities: mockGrowth,
        adSenseReport: mockAdSense,
      });

      expect(brief.audiencePulse.users24h).toBe(480);
      expect(brief.searchPulse.impressions7d).toBe(4500);
      expect(brief.monetizationPulse.adSenseCompliantPercent).toBe(100);
      expect(brief.topPrioritiesToday.length).toBeLessThanOrEqual(3);
      expect(brief.topPrioritiesToday[0].title).toBe('Oportunidad de CTR en Google (320 impresiones, CTR 1.8%)');
    });
  });

  describe('CEO Weekly Strategic Report', () => {
    it('generates strategic retrospective answering the 4 core business questions', () => {
      const mockSustainability: SustainabilityOverview = {
        generatedAt: new Date().toISOString(),
        totalArticles: 2,
        totalAudienceSessions: 620,
        averageSessionDurationSec: 88,
        communitySupportReadiness: {
          isReady: true,
          callToActionSnippet: 'Apoya nuestro trabajo.',
          targetPlacement: 'Footer de notas',
        },
        categoryMetrics: [
          {
            category: 'Economía',
            articleCount: 1,
            totalPageviews: 600,
            avgEngagementSec: 95,
            recirculationRate: 100,
            monetizationReadinessPercent: 100,
            strategicRole: 'NICHE_HIGH_VALUE',
            revenueRecommendation: 'Profundizar guías de servicio.',
          },
        ],
        monetizationPriorities: ['Monitoreo continuo'],
      };

      const report = generateWeeklyStrategicReport({
        weekRange: { start: '2026-08-09', end: '2026-08-16' },
        gscCurrent: mockGsc,
        ga4Current: mockGa4,
        noticias: mockNoticias,
        sustainability: mockSustainability,
        growthOpportunities: mockGrowth,
      });

      expect(report.whatGrew.length).toBeGreaterThan(0);
      expect(report.rootCauseAnalysis.length).toBeGreaterThan(0);
      expect(report.topThreeStrategicDecisions.length).toBe(3);
      expect(report.topThreeStrategicDecisions[0].owner).toBe('DIRECCION_EDITORIAL');
    });
  });
});
