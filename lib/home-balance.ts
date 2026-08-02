import type { Noticia } from '@/lib/types';
import { isLutoNews } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { rankNoticias } from '@/lib/home-ranking';

export interface HomeHealthReport {
  categories: Record<string, { count: number; share: number }>;
  present: string[];
  missing: string[];
  dominant?: { category: string; share: number };
  alerts: string[];
  balanced: boolean;
}

const CATEGORY_TARGET: Record<string, number> = {
  Nacionales: 0.40,
  Sucesos: 0.15,
  Deportes: 0.15,
  Internacionales: 0.15,
  Tecnología: 0.10,
  Espectáculos: 0.05,
};

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

const HERO_STRATEGIC_BONUS = ['Nacionales', 'Tecnología', 'Internacionales', 'Deportes'];
const HERO_STRATEGIC_PENALTY = ['Sucesos', 'Espectáculos'];

function hoursSince(dateString: string): number {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return Infinity;
  return (Date.now() - date.getTime()) / 36e5;
}

export function selectHero(noticias: Noticia[]): Noticia | null {
  if (noticias.length === 0) return null;
  const ranked = rankNoticias(noticias);
  const candidates = ranked.slice(0, 10);

  const scored = candidates.map((n) => {
    let s = 0;
    const h = hoursSince(n.fechaActualizacion || n.fechaPublicacion || n.fecha);
    const freshness = Math.max(0, 1 - h / 12);
    s += freshness * 2;
    s += (n.scoreCalidad ?? 70) / 100 * 3;
    if (HERO_STRATEGIC_BONUS.includes(n.categoria)) s += 2;
    if (HERO_STRATEGIC_PENALTY.includes(n.categoria)) s -= 2;
    if (isLutoNews(n)) s -= 6;
    if ((n.vistas ?? 0) >= 50) s += 1;
    if (n.metaDescription?.trim() && n.keywords?.trim()) s += 0.5;
    return { n, s };
  });

  scored.sort((a, b) => b.s - a.s);
  return scored[0]?.n ?? ranked[0] ?? null;
}

export function diversifyChronological(
  noticias: Noticia[],
  limit = 5,
  maxPerCategory = 2,
  usedIds?: Set<string>
): Noticia[] {
  const sorted = [...noticias].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  const result: Noticia[] = [];
  const counts: Record<string, number> = {};
  const used = usedIds || new Set<string>();

  for (const n of sorted) {
    if (used.has(n.id)) continue;
    if (result.length >= limit) break;
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
    if (counts[n.categoria] <= maxPerCategory) {
      result.push(n);
      used.add(n.id);
    } else {
      counts[n.categoria]--;
    }
  }

  for (const n of sorted) {
    if (result.length >= limit) break;
    if (!result.includes(n)) {
      result.push(n);
      used.add(n.id);
    }
  }

  return result;
}

export function checkHomeDiversity(
  noticias: Noticia[],
  maxAllowedShare = 0.70
): HomeHealthReport {
  const counts: Record<string, number> = {};
  noticias.forEach((n) => {
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
  });

  const total = noticias.length || 1;
  const categories: Record<string, { count: number; share: number }> = {};
  Object.entries(counts).forEach(([c, cnt]) => {
    categories[c] = { count: cnt, share: cnt / total };
  });

  const present = Object.keys(counts);
  const missing = Object.keys(CATEGORY_TARGET).filter((c) => !present.includes(c));
  const entries = Object.entries(categories).sort((a, b) => b[1].share - a[1].share);
  const dominant = entries[0]
    ? { category: entries[0][0], share: entries[0][1].share }
    : undefined;

  const alerts: string[] = [];
  if (dominant && dominant.share >= maxAllowedShare) {
    alerts.push(
      `${dominant.category} representa ${(dominant.share * 100).toFixed(0)}% del Home. Recomendada redistribución.`
    );
  }
  missing.forEach((m) => alerts.push(`Falta la categoría ${m} en el Home.`));

  return { categories, present, missing, dominant, alerts, balanced: alerts.length === 0 };
}

export function prioritizeEvergreen(guias: EvergreenArticle[], limit = 4): EvergreenArticle[] {
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

  for (const g of sorted) {
    if (result.length >= limit) break;
    if (!result.includes(g)) result.push(g);
  }

  return result.slice(0, limit);
}

export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
