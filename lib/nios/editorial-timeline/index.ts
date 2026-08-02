import type { Noticia } from '@/lib/types';
import { buildKnowledgeGraph } from '../knowledge-graph';

export interface YearCount {
  year: number;
  count: number;
  views: number;
}

export interface EntityTimeline {
  id: string;
  name: string;
  type: string;
  years: YearCount[];
  total: number;
  topNews: { slug: string; title: string; date: string; views: number }[];
}

export interface EditorialTimeline {
  timelines: EntityTimeline[];
  entityCount: number;
  yearRange: { min: number; max: number };
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export function buildEditorialTimeline(noticias: Noticia[]): EditorialTimeline {
  const graph = buildKnowledgeGraph(noticias);
  const timelines: EntityTimeline[] = [];
  let minYear = new Date().getFullYear();
  let maxYear = 2000;

  for (const e of graph.entities.slice(0, 50)) {
    const yearMap: Record<number, { count: number; views: number }> = {};
    const news = noticias.filter((n) => e.news.includes(n.slug) && n.estado !== 'borrador' && n.estado !== 'archivado');
    const topNews = news
      .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))
      .slice(0, 5)
      .map((n) => ({ slug: n.slug, title: n.titulo, date: n.fecha, views: n.vistas || 0 }));

    for (const n of news) {
      const year = toDate(n.fecha).getFullYear();
      if (year < minYear) minYear = year;
      if (year > maxYear) maxYear = year;
      if (!yearMap[year]) yearMap[year] = { count: 0, views: 0 };
      yearMap[year].count++;
      yearMap[year].views += n.vistas || 0;
    }

    const years = Object.entries(yearMap)
      .map(([year, data]) => ({ year: Number(year), count: data.count, views: data.views }))
      .sort((a, b) => a.year - b.year);

    timelines.push({
      id: e.id,
      name: e.name,
      type: e.type,
      years,
      total: e.count,
      topNews,
    });
  }

  return {
    timelines,
    entityCount: graph.entities.length,
    yearRange: { min: minYear, max: maxYear },
  };
}
