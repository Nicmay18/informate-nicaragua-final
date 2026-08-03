import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { COMMERCIAL_CATEGORIES } from './constants';
import type { RevenueEngine, RevenueOpportunity } from './types';

/**
 * No vende publicidad ni fija precios. Identifica dónde el inventario
 * editorial ya construido puede convertirse en una conversación comercial.
 */
export function buildRevenueEngine(
  noticias: Noticia[],
  guides: EvergreenArticle[]
): RevenueEngine {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const total = published.length || 1;

  const counts: Record<string, number> = {};
  const traffic: Record<string, number> = {};
  for (const n of published) {
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
    traffic[n.categoria] = (traffic[n.categoria] || 0) + (n.vistas || 0);
  }

  const guidesByCategory: Record<string, EvergreenArticle[]> = {};
  for (const g of guides) {
    guidesByCategory[g.category] = guidesByCategory[g.category] || [];
    guidesByCategory[g.category].push(g);
  }

  const opportunities: RevenueOpportunity[] = [];
  let monetizableArticles = 0;
  let commercialCount = 0;

  for (const [category, { advertisers, potential }] of Object.entries(COMMERCIAL_CATEGORIES)) {
    const articles = counts[category] || 0;
    const categoryGuides = guidesByCategory[category] || [];
    const views = traffic[category] || 0;
    const inventory = articles + categoryGuides.length;

    commercialCount += articles;
    if (inventory >= 3) monetizableArticles += inventory;

    // Un patrocinio necesita inventario estable + una pieza ancla permanente.
    const hasAnchor = categoryGuides.length > 0;
    const readiness = Math.max(
      0,
      Math.min(100, Math.round(inventory * 8 + (hasAnchor ? 30 : 0) + Math.min(30, views / 10)))
    );

    if (inventory === 0) {
      opportunities.push({
        id: `rev-${category}-seed`,
        category,
        title: `Abrir la vertical ${category}`,
        rationale: `Sin inventario en una categoría con anunciantes activos (${advertisers.slice(0, 2).join(', ')}).`,
        advertisers,
        readiness,
        effort: 'alto',
        potential: 'exploratorio',
        nextStep: `Publicar 3 notas base de ${category} antes de ofrecer espacio comercial.`,
      });
      continue;
    }

    if (!hasAnchor) {
      opportunities.push({
        id: `rev-${category}-anchor`,
        category,
        title: `Crear la guía ancla de ${category}`,
        rationale: `${inventory} piezas publicadas pero sin contenido permanente que sostenga un patrocinio anual.`,
        advertisers,
        readiness,
        effort: 'medio',
        potential,
        nextStep: `Publicar "${category} Nicaragua 2026" como guía canónica patrocinable.`,
      });
    } else {
      const anchor = categoryGuides[0];
      opportunities.push({
        id: `rev-${category}-sponsor`,
        category,
        title: `"${anchor.title}" puede vender patrocinio`,
        rationale: `${inventory} piezas y ${views} vistas acumuladas en una vertical con demanda publicitaria ${potential}.`,
        advertisers,
        readiness,
        effort: 'bajo',
        potential,
        nextStep: `Armar un one-pager de patrocinio para ${advertisers[0]} y ${advertisers[1] || advertisers[0]}.`,
      });
    }
  }

  opportunities.sort((a, b) => b.readiness - a.readiness);

  const commercialShare = Math.round((commercialCount / total) * 1000) / 10;

  let verdict: string;
  if (commercialShare >= 25) {
    verdict = 'El inventario comercial es suficiente para abrir conversaciones de patrocinio.';
  } else if (commercialShare >= 12) {
    verdict = 'Hay base comercial, pero depende de pocas categorías. Ampliar antes de vender.';
  } else {
    verdict = 'El archivo es casi todo contenido no monetizable. Sin verticales comerciales no hay negocio.';
  }

  return {
    commercialShare,
    monetizableArticles,
    opportunities: opportunities.slice(0, 8),
    verdict,
  };
}
