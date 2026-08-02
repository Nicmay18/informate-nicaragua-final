import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { runContentIntelligence } from '../content-intelligence';
import { runBusinessV3 } from '../business';
import { buildKnowledgeGraph } from '../knowledge-graph';

export interface DailyBriefing {
  generatedAt: string;
  yesterday: {
    published: number;
    topNews: { slug: string; title: string; views: number }[];
    growing: { slug: string; title: string; views: number }[];
    totalViews: number;
  };
  today: {
    publish: string[];
    update: string[];
    distribute: string[];
    opportunity: string;
  };
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export function runDailyAutomation(noticias: Noticia[], guides: EvergreenArticle[] = []): DailyBriefing {
  const now = new Date();
  const yesterdayStart = new Date(now);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const yesterday = published.filter((n) => {
    const t = toDate(n.fecha).getTime();
    return t >= yesterdayStart.getTime() && t < yesterdayEnd.getTime();
  });

  const totalViews = yesterday.reduce((s, n) => s + (n.vistas || 0), 0);
  const topNews = yesterday.sort((a, b) => (b.vistas || 0) - (a.vistas || 0)).slice(0, 5).map((n) => ({ slug: n.slug, title: n.titulo, views: n.vistas || 0 }));

  const ci = runContentIntelligence(noticias, guides);
  const growing = ci.growing.slice(0, 5).map((n) => ({ slug: n.slug, title: n.title, views: n.views }));

  const graph = buildKnowledgeGraph(noticias, guides);
  const business = runBusinessV3(noticias, guides);

  const publish: string[] = [];
  if (business.commercialTopics[0]) publish.push(`Cobertura sobre ${business.commercialTopics[0].name}`);
  if (business.recurrentThemes[0]) publish.push(`Seguimiento de ${business.recurrentThemes[0].name}`);
  if (graph.entities[0]) publish.push(`Actualización de ${graph.entities[0].name}`);

  const update = ci.updateCandidates.slice(0, 3).map((n) => n.title);
  const distribute = [...topNews, ...growing].slice(0, 5).map((n) => n.title);

  const opportunity = business.commercialTopics[0]
    ? `Oportunidad: crear guía canónica sobre "${business.commercialTopics[0].name}".`
    : 'Oportunidad: fortalecer una categoría débil.';

  return {
    generatedAt: now.toISOString(),
    yesterday: {
      published: yesterday.length,
      topNews,
      growing,
      totalViews,
    },
    today: {
      publish,
      update,
      distribute,
      opportunity,
    },
  };
}
