import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { buildKnowledgeGraph } from '../knowledge-graph';

export interface MemoryEntry {
  entity: string;
  type: string;
  count: number;
  chronology: { slug: string; title: string; date: string; views: number }[];
  guides: string[];
  message: string;
}

export interface EditorialMemory {
  memories: MemoryEntry[];
  orphanNews: { slug: string; title: string; reason: string }[];
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export function buildEditorialMemory(noticias: Noticia[], guides: EvergreenArticle[] = []): EditorialMemory {
  const graph = buildKnowledgeGraph(noticias, guides);
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const memories: MemoryEntry[] = [];

  for (const e of graph.entities.slice(0, 50)) {
    const news = published
      .filter((n) => e.news.includes(n.slug))
      .sort((a, b) => toDate(a.fecha).getTime() - toDate(b.fecha).getTime())
      .map((n) => ({ slug: n.slug, title: n.titulo, date: n.fecha, views: n.vistas || 0 }));

    if (news.length < 2) continue;

    memories.push({
      entity: e.name,
      type: e.type,
      count: e.count,
      chronology: news,
      guides: e.guides,
      message: `Existe cobertura previa. ${e.name} aparece en ${e.count} noticia${e.count === 1 ? '' : 's'}.`,
    });
  }

  const linked = new Set(memories.flatMap((m) => m.chronology.map((c) => c.slug)));
  const orphanNews = published
    .filter((n) => !linked.has(n.slug))
    .slice(0, 20)
    .map((n) => ({ slug: n.slug, title: n.titulo, reason: 'Sin relación con entidades o cobertura previa.' }));

  return { memories, orphanNews };
}
