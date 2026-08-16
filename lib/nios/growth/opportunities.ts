/**
 * NIOS v2: Growth Intelligence & Opportunity Detector
 *
 * Discovers actionable business opportunities from real GSC & GA4 data:
 * - High search impressions with low CTR (Title/Snippet optimization)
 * - High retention articles lacking internal links (Recirculation boost)
 * - Category demand surges
 * - Ranking strike-zone queries (Positions 6-15)
 */

import type { GSCSnapshot, GA4Snapshot, Noticia } from '@/lib/contracts';
// Arquitectura: siempre alineado con los Data Contracts canónicos de lib/nios/intelligence/types.ts.
// Contradicción corregida: no se inventan campos como `keys` / `path` / `pageviews`;
// se usan los campos contratados: `url`, `query`, `pagePath`, `screenPageviews`, `averageEngagementTimeSec`.

export interface GrowthOpportunity {
  id: string;
  type:
    | 'SEARCH_CTR_OPTIMIZATION'
    | 'RECIRCULATION_ENRICHMENT'
    | 'CATEGORY_DEMAND_SURGE'
    | 'STRIKE_ZONE_QUERY'
    | 'EVERGREEN_POTENTIAL';
  target: {
    slug?: string;
    title?: string;
    category?: string;
    query?: string;
  };
  impactScore: number; // 1 to 100
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  headline: string;
  evidence: {
    impressions?: number;
    clicks?: number;
    ctr?: number;
    position?: number;
    pageviews?: number;
    recirculationRate?: number;
  };
  recommendedAction: string;
  expectedOutcome: string;
}

export function detectGrowthOpportunities(
  gsc: GSCSnapshot,
  ga4: GA4Snapshot,
  noticias: Partial<Noticia>[]
): GrowthOpportunity[] {
  const opportunities: GrowthOpportunity[] = [];
  const articleMap = new Map<string, Partial<Noticia>>();
  noticias.forEach(n => {
    if (n.slug) articleMap.set(n.slug, n);
  });

  // 1. Search CTR Optimization: Top 10 ranking with low CTR (< 2%) & > 150 impressions
  for (const page of gsc.pages || []) {
    const url = page.url || '';
    const slugMatch = url.match(/\/noticias\/([^/?#]+)/);
    const slug = slugMatch ? slugMatch[1] : '';
    const article = slug ? articleMap.get(slug) : undefined;

    if (page.impressions >= 150 && page.position <= 10 && page.ctr < 0.02) {
      opportunities.push({
        id: `opp-ctr-${slug || Math.random().toString(36).slice(2, 7)}`,
        type: 'SEARCH_CTR_OPTIMIZATION',
        target: {
          slug,
          title: article?.titulo || slug,
          category: article?.categoria,
        },
        impactScore: Math.min(100, Math.round(page.impressions / 10)),
        urgency: 'HIGH',
        headline: `Oportunidad de CTR en Google (${page.impressions} impresiones, CTR ${(page.ctr * 100).toFixed(1)}%, Posición ${page.position.toFixed(1)})`,
        evidence: {
          impressions: page.impressions,
          clicks: page.clicks,
          ctr: Math.round(page.ctr * 1000) / 10,
          position: Math.round(page.position * 10) / 10,
        },
        recommendedAction: 'Probar un título más directo y enriquecer la meta descripción con datos concretos.',
        expectedOutcome: 'Aumentar CTR del 1% al 3-4% podría triplicar los lectores orgánicos sin escribir una nueva nota.',
      });
    }
  }

  // 2. Strike-zone queries (Positions 6-15 with > 100 impressions)
  for (const q of gsc.queries || []) {
    const query = q.query || '';
    if (q.impressions >= 100 && q.position >= 6 && q.position <= 15) {
      opportunities.push({
        id: `opp-strike-${query.replace(/\s+/g, '-').slice(0, 30)}`,
        type: 'STRIKE_ZONE_QUERY',
        target: { query },
        impactScore: Math.min(95, Math.round(q.impressions / 15)),
        urgency: 'MEDIUM',
        headline: `Búsqueda en Zona de Salto: "${query}" (Posición ${q.position.toFixed(1)})`,
        evidence: {
          impressions: q.impressions,
          clicks: q.clicks,
          ctr: Math.round(q.ctr * 1000) / 10,
          position: Math.round(q.position * 10) / 10,
        },
        recommendedAction: `Añadir una sección H2 o datos específicos respondiendo a "${query}" en el artículo correspondiente.`,
        expectedOutcome: 'Saltar de página 2 a top 3 en Google para captar clics directos.',
      });
    }
  }

  // 3. High engagement articles lacking internal links (Recirculation)
  for (const p of ga4.pages || []) {
    const slugMatch = p.pagePath.match(/\/noticias\/([^/?#]+)/);
    const slug = slugMatch ? slugMatch[1] : '';
    const article = slug ? articleMap.get(slug) : undefined;

    if (article && p.screenPageviews >= 20 && p.averageEngagementTimeSec >= 60) {
      const hasRelated = article.related_links && article.related_links.length > 0;
      if (!hasRelated) {
        opportunities.push({
          id: `opp-recirc-${slug}`,
          type: 'RECIRCULATION_ENRICHMENT',
          target: {
            slug,
            title: article.titulo || slug,
            category: article.categoria,
          },
          impactScore: 75,
          urgency: 'MEDIUM',
          headline: `Alta lectura sin enlaces de recirculación (${p.screenPageviews} vistas, ${p.averageEngagementTimeSec}s lectura)`,
          evidence: {
            pageviews: p.screenPageviews,
          },
          recommendedAction: 'Insertar 2 enlaces a notas afines o guías dentro del cuerpo de la nota.',
          expectedOutcome: 'Retener al lector para que visite 2 o más páginas por sesión en lugar de abandonar el sitio.',
        });
      }
    }
  }

  // Sort by impact score descending
  return opportunities.sort((a, b) => b.impactScore - a.impactScore).slice(0, 15);
}
