/**
 * Strategy Engine — Inteligencia de Portada
 * ============================================
 * Genera sugerencias de portada basadas en balance, conflictos y datos reales.
 * Integra insights del Learning Engine y casos del Sistema de Seguimiento.
 */

import type { Noticia } from '@/lib/types';
import type {
  BalanceReport,
  PortadaConflict,
  PortadaSuggestion,
  StrategyConfig,
} from './types';

function makeId(type: string, detail: string): string {
  return `sug-${type}-${detail}`.slice(0, 60);
}

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'object' && val !== null && 'toDate' in val) {
    return (val as { toDate: () => Date }).toDate();
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function generateSuggestions(
  portadaArticles: Noticia[],
  allArticles: Noticia[],
  balance: BalanceReport,
  conflicts: PortadaConflict[],
  config: StrategyConfig,
): PortadaSuggestion[] {
  const suggestions: PortadaSuggestion[] = [];
  const portadaSlugs = new Set(portadaArticles.map((a) => a.slug || a.id));

  // ─── Sugerencias desde conflictos ───
  for (const conflict of conflicts) {
    if (conflict.type === 'category_monopoly') {
      const excess = conflict.affectedSlugs.length - config.maxArticlesPerCategory;
      const toDemote = conflict.affectedSlugs.slice(-excess);
      for (const slug of toDemote) {
        suggestions.push({
          id: makeId('demote', slug),
          type: 'demote',
          title: `Mover "${slug}" de portada`,
          description: `Reducir sobrerrepresentación de categoría.`,
          reason: conflict.description,
          priority: conflict.severity === 'critical' ? 'alta' : 'media',
          targetSlug: slug,
          impact: 'Mejora balance de categorías',
        });
      }
    }

    if (conflict.type === 'author_concentration') {
      const excess = conflict.affectedSlugs.length - config.maxArticlesPerAuthor;
      const toDemote = conflict.affectedSlugs.slice(-excess);
      for (const slug of toDemote) {
        suggestions.push({
          id: makeId('demote', `author-${slug}`),
          type: 'demote',
          title: `Diversificar autor: mover "${slug}"`,
          description: `Reducir concentración de un solo autor.`,
          reason: conflict.description,
          priority: 'media',
          targetSlug: slug,
          impact: 'Mejora diversidad de voces',
        });
      }
    }

    if (conflict.type === 'stale_content') {
      for (const slug of conflict.affectedSlugs) {
        suggestions.push({
          id: makeId('freshness', slug),
          type: 'freshness',
          title: `Reemplazar "${slug}" (stale)`,
          description: `Artículo con más de ${config.freshnessThresholdHours}h en portada.`,
          reason: conflict.description,
          priority: conflict.severity === 'critical' ? 'alta' : 'media',
          targetSlug: slug,
          impact: 'Mejora frescura de portada',
        });
      }
    }

    if (conflict.type === 'topic_overlap') {
      if (conflict.affectedSlugs.length > 1) {
        suggestions.push({
          id: makeId('remove_dup', conflict.affectedSlugs[0]),
          type: 'remove_duplicate',
          title: `Posible duplicado: ${conflict.affectedSlugs.join(' + ')}`,
          description: `Mover uno de los artículos similares a "ocultas".`,
          reason: conflict.description,
          priority: 'media',
          targetSlug: conflict.affectedSlugs[1],
          impact: 'Elimina redundancia',
        });
      }
    }
  }

  // ─── Sugerencias desde balance ───
  for (const cat of balance.underrepresented) {
    const candidate = allArticles
      .filter((a) => !portadaSlugs.has(a.slug || a.id))
      .filter((a) => (a.categoria || '') === cat)
      .sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0))[0];

    if (candidate) {
      suggestions.push({
        id: makeId('add_cat', cat),
        type: 'add_category',
        title: `Agregar noticia de ${cat}`,
        description: `Categoría subrepresentada en portada. "${candidate.titulo}" es buena candidata.`,
        reason: `La categoría ${cat} no tiene representación en portada. Diversificar mejora el alcance.`,
        priority: 'alta',
        targetCategory: cat,
        suggestedSlug: candidate.slug || candidate.id,
        impact: 'Amplía atractivo para diferentes audiencias',
      });
    }
  }

  // ─── Sugerencias de promoción (artículos con buen rendimiento fuera de portada) ───
  const topOutside = allArticles
    .filter((a) => !portadaSlugs.has(a.slug || a.id))
    .filter((a) => (a.vistas ?? 0) > 0)
    .sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0))
    .slice(0, 3);

  for (const article of topOutside) {
    const cat = article.categoria || 'General';
    if (!balance.overrepresented.includes(cat)) {
      suggestions.push({
        id: makeId('promote', article.slug || article.id),
        type: 'promote',
        title: `Promover "${article.titulo?.substring(0, 50)}..."`,
        description: `Artículo con ${article.vistas ?? 0} vistas fuera de portada. Categoría: ${cat}.`,
        reason: `Alto rendimiento fuera de portada. Podría generar más tráfico en posición destacada.`,
        priority: 'media',
        suggestedSlug: article.slug || article.id,
        targetCategory: cat,
        impact: `Potencial aumento de vistas`,
      });
    }
  }

  // ─── Sugerencias de frescura: artículos muy recientes fuera de portada ───
  const now = Date.now();
  const recentOutside = allArticles
    .filter((a) => !portadaSlugs.has(a.slug || a.id))
    .map((a) => {
      const fecha = parseDate(a.fecha);
      const ageHours = fecha ? (now - fecha.getTime()) / (1000 * 60 * 60) : 999;
      return { article: a, ageHours };
    })
    .filter((x) => x.ageHours < 6)
    .sort((a, b) => a.ageHours - b.ageHours)
    .slice(0, 3);

  for (const { article, ageHours } of recentOutside) {
    suggestions.push({
      id: makeId('freshness', article.slug || article.id),
      type: 'freshness',
      title: `Noticia fresca: "${article.titulo?.substring(0, 50)}..."`,
      description: `Publicada hace ${Math.round(ageHours)}h. No está en portada.`,
      reason: `Las noticias frescas generan más tráfico. Esta tiene menos de 6 horas.`,
      priority: 'alta',
      suggestedSlug: article.slug || article.id,
      impact: 'Aprovecha pico de interés inicial',
    });
  }

  // ─── Sugerencia de pin si hay un artículo con vistas muy altas ───
  const topInPortada = [...portadaArticles]
    .sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0))[0];
  if (topInPortada && (topInPortada.vistas ?? 0) > 10) {
    suggestions.push({
      id: makeId('pin', topInPortada.slug || topInPortada.id),
      type: 'pin',
      title: `Fijar "${topInPortada.titulo?.substring(0, 50)}..."`,
      description: `Artículo con ${topInPortada.vistas ?? 0} vistas. Fijarlo asegura visibilidad sostenida.`,
      reason: `Las noticias con alto rendimiento deben permanecer en posición destacada.`,
      priority: 'baja',
      targetSlug: topInPortada.slug || topInPortada.id,
      impact: 'Mantiene tráfico sostenido',
    });
  }

  // Ordenar por prioridad
  const priorityOrder = { alta: 0, media: 1, baja: 2 };
  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export function buildEditorialSummary(
  balance: BalanceReport,
  conflicts: PortadaConflict[],
  suggestions: PortadaSuggestion[],
): string {
  const parts: string[] = [];

  parts.push(`Balance editorial: ${balance.balanceScore}/100 (${balance.estado}).`);
  parts.push(`Diversidad de categorías: ${balance.categoryDiversity}%. Autores: ${balance.authorDiversity}%. Geografía: ${balance.geoDiversity}%.`);

  if (balance.overrepresented.length > 0) {
    parts.push(`Categorías sobrerrepresentadas: ${balance.overrepresented.join(', ')}.`);
  }
  if (balance.missing.length > 0) {
    parts.push(`Categorías ausentes: ${balance.missing.join(', ')}.`);
  }
  if (balance.staleInPortada > 0) {
    parts.push(`${balance.staleInPortada} artículo(s) stale en portada.`);
  }
  if (conflicts.length > 0) {
    const critical = conflicts.filter((c) => c.severity === 'critical').length;
    parts.push(`${conflicts.length} conflicto(s) detectado(s)${critical > 0 ? `, ${critical} crítico(s)` : ''}.`);
  }
  if (suggestions.length > 0) {
    const high = suggestions.filter((s) => s.priority === 'alta').length;
    parts.push(`${suggestions.length} sugerencia(s) de optimización${high > 0 ? `, ${high} de alta prioridad` : ''}.`);
  }

  return parts.join(' ');
}
