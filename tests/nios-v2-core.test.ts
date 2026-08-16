import { describe, it, expect } from 'vitest';
import {
  evaluateContentSubstance,
  determineLifecycleStage,
  generateLifecycleInsight,
} from '@/lib/nios/lifecycle/tracker';
import { detectGrowthOpportunities } from '@/lib/nios/growth/opportunities';
import type { GSCSnapshot, GA4Snapshot, Noticia } from '@/lib/contracts';

describe('NIOS v2 Core — Content Lifecycle & Growth (Bloque 3)', () => {
  describe('Content Substance Evaluator (Anti-False-Thin)', () => {
    it('does NOT mark a 350-word complete article as thin content', () => {
      const article: Partial<Noticia> = {
        titulo: 'Horarios de transporte Managua-Masaya',
        contenido: '<p>' + 'Transporte interurbano opera con normalidad desde las 5am hasta las 9pm. '.repeat(25) + '</p>',
        fuente: 'Cooperativa de Transporte',
      };
      const res = evaluateContentSubstance(article);
      expect(res.classification).toBe('SHORT_USEFUL');
      expect(res.wordCount).toBeGreaterThanOrEqual(250);
      expect(res.wordCount).toBeLessThan(450);
    });

    it('identifies comprehensive articles as EDITORIALLY_COMPLETE', () => {
      const article: Partial<Noticia> = {
        titulo: 'Análisis económico del café en Nicaragua',
        contenido: '<p>' + 'El sector cafetalero registró exportaciones récord este ciclo. '.repeat(60) + '</p>',
        fuente: 'MAG',
      };
      const res = evaluateContentSubstance(article);
      expect(res.classification).toBe('EDITORIALLY_COMPLETE');
      expect(res.wordCount).toBeGreaterThanOrEqual(450);
    });

    it('marks articles under 150 words without sources as THIN_CONFIRMED', () => {
      const article: Partial<Noticia> = {
        titulo: 'Nota vacía',
        contenido: '<p>Hubo un choque en la carretera.</p>',
      };
      const res = evaluateContentSubstance(article);
      expect(res.classification).toBe('THIN_CONFIRMED');
    });
  });

  describe('Lifecycle Tracker', () => {
    it('determines OBSERVED for fresh articles (<24h)', () => {
      const now = new Date();
      const twelveHoursAgo = new Date(now.getTime() - 12 * 3600 * 1000).toISOString();
      const { stage, ageHours } = determineLifecycleStage(twelveHoursAgo);
      expect(stage).toBe('OBSERVED');
      expect(ageHours).toBeCloseTo(12, 0);
    });

    it('flags UPDATE_REQUIRED when update signal is present', () => {
      const pubDate = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const { stage } = determineLifecycleStage(pubDate, { hasUpdateSignal: true });
      expect(stage).toBe('UPDATE_REQUIRED');
    });

    it('generates structured insight without semaphores', () => {
      const article: Partial<Noticia> & { id: string } = {
        id: 'art-123',
        slug: 'inauguracion-puente',
        titulo: 'Inauguran puente en el Caribe',
        categoria: 'Nacionales',
        fecha: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
        contenido: '<p>' + 'El MTI inauguró el nuevo puente facilitando el paso vehicular. '.repeat(35) + '</p>',
        fuente: 'MTI',
        autor: 'Redacción',
      };
      const insight = generateLifecycleInsight(article, { gscImpressions: 400, ga4Users: 150 });
      expect(insight.stage).toBe('LEARNING');
      expect(insight.substance).toBe('SHORT_USEFUL');
      expect(insight.hasAuthor).toBe(true);
      expect(insight.hasSource).toBe(true);
      expect(insight.evidence.gscImpressions).toBe(400);
      expect(insight.evidence.ga4Users).toBe(150);
    });
  });

  describe('Growth Opportunities Detector', () => {
    it('detects SEARCH_CTR_OPTIMIZATION for high impression top-10 articles with low CTR', () => {
      const gsc: GSCSnapshot = {
        date: '2026-08-16',
        collectedAt: new Date().toISOString(),
        siteUrl: 'sc-domain:nicaraguainformate.com',
        dateRange: { start: '2026-08-09', end: '2026-08-16' },
        totalImpressions: 1500,
        totalClicks: 12,
        avgCtr: 0.008,
        avgPosition: 6.2,
        pages: [
          {
            url: 'https://nicaraguainformate.com/noticias/requisitos-licencia-conducir',
            impressions: 850,
            clicks: 6,
            ctr: 0.007,
            position: 5.4,
          },
        ],
        queries: [],
        countries: [],
        devices: [],
      };

      const ga4: GA4Snapshot = {
        date: '2026-08-16',
        collectedAt: new Date().toISOString(),
        propertyId: '525672447',
        dateRange: { start: '2026-08-09', end: '2026-08-16' },
        totalUsers: 100,
        totalSessions: 120,
        totalPageviews: 200,
        averageEngagementTimeSec: 85,
        engagementRate: 0.72,
        pages: [],
        sources: [],
        countries: [],
        devices: [],
        realtimeUsers: 5,
      };

      const noticias: Partial<Noticia>[] = [
        {
          slug: 'requisitos-licencia-conducir',
          titulo: 'Cómo sacar la licencia de conducir en Nicaragua 2026',
          categoria: 'Nacionales',
        },
      ];

      const opps = detectGrowthOpportunities(gsc, ga4, noticias);
      expect(opps.length).toBeGreaterThan(0);
      expect(opps[0].type).toBe('SEARCH_CTR_OPTIMIZATION');
      expect(opps[0].target.slug).toBe('requisitos-licencia-conducir');
      expect(opps[0].urgency).toBe('HIGH');
    });

    it('detects STRIKE_ZONE_QUERY for positions 6-15', () => {
      const gsc: GSCSnapshot = {
        date: '2026-08-16',
        collectedAt: new Date().toISOString(),
        siteUrl: 'sc-domain:nicaraguainformate.com',
        dateRange: { start: '2026-08-09', end: '2026-08-16' },
        totalImpressions: 500,
        totalClicks: 20,
        avgCtr: 0.04,
        avgPosition: 8.0,
        pages: [],
        queries: [
          {
            query: 'dengue sintomas nicaragua',
            impressions: 320,
            clicks: 14,
            ctr: 0.043,
            position: 7.8,
          },
        ],
        countries: [],
        devices: [],
      };

      const ga4: GA4Snapshot = {
        date: '2026-08-16',
        collectedAt: new Date().toISOString(),
        propertyId: '525672447',
        dateRange: { start: '2026-08-09', end: '2026-08-16' },
        totalUsers: 0,
        totalSessions: 0,
        totalPageviews: 0,
        averageEngagementTimeSec: 0,
        engagementRate: 0,
        pages: [],
        sources: [],
        countries: [],
        devices: [],
        realtimeUsers: 0,
      };

      const opps = detectGrowthOpportunities(gsc, ga4, []);
      expect(opps.some(o => o.type === 'STRIKE_ZONE_QUERY' && o.target.query === 'dengue sintomas nicaragua')).toBe(true);
    });
  });
});
