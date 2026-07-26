/**
 * Conflict Detector — Inteligencia de Portada
 * ==============================================
 * Detecta sesgos: mismo tema, mismo autor, misma región, contenido stale.
 */

import type { Noticia } from '@/lib/types';
import type { PortadaConflict, StrategyConfig } from './types';

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

export function detectConflicts(
  portadaArticles: Noticia[],
  config: StrategyConfig,
): PortadaConflict[] {
  const conflicts: PortadaConflict[] = [];
  const now = Date.now();

  // ─── Concentración por categoría ───
  const categoryGroups: Record<string, string[]> = {};
  for (const a of portadaArticles) {
    const cat = a.categoria || 'General';
    if (!categoryGroups[cat]) categoryGroups[cat] = [];
    categoryGroups[cat].push(a.slug || a.id);
  }

  for (const [cat, slugs] of Object.entries(categoryGroups)) {
    if (slugs.length > config.maxArticlesPerCategory) {
      conflicts.push({
        id: `cat-monopoly-${cat}`,
        type: 'category_monopoly',
        description: `${slugs.length} artículos de ${cat} en portada (máximo: ${config.maxArticlesPerCategory}). Sobrerrepresentación de una categoría.`,
        severity: slugs.length > config.maxArticlesPerCategory + 2 ? 'critical' : 'warning',
        affectedSlugs: slugs,
        suggestedAction: `Mover ${slugs.length - config.maxArticlesPerCategory} artículo(s) de ${cat} a "ocultas" o reemplazar con otras categorías.`,
      });
    }
  }

  // ─── Concentración por autor ───
  const authorGroups: Record<string, string[]> = {};
  for (const a of portadaArticles) {
    const autor = a.autor || 'Sin autor';
    if (!authorGroups[autor]) authorGroups[autor] = [];
    authorGroups[autor].push(a.slug || a.id);
  }

  for (const [autor, slugs] of Object.entries(authorGroups)) {
    if (slugs.length > config.maxArticlesPerAuthor) {
      conflicts.push({
        id: `author-conc-${autor}`,
        type: 'author_concentration',
        description: `${slugs.length} artículos de ${autor} en portada (máximo: ${config.maxArticlesPerAuthor}). Falta diversidad de voces.`,
        severity: slugs.length > config.maxArticlesPerAuthor + 1 ? 'critical' : 'warning',
        affectedSlugs: slugs,
        suggestedAction: `Diversificar autores. Mover artículos excedentes de ${autor} o buscar notas de otros colaboradores.`,
      });
    }
  }

  // ─── Concentración geográfica ───
  const geoGroups: Record<string, string[]> = {};
  for (const a of portadaArticles) {
    const dep = ((a as unknown as Record<string, unknown>).departamento as string | undefined) || 'Nacional';
    if (!geoGroups[dep]) geoGroups[dep] = [];
    geoGroups[dep].push(a.slug || a.id);
  }

  const totalArticles = portadaArticles.length || 1;
  for (const [dep, slugs] of Object.entries(geoGroups)) {
    const pct = (slugs.length / totalArticles) * 100;
    if (pct > 60 && dep !== 'Nacional' && slugs.length > 3) {
      conflicts.push({
        id: `geo-conc-${dep}`,
        type: 'geo_concentration',
        description: `${slugs.length} artículos de ${dep} (${Math.round(pct)}%) en portada. Sobrerrepresentación geográfica.`,
        severity: pct > 75 ? 'critical' : 'warning',
        affectedSlugs: slugs,
        suggestedAction: `Incluir noticias de otros departamentos para balancear cobertura nacional.`,
      });
    }
  }

  // ─── Contenido stale ───
  const staleSlugs: string[] = [];
  for (const a of portadaArticles) {
    const fecha = parseDate(a.fecha);
    if (fecha) {
      const ageHours = (now - fecha.getTime()) / (1000 * 60 * 60);
      if (ageHours > config.freshnessThresholdHours) {
        staleSlugs.push(a.slug || a.id);
      }
    }
  }

  if (staleSlugs.length > 0) {
    conflicts.push({
      id: 'stale-content',
      type: 'stale_content',
      description: `${staleSlugs.length} artículo(s) en portada con más de ${config.freshnessThresholdHours}h de antigüedad. La portada necesita frescura.`,
      severity: staleSlugs.length > portadaArticles.length * 0.4 ? 'critical' : 'warning',
      affectedSlugs: staleSlugs,
      suggestedAction: `Reemplazar artículos antiguos con noticias más recientes. Considerar mover a "destacadas" si siguen siendo relevantes.`,
    });
  }

  // ─── Overlap de tema (mismas entidades/títulos similares) ───
  const titleMap = new Map<string, string[]>();
  for (const a of portadaArticles) {
    const titulo = (a.titulo || '').toLowerCase();
    const words = titulo.split(/\s+/).filter((w) => w.length > 4);
    const key = words.slice(0, 3).sort().join('-');
    if (!titleMap.has(key)) titleMap.set(key, []);
    titleMap.get(key)!.push(a.slug || a.id);
  }

  for (const [key, slugs] of titleMap) {
    if (slugs.length > 1) {
      conflicts.push({
        id: `topic-overlap-${key}`,
        type: 'topic_overlap',
        description: `${slugs.length} artículos con tema similar en portada. Posible redundancia.`,
        severity: 'warning',
        affectedSlugs: slugs,
        suggestedAction: `Revisar si los artículos cubren el mismo hecho. Consolidar o mover duplicados a "ocultas".`,
      });
    }
  }

  return conflicts;
}
