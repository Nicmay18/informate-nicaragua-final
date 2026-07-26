/**
 * Knowledge Base Orchestrator — MENI OS v6.0
 * ===========================================
 * Punto de entrada del Knowledge Graph.
 * - ingestArticle: procesa un artículo publicado y actualiza el grafo en Firestore.
 * - queryKnowledge: consulta el grafo para obtener contexto de una nueva noticia.
 * - loadGraph: carga el grafo desde Firestore (con caché en memoria).
 */

import type {
  IngestArticleInput,
  IngestResult,
  KnowledgeEntity,
  KnowledgeRelation,
  KnowledgeTimelineEntry,
  KnowledgeQueryResult,
} from './types';
import type { Firestore } from 'firebase-admin/firestore';
import { extractEntities, buildKnowledgeEntities } from './entity-extractor';
import { buildRelations } from './relation-builder';
import { buildTimelineEntries } from './timeline-builder';
import { queryKnowledge, type KnowledgeGraphData } from './knowledge-query';

let graphCache: KnowledgeGraphData | null = null;
let graphCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function loadGraph(db: Firestore, forceRefresh = false): Promise<KnowledgeGraphData> {
  if (graphCache && !forceRefresh && Date.now() - graphCacheTime < CACHE_TTL_MS) {
    return graphCache;
  }

  const entities = new Map<string, KnowledgeEntity>();
  const relations: KnowledgeRelation[] = [];
  const timelines = new Map<string, KnowledgeTimelineEntry[]>();

  const [entitiesSnap, relationsSnap, timelineSnap] = await Promise.all([
    db.collection('kb_entities').get(),
    db.collection('kb_relations').get(),
    db.collection('kb_timeline').get(),
  ]);

  for (const doc of entitiesSnap.docs) {
    const data = doc.data() as unknown as KnowledgeEntity;
    entities.set(data.id, data);
  }

  for (const doc of relationsSnap.docs) {
    const data = doc.data() as unknown as KnowledgeRelation;
    relations.push(data);
  }

  for (const doc of timelineSnap.docs) {
    const data = doc.data() as unknown as KnowledgeTimelineEntry;
    const existing = timelines.get(data.entityId) || [];
    existing.push(data);
    timelines.set(data.entityId, existing);
  }

  graphCache = { entities, relations, timelines };
  graphCacheTime = Date.now();

  return graphCache;
}

export function invalidateGraphCache(): void {
  graphCache = null;
  graphCacheTime = 0;
}

export async function ingestArticle(
  db: Firestore,
  input: IngestArticleInput,
): Promise<IngestResult> {
  const extracted = extractEntities(input.title, input.content, input.category);
  const newEntities = buildKnowledgeEntities(extracted, input.date);
  const newRelations = buildRelations(extracted, input.articleId, input.date);
  const newTimelineEntries = buildTimelineEntries(
    extracted,
    input.articleId,
    input.title,
    input.slug,
    input.date,
    input.category,
    input.content,
  );

  let entitiesCreated = 0;
  let entitiesUpdated = 0;
  let relationsCreated = 0;
  let relationsUpdated = 0;

  for (const entity of newEntities) {
    const ref = db.collection('kb_entities').doc(entity.id);
    const snap = await ref.get();
    if (snap.exists) {
      const existing = snap.data() as unknown as KnowledgeEntity;
      await ref.update({
        articleCount: (existing.articleCount || 0) + 1,
        lastSeen: input.date > existing.lastSeen ? input.date : existing.lastSeen,
        firstSeen: input.date < existing.firstSeen ? input.date : existing.firstSeen,
      });
      entitiesUpdated++;
    } else {
      await ref.set(entity as unknown as Record<string, unknown>);
      entitiesCreated++;
    }
  }

  for (const rel of newRelations) {
    const ref = db.collection('kb_relations').doc(rel.id);
    const snap = await ref.get();
    if (snap.exists) {
      const existing = snap.data() as unknown as KnowledgeRelation;
      await ref.update({
        strength: (existing.strength || 0) + 1,
        articleIds: [...new Set([...(existing.articleIds || []), ...(rel.articleIds || [])])].slice(-50),
        lastSeen: rel.lastSeen > existing.lastSeen ? rel.lastSeen : existing.lastSeen,
      });
      relationsUpdated++;
    } else {
      await ref.set(rel as unknown as Record<string, unknown>);
      relationsCreated++;
    }
  }

  for (const entry of newTimelineEntries) {
    const ref = db.collection('kb_timeline').doc(entry.id);
    await ref.set(entry as unknown as Record<string, unknown>);
  }

  invalidateGraphCache();

  return {
    entitiesCreated,
    entitiesUpdated,
    relationsCreated,
    relationsUpdated,
    timelineEntries: newTimelineEntries.length,
    entityIds: newEntities.map((e) => e.id),
  };
}

export async function queryKnowledgeForArticle(
  db: Firestore,
  title: string,
  content: string,
  category: string,
): Promise<KnowledgeQueryResult> {
  const graph = await loadGraph(db);
  return queryKnowledge(title, content, category, graph);
}

export type { KnowledgeQueryResult, KnowledgeGraphData };
