import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { buildKnowledgeGraph } from '../knowledge-graph';

export interface LinkSuggestion {
  source: string;
  sourceTitle: string;
  targetSlug: string;
  targetTitle: string;
  targetType: 'noticia' | 'guía' | 'especial' | 'autor';
  reason: string;
  score: number;
}

export function runSmartLinks(noticias: Noticia[], guides: EvergreenArticle[] = []): LinkSuggestion[] {
  const graph = buildKnowledgeGraph(noticias, guides);
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const suggestions: LinkSuggestion[] = [];

  for (const n of published) {
    const text = `${n.titulo} ${n.resumen}`.toLowerCase();
    const relatedEntities = graph.entities.filter((e) =>
      e.news.includes(n.slug) ||
      e.name
        .toLowerCase()
        .split(' ')
        .some((part) => part.length > 3 && text.includes(part))
    );

    for (const e of relatedEntities.slice(0, 5)) {
      for (const target of e.news) {
        if (target === n.slug) continue;
        const targetNews = published.find((x) => x.slug === target);
        if (!targetNews) continue;
        if (n.related_links && n.related_links.some((l) => l.url.includes(target))) continue;
        suggestions.push({
          source: n.slug,
          sourceTitle: n.titulo,
          targetSlug: target,
          targetTitle: targetNews.titulo,
          targetType: 'noticia',
          reason: `Misma entidad: ${e.name}`,
          score: Math.min(100, 50 + e.count * 5 + (targetNews.vistas || 0)),
        });
      }
      for (const g of e.guides) {
        const guide = guides.find((x) => x.slug === g);
        if (!guide) continue;
        if (n.related_links && n.related_links.some((l) => l.url.includes(guide.slug))) continue;
        suggestions.push({
          source: n.slug,
          sourceTitle: n.titulo,
          targetSlug: guide.slug,
          targetTitle: guide.title,
          targetType: 'guía',
          reason: `Guía relacionada con: ${e.name}`,
          score: 70,
        });
      }
    }

    // sugerir guías por temática
    for (const g of guides) {
      const titleWords = g.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      const matches = titleWords.filter((w) => text.includes(w)).length;
      if (matches >= 2) {
        if (n.related_links && n.related_links.some((l) => l.url.includes(g.slug))) continue;
        suggestions.push({
          source: n.slug,
          sourceTitle: n.titulo,
          targetSlug: g.slug,
          targetTitle: g.title,
          targetType: 'guía',
          reason: 'Temas coincidentes',
          score: 50 + matches * 10,
        });
      }
    }

    // sugerir autor
    if (n.autor) {
      const sameAuthor = published.filter((x) => x.autor === n.autor && x.slug !== n.slug).sort((a, b) => (b.vistas || 0) - (a.vistas || 0))[0];
      if (sameAuthor) {
        suggestions.push({
          source: n.slug,
          sourceTitle: n.titulo,
          targetSlug: sameAuthor.slug,
          targetTitle: sameAuthor.titulo,
          targetType: 'autor',
          reason: `Más leído del mismo autor: ${n.autor}`,
          score: 60 + (sameAuthor.vistas || 0) / 10,
        });
      }
    }
  }

  // deduplicate
  const seen = new Set<string>();
  return suggestions
    .filter((s) => {
      const key = `${s.source}-${s.targetSlug}-${s.targetType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}
