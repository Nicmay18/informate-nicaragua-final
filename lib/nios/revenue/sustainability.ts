/**
 * NIOS v2: Revenue & Sustainability Engine
 *
 * Tracks the economic and audience sustainability of Nicaragua Informate:
 * - Category value performance (traffic, recirculation, reader engagement)
 * - Monetization health metrics (ad-to-content balance, reader retention)
 * - Community support & direct sponsorship readiness
 */

import type { GA4Snapshot, Noticia } from '@/lib/contracts';

export interface CategorySustainabilityMetric {
  category: string;
  articleCount: number;
  totalPageviews: number;
  avgEngagementSec: number;
  recirculationRate: number;
  monetizationReadinessPercent: number;
  strategicRole: 'GROWTH_DRIVER' | 'RETENTION_PILLAR' | 'NICHE_HIGH_VALUE' | 'EXPLORATORY';
  revenueRecommendation: string;
}

export interface SustainabilityOverview {
  generatedAt: string;
  totalArticles: number;
  totalAudienceSessions: number;
  averageSessionDurationSec: number;
  communitySupportReadiness: {
    isReady: boolean;
    callToActionSnippet: string;
    targetPlacement: string;
  };
  categoryMetrics: CategorySustainabilityMetric[];
  monetizationPriorities: string[];
}

export function analyzeSustainability(
  ga4: GA4Snapshot,
  noticias: (Partial<Noticia> & { id: string })[]
): SustainabilityOverview {
  const categoryStats = new Map<
    string,
    {
      articles: number;
      pageviews: number;
      totalEngagementSec: number;
      articlesWithLinks: number;
      readyArticles: number;
    }
  >();

  // Map GA4 page views by slug
  const pageviewsBySlug = new Map<string, { pageviews: number; engagementSec: number }>();
  for (const p of ga4.pages || []) {
    const slugMatch = p.pagePath.match(/\/noticias\/([^/?#]+)/);
    const slug = slugMatch ? slugMatch[1] : '';
    if (slug) {
      pageviewsBySlug.set(slug, {
        pageviews: p.screenPageviews || 0,
        engagementSec: p.averageEngagementTimeSec || 0,
      });
    }
  }

  for (const n of noticias) {
    const cat = n.categoria || 'Nacionales';
    const stats = categoryStats.get(cat) || {
      articles: 0,
      pageviews: 0,
      totalEngagementSec: 0,
      articlesWithLinks: 0,
      readyArticles: 0,
    };

    stats.articles += 1;
    const ga = n.slug ? pageviewsBySlug.get(n.slug) : undefined;
    if (ga) {
      stats.pageviews += ga.pageviews;
      stats.totalEngagementSec += ga.engagementSec;
    }

    if (n.related_links && n.related_links.length > 0) {
      stats.articlesWithLinks += 1;
    }

    if (n.contenido && n.contenido.length >= 800 && n.fuente && n.imagen) {
      stats.readyArticles += 1;
    }

    categoryStats.set(cat, stats);
  }

  const categoryMetrics: CategorySustainabilityMetric[] = Array.from(categoryStats.entries()).map(
    ([category, stats]) => {
      const avgEng = stats.articles > 0 ? Math.round(stats.totalEngagementSec / stats.articles) : 0;
      const recircRate = stats.articles > 0 ? Math.round((stats.articlesWithLinks / stats.articles) * 100) : 0;
      const readPercent = stats.articles > 0 ? Math.round((stats.readyArticles / stats.articles) * 100) : 0;

      let strategicRole: CategorySustainabilityMetric['strategicRole'] = 'GROWTH_DRIVER';
      let revenueRecommendation = 'Mantener cobertura actual y asegurar 2 enlaces internos por nota.';

      if (category === 'Economía' || category === 'Economia') {
        strategicRole = 'NICHE_HIGH_VALUE';
        revenueRecommendation = 'Alta afinidad con anunciantes financieros y comerciales. Profundizar guías de servicio.';
      } else if (category === 'Nacionales' || category === 'Sucesos') {
        strategicRole = 'GROWTH_DRIVER';
        revenueRecommendation = 'Gran volumen de entrada. Clave convertir lectores de sucesos a notas de economía o turismo.';
      } else if (avgEng > 90) {
        strategicRole = 'RETENTION_PILLAR';
        revenueRecommendation = 'Audiencia altamente comprometida. Excelente posición para banner de apoyo comunitario.';
      } else if (stats.articles < 5) {
        strategicRole = 'EXPLORATORY';
        revenueRecommendation = 'Vertical en desarrollo. Incrementar ritmo editorial con 2-3 notas clave por semana.';
      }

      return {
        category,
        articleCount: stats.articles,
        totalPageviews: stats.pageviews,
        avgEngagementSec: avgEng,
        recirculationRate: recircRate,
        monetizationReadinessPercent: readPercent,
        strategicRole,
        revenueRecommendation,
      };
    }
  );

  const priorities: string[] = [
    'Optimizar velocidad de carga móvil para mantener AdSense Viewability sobre 70%.',
    'Aumentar la tasa de recirculación interna a más del 60% para generar 2da impresión por sesión.',
    'Diversificar ingresos: combinar AdSense con patrocinios directos de marcas locales en Managua y departamentos.',
  ];

  return {
    generatedAt: new Date().toISOString(),
    totalArticles: noticias.length,
    totalAudienceSessions: ga4.totalSessions || 0,
    averageSessionDurationSec: ga4.averageEngagementTimeSec || 0,
    communitySupportReadiness: {
      isReady: true,
      callToActionSnippet: '¿Te resulta útil el periodismo de Nicaragua Infórmate? Comparte o apoya nuestro trabajo independiente.',
      targetPlacement: 'Al final de artículos con más de 90 segundos de lectura promedio.',
    },
    categoryMetrics,
    monetizationPriorities: priorities,
  };
}
