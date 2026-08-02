import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { buildKnowledgeGraph } from '../knowledge-graph';
import { runContentIntelligence } from '../content-intelligence';

export interface RecycleSuggestion {
  type: 'guía' | 'actualización' | 'especial' | 'cronología';
  sourceSlug: string;
  sourceTitle: string;
  categoria: string;
  reason: string;
  target: string;
  views: number;
}

export function runContentRecycler(noticias: Noticia[], guides: EvergreenArticle[] = []): RecycleSuggestion[] {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const graph = buildKnowledgeGraph(noticias, guides);
  const ci = runContentIntelligence(noticias, guides);
  const suggestions: RecycleSuggestion[] = [];

  for (const n of published) {
    const text = `${n.titulo} ${n.resumen}`.toLowerCase();
    const views = n.vistas || 0;
    const hasGuidePotential = text.includes('cómo') || text.includes('requisitos') || text.includes('pasos') || text.includes('costo');

    if (views >= 100 && hasGuidePotential) {
      suggestions.push({
        type: 'guía',
        sourceSlug: n.slug,
        sourceTitle: n.titulo,
        categoria: n.categoria,
        reason: 'Tema recurrente con alto tráfico. Puede convertirse en guía canónica.',
        target: `Guía: "${n.titulo}"`,
        views,
      });
    }

    if (views >= 50) {
      const entity = graph.entities.find((e) => e.news.includes(n.slug));
      if (entity && entity.count >= 5) {
        suggestions.push({
          type: 'cronología',
          sourceSlug: n.slug,
          sourceTitle: n.titulo,
          categoria: n.categoria,
          reason: `Entidad "${entity.name}" con ${entity.count} noticias.`,
          target: `Cronología de ${entity.name}`,
          views,
        });
      }
    }
  }

  for (const n of ci.updateCandidates.slice(0, 10)) {
    suggestions.push({
      type: 'actualización',
      sourceSlug: n.slug,
      sourceTitle: n.title,
      categoria: n.categoria,
      reason: `Contenido con ${n.views} vistas y ${n.ageDays} días sin actualizar.`,
      target: `Actualizar: "${n.title}"`,
      views: n.views,
    });
  }

  for (const e of graph.entities.filter((x) => x.count >= 10).slice(0, 5)) {
    const hasGuide = e.guides.length > 0;
    if (!hasGuide) {
      suggestions.push({
        type: 'especial',
        sourceSlug: e.news[0],
        sourceTitle: e.name,
        categoria: e.categories[0] || 'General',
        reason: `Entidad cobierta ${e.count} veces. Falta guía o especial.`,
        target: `Especial: "Todo sobre ${e.name}"`,
        views: e.totalViews,
      });
    }
  }

  return suggestions.sort((a, b) => b.views - a.views).slice(0, 30);
}
