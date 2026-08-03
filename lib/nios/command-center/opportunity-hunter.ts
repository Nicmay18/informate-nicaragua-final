import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { AUDIENCE_DEMAND } from './constants';
import type { HuntedOpportunity, OpportunityHunter } from './types';

function haystack(noticias: Noticia[], guides: EvergreenArticle[]): string {
  const fromNews = noticias
    .filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado')
    .map((n) => `${n.titulo} ${n.resumen} ${n.keywords || ''} ${(n.tags || []).join(' ')}`)
    .join(' ');
  const fromGuides = guides.map((g) => `${g.title} ${g.description}`).join(' ');
  return `${fromNews} ${fromGuides}`.toLowerCase();
}

/**
 * Cruza la demanda estructural de búsqueda de la audiencia nicaragüense
 * contra lo que el medio ya cubre, y devuelve los huecos accionables.
 */
export function buildOpportunityHunter(
  noticias: Noticia[],
  guides: EvergreenArticle[]
): OpportunityHunter {
  const corpus = haystack(noticias, guides);
  const guideTitles = guides.map((g) => g.title.toLowerCase());

  const items: HuntedOpportunity[] = AUDIENCE_DEMAND.map((d) => {
    const mentions = d.keywords.filter((k) => corpus.includes(k)).length;
    const hasGuide = guideTitles.some((t) => d.keywords.some((k) => t.includes(k)));
    // "Cubierto" exige una pieza permanente, no una mención suelta.
    const covered = hasGuide || mentions >= d.keywords.length;

    const rationale = covered
      ? hasGuide
        ? 'Ya existe una guía permanente que responde esta búsqueda.'
        : `El tema aparece en ${mentions} señales del archivo, pero sin pieza ancla.`
      : mentions > 0
        ? `Solo ${mentions} de ${d.keywords.length} señales cubiertas. La audiencia busca esto y el medio no responde.`
        : 'Demanda de búsqueda sin ninguna cobertura en el archivo.';

    const action = covered
      ? `Actualizar y enlazar la cobertura de "${d.topic}" desde noticias relacionadas.`
      : `Producir ${d.format === 'guía' ? 'una guía' : `un ${d.format}`} sobre "${d.topic}".`;

    return {
      id: `hunt-${d.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      topic: d.topic,
      intent: d.intent,
      demand: d.demand,
      format: d.format,
      rationale,
      covered,
      commercialValue: d.commercialValue,
      action,
    };
  });

  const valueRank = { alto: 0, medio: 1, bajo: 2 } as const;
  items.sort((a, b) => {
    if (a.covered !== b.covered) return a.covered ? 1 : -1;
    return valueRank[a.commercialValue] - valueRank[b.commercialValue];
  });

  return {
    covered: items.filter((i) => i.covered).length,
    uncovered: items.filter((i) => !i.covered).length,
    items,
  };
}
