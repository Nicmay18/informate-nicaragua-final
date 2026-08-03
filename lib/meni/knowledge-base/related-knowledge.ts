/**
 * Related Knowledge — Reemplaza related_links basados en categoría
 * con relacionados basados en entidades compartidas.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { extractEntities } from './entity-extractor';

export interface RelatedArticle {
  articleId: string;
  title: string;
  slug: string;
  date: string;
  category: string;
  sharedEntities: string[];
  relevanceScore: number;
}

/**
 * Encuentra artículos relacionados basados en entidades compartidas
 * en lugar de solo categoría.
 */
export async function findRelatedByEntities(
  db: Firestore,
  articleId: string,
  title: string,
  content: string,
  category: string,
  excludeIds: string[] = [],
): Promise<RelatedArticle[]> {
  const entities = extractEntities(title, content, category);
  const entityIds = entities.map((e) => e.id);

  if (entityIds.length === 0) return [];

  const excludeSet = new Set([articleId, ...excludeIds]);

  const scores = new Map<string, RelatedArticle>();

  for (const entityId of entityIds) {
    const timelineSnap = await db
      .collection('kb_timeline')
      .where('entityId', '==', entityId)
      .limit(20)
      .get();

    for (const doc of timelineSnap.docs) {
      const entry = doc.data();
      const aid = entry.articleId as string;
      if (excludeSet.has(aid)) continue;

      const existing = scores.get(aid);
      if (existing) {
        existing.sharedEntities.push(entityId);
        existing.relevanceScore += 1;
      } else {
        scores.set(aid, {
          articleId: aid,
          title: entry.articleTitle as string,
          slug: entry.articleSlug as string,
          date: entry.date as string,
          category: entry.category as string,
          sharedEntities: [entityId],
          relevanceScore: 1,
        });
      }
    }
  }

  const results = [...scores.values()];
  results.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return results.slice(0, 5);
}

/**
 * Versión simplificada que genera related_links para guardar en Firestore.
 */
export async function generateRelatedLinks(
  db: Firestore,
  articleId: string,
  title: string,
  content: string,
  category: string,
): Promise<Array<{ url: string; anchor: string; type: string }>> {
  const related = await findRelatedByEntities(db, articleId, title, content, category);

  return related.map((r) => ({
    url: `/noticias/${r.slug}`,
    anchor: r.title.substring(0, 70),
    type: 'relacionada',
  }));
}
