import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { buildKnowledgeGraph } from '../knowledge-graph';

export interface EntityBrain {
  entity: string;
  type: string;
  totalNews: number;
  lastNews?: { slug: string; title: string; date: string };
  authors: string[];
  relatedTopics: string[];
  opportunities: string[];
}

export function buildEntityBrain(noticias: Noticia[], guides: EvergreenArticle[] = []): EntityBrain[] {
  const graph = buildKnowledgeGraph(noticias, guides);
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');

  return graph.entities.slice(0, 30).map((e) => {
    const news = published
      .filter((n) => e.news.includes(n.slug))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const lastNews = news[0]
      ? { slug: news[0].slug, title: news[0].titulo, date: news[0].fecha }
      : undefined;

    const authors = [...new Set(news.map((n) => n.autor).filter((a): a is string => !!a))];
    const topics = e.categories;

    const opportunities: string[] = [];
    if (e.guides.length === 0) opportunities.push('Crear guía canónica.');
    if (e.count >= 5 && news.length > 0) opportunities.push('Crear especial con cronología.');
    if (e.count >= 3) opportunities.push('Actualizar contexto con noticia reciente.');

    return {
      entity: e.name,
      type: e.type,
      totalNews: e.count,
      lastNews,
      authors,
      relatedTopics: topics,
      opportunities,
    };
  });
}
