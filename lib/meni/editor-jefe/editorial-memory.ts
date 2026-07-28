/**
 * Editor Jefe — Fase 3: Memoria Editorial Inteligente
 * =====================================================
 * Reutiliza la Knowledge Base existente (kb_entities, kb_timeline, kb_relations)
 * para generar contexto narrativo automático.
 *
 * No crea nuevas colecciones en Firestore.
 * Transforma el KnowledgeQueryResult en narrativa editorial.
 */

import type { KnowledgeQueryResult } from '@/lib/meni/knowledge-base/types';
import type { MemoriaEditorial } from '@/lib/meni/editorial-brain/types';

/**
 * Transforma un KnowledgeQueryResult en MemoriaEditorial narrativa.
 * Genera antecedentes, cronología, entidades relacionadas, tendencia y contexto narrativo.
 */
export function buildMemoriaEditorial(
  query: KnowledgeQueryResult | undefined,
  categoria: string,
): MemoriaEditorial | undefined {
  if (!query || query.totalArticles === 0) return undefined;

  // Antecedentes: descripciones de eventos previos relevantes
  const antecedentes = query.antecedentes.slice(0, 5);

  // Cronología: timeline combinado, ordenado por fecha descendente
  const cronologia = query.timeline
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)
    .map(t => ({
      fecha: t.date,
      titulo: t.articleTitle,
      categoria: t.category,
      slug: t.articleSlug,
    }));

  // Entidades relacionadas
  const entidadesRelacionadas = query.entities
    .flatMap(e => e.relatedEntities.map(r => r.entity.name))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 10);

  // Detectar tendencia: si hay múltiples artículos sobre el mismo tema
  const tendencia = detectTrend(query, categoria);

  // Contexto narrativo: el texto que se inyecta en el diagnóstico
  const contextoNarrativo = buildNarrative(query, tendencia, cronologia.length);

  return {
    antecedentes,
    cronologia,
    entidadesRelacionadas,
    tendencia,
    contextoNarrativo,
    totalRelacionadas: query.totalArticles,
  };
}

/**
 * Detecta tendencias basándose en la frecuencia de entidades y timeline.
 */
function detectTrend(query: KnowledgeQueryResult, categoria: string): string | null {
  const timeline = query.timeline;
  if (timeline.length < 2) return null;

  // Contar cuántos artículos en el último año
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const recent = timeline.filter(t => new Date(t.date) > oneYearAgo);

  if (recent.length >= 3) {
    // Buscar la entidad más frecuente
    const entityCounts = new Map<string, number>();
    for (const e of query.entities) {
      entityCounts.set(e.entity.name, e.timeline.length);
    }
    const topEntity = Array.from(entityCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topEntity && topEntity[1] >= 3) {
      return `Esta es la nota número ${topEntity[1] + 1} sobre ${topEntity[0]} en el último año`;
    }
  }

  // Tendencia por categoría
  const categoryCount = timeline.filter(t => t.category === categoria).length;
  if (categoryCount >= 4) {
    return `Tendencia detectada: ${categoryCount + 1} notas sobre ${categoria.toLowerCase()} en el historial`;
  }

  return null;
}

/**
 * Construye el contexto narrativo que se inyecta en el diagnóstico editorial.
 */
function buildNarrative(
  query: KnowledgeQueryResult,
  tendencia: string | null,
  totalRelacionadas: number,
): string {
  const parts: string[] = [];

  if (tendencia) {
    parts.push(tendencia + '.');
  }

  if (totalRelacionadas > 0) {
    parts.push(`Hay ${totalRelacionadas} noticias relacionadas en el archivo editorial.`);
  }

  // Antecedentes relevantes
  if (query.antecedentes.length > 0) {
    parts.push(`Antecedentes: ${query.antecedentes.slice(0, 3).join('; ')}.`);
  }

  // Entidades más relevantes
  const topEntities = query.entities
    .sort((a, b) => b.timeline.length - a.timeline.length)
    .slice(0, 3)
    .map(e => e.entity.name);

  if (topEntities.length > 0) {
    parts.push(`Entidades relacionadas: ${topEntities.join(', ')}.`);
  }

  return parts.join(' ');
}
