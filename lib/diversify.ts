import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';

const STRATEGIC_EVERGREEN_CATEGORIES = [
  'Economía',
  'Trámites',
  'Migración',
  'Turismo',
  'Servicios',
  'Costos',
  'Calendarios',
  'Deportes',
];

export function diversifyNoticias(noticias: Noticia[], limit = 5, maxPerCategory = 2): Noticia[] {
  const result: Noticia[] = [];
  const counts: Record<string, number> = {};

  for (const n of noticias) {
    counts[n.categoria] = counts[n.categoria] || 0;
    if (counts[n.categoria] < maxPerCategory) {
      result.push(n);
      counts[n.categoria]++;
    }
    if (result.length >= limit) break;
  }

  // Rellenar con lo que quede si no hay variedad suficiente
  for (const n of noticias) {
    if (result.length >= limit) break;
    if (!result.includes(n)) result.push(n);
  }

  return result.slice(0, limit);
}

export function diversifyEvergreen(guias: EvergreenArticle[], limit = 4): EvergreenArticle[] {
  const priority = new Set(STRATEGIC_EVERGREEN_CATEGORIES);
  const sorted = [...guias].sort((a, b) => {
    const pa = priority.has(a.category) ? 1 : 0;
    const pb = priority.has(b.category) ? 1 : 0;
    return pb - pa;
  });

  const result: EvergreenArticle[] = [];
  const usedCats = new Set<string>();

  for (const g of sorted) {
    if (!usedCats.has(g.category)) {
      result.push(g);
      usedCats.add(g.category);
    }
    if (result.length >= limit) break;
  }

  // Rellenar si no alcanza
  for (const g of sorted) {
    if (result.length >= limit) break;
    if (!result.includes(g)) result.push(g);
  }

  return result.slice(0, limit);
}
