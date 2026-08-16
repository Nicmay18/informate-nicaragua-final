import { describe, it, expect } from 'vitest';
import {
  auditArticleForAdSense,
  generateSiteAdSenseReport,
} from '@/lib/nios/revenue/adsense';
import { analyzeSustainability } from '@/lib/nios/revenue/sustainability';
import type { Noticia, GA4Snapshot } from '@/lib/contracts';

describe('NIOS v2 Revenue & Monetization Engine (Bloque 4)', () => {
  describe('AdSense & Quality Policy Audit', () => {
    it('audits a high-quality article as COMPLIANT_READY', () => {
      const article: Partial<Noticia> & { id: string } = {
        id: 'noticia-cafe-1',
        slug: 'exportaciones-cafe-nicaragua-2026',
        titulo: 'Exportaciones de café superan previsiones del ciclo 2025-2026',
        categoria: 'Economía',
        autor: 'Redacción Economía',
        fuente: 'Ministerio de Fomento, Industria y Comercio (MIFIC)',
        imagen: 'https://nicaraguainformate.com/images/cafe-matagalpa.webp',
        contenido: '<h2>Crecimiento en el sector cafetalero</h2><p>' + 'El sector cafetalero de Nicaragua registró un crecimiento sostenido impulsado por los precios internacionales y la productividad en Jinotega y Matagalpa. '.repeat(20) + '</p>',
        puntosClave: ['Incremento de 15% en divisas', 'Principales destinos: EE.UU. y Europa'],
      };

      const result = auditArticleForAdSense(article);
      expect(result.status).toBe('COMPLIANT_READY');
      expect(result.checks.hasClearAuthor).toBe(true);
      expect(result.checks.hasVerifiableSource).toBe(true);
      expect(result.checks.hasSubstantialContent).toBe(true);
      expect(result.checks.hasFeaturedImage).toBe(true);
      expect(result.checks.hasSensitiveTopic).toBe(false);
      expect(result.issues.length).toBe(0);
    });

    it('flags TECHNICAL_DEFECT when featured image is missing', () => {
      const article: Partial<Noticia> & { id: string } = {
        id: 'noticia-2',
        slug: 'noticia-sin-foto',
        titulo: 'Inauguran centro de salud en Masaya',
        categoria: 'Nacionales',
        autor: 'Redacción',
        fuente: 'MINSA',
        imagen: '',
        contenido: '<p>' + 'El centro atenderá a más de 10,000 familias de la zona urbana. '.repeat(25) + '</p>',
      };

      const result = auditArticleForAdSense(article);
      expect(result.status).toBe('TECHNICAL_DEFECT');
      expect(result.issues.some(i => i.includes('imagen'))).toBe(true);
    });

    it('flags NEEDS_EDITORIAL_ENRICHMENT when missing verifiable source', () => {
      const article: Partial<Noticia> & { id: string } = {
        id: 'noticia-3',
        slug: 'rumores-clima',
        titulo: 'Posibles lluvias en el occidente',
        categoria: 'Nacionales',
        autor: 'Redacción',
        fuente: '',
        imagen: 'https://nicaraguainformate.com/images/lluvia.webp',
        contenido: '<p>' + 'Se prevén precipitaciones en Chinandega y León durante el fin de semana. '.repeat(15) + '</p>',
      };

      const result = auditArticleForAdSense(article);
      expect(result.status).toBe('NEEDS_EDITORIAL_ENRICHMENT');
      expect(result.issues.some(i => i.includes('fuente'))).toBe(true);
    });

    it('flags POLICY_REVIEW_REQUIRED for sensitive terminology', () => {
      const article: Partial<Noticia> & { id: string } = {
        id: 'noticia-4',
        slug: 'operativo-droga',
        titulo: 'Operativo policial desarticula red de narcotráfico explícito',
        categoria: 'Sucesos',
        autor: 'Redacción Sucesos',
        fuente: 'Policía Nacional',
        imagen: 'https://nicaraguainformate.com/images/policia.webp',
        contenido: '<p>' + 'Autoridades realizaron allanamientos en tres barrios incautando sustancias ilícitas. '.repeat(20) + '</p>',
      };

      const result = auditArticleForAdSense(article);
      expect(result.status).toBe('POLICY_REVIEW_REQUIRED');
      expect(result.checks.hasSensitiveTopic).toBe(true);
    });

    it('generates a complete site report with prioritized action plan', () => {
      const articles: (Partial<Noticia> & { id: string })[] = [
        {
          id: '1',
          slug: 'nota-1',
          titulo: 'Nota 1',
          categoria: 'Economía',
          autor: 'Redacción',
          fuente: 'BCN',
          imagen: 'https://nicaraguainformate.com/img1.webp',
          contenido: '<p>' + 'Contenido económico sólido y detallado. '.repeat(60) + '</p>',
        },
        {
          id: '2',
          slug: 'nota-2',
          titulo: 'Nota 2',
          categoria: 'Sucesos',
          autor: 'Redacción',
          fuente: 'Policía',
          imagen: '',
          contenido: '<p>' + 'Nota sin imagen. '.repeat(25) + '</p>',
        },
      ];

      const report = generateSiteAdSenseReport(articles);
      expect(report.totalAudited).toBe(2);
      expect(report.compliantReadyCount).toBe(1);
      expect(report.technicalDefectCount).toBe(1);
      expect(report.compliancePercentage).toBe(50);
      expect(report.actionPlan.length).toBeGreaterThan(0);
    });
  });

  describe('Sustainability & Revenue Engine', () => {
    it('analyzes category performance and strategic roles', () => {
      const ga4: GA4Snapshot = {
        date: '2026-08-16',
        collectedAt: new Date().toISOString(),
        propertyId: '525672447',
        dateRange: { start: '2026-08-09', end: '2026-08-16' },
        totalUsers: 250,
        totalSessions: 300,
        totalPageviews: 650,
        averageEngagementTimeSec: 75,
        engagementRate: 0.8,
        pages: [
          {
            pagePath: '/noticias/precios-combustibles-nicaragua',
            screenPageviews: 200,
            users: 150,
            sessions: 160,
            averageEngagementTimeSec: 110,
            engagementRate: 0.85,
          },
        ],
        sources: [],
        devices: [],
      };

      const noticias: (Partial<Noticia> & { id: string })[] = [
        {
          id: 'art-eco',
          slug: 'precios-combustibles-nicaragua',
          titulo: 'Precios de los combustibles se mantienen estables',
          categoria: 'Economía',
          contenido: '<p>' + 'El INE y el MEM informaron sobre el subsidio a las gasolinas. '.repeat(35) + '</p>',
          fuente: 'INE',
          imagen: 'https://nicaraguainformate.com/gas.webp',
          related_links: ['/noticias/tipo-de-cambio-cordoba-dolar'],
        },
      ];

      const result = analyzeSustainability(ga4, noticias);
      expect(result.totalArticles).toBe(1);
      expect(result.totalAudienceSessions).toBe(300);
      expect(result.categoryMetrics.length).toBe(1);
      expect(result.categoryMetrics[0].category).toBe('Economía');
      expect(result.categoryMetrics[0].strategicRole).toBe('NICHE_HIGH_VALUE');
      expect(result.categoryMetrics[0].recirculationRate).toBe(100);
      expect(result.communitySupportReadiness.isReady).toBe(true);
    });
  });
});
