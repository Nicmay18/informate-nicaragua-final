/**
 * Timeline Builder — Construye entradas de línea temporal por entidad.
 * Cada vez que una entidad aparece en un artículo, se agrega una entrada
 * a su cronología.
 */

import type { KnowledgeTimelineEntry } from './types';
import type { ExtractedEntity } from './entity-extractor';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildSummary(content: string, maxLen = 200): string {
  const plain = stripHtml(content);
  if (plain.length <= maxLen) return plain;
  const truncated = plain.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace > 80 ? lastSpace : maxLen) + '...';
}

export function buildTimelineEntries(
  entities: ExtractedEntity[],
  articleId: string,
  articleTitle: string,
  articleSlug: string,
  articleDate: string,
  articleCategory: string,
  articleContent: string,
): KnowledgeTimelineEntry[] {
  const summary = buildSummary(articleContent);
  const seen = new Set<string>();
  const entries: KnowledgeTimelineEntry[] = [];

  for (const e of entities) {
    const id = `${e.id}__${articleId}`;
    if (seen.has(id)) continue;
    seen.add(id);

    entries.push({
      id,
      entityId: e.id,
      articleId,
      articleTitle,
      articleSlug,
      date: articleDate,
      category: articleCategory,
      summary,
    });
  }

  return entries;
}
