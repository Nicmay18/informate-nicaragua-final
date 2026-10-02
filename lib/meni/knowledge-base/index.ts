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

/**
 * Firestore rechaza `undefined` en cualquier campo (plano o anidado en
 * metadata). Los extractores producen campos opcionales (p.ej.
 * `description: info?.info` en volcanes sin ficha). Sin esta limpieza,
 * UNA entidad con un campo undefined abortaba el set() — y como el ingest
 * post-publicación es fire-and-forget, la KB quedó en 17 entidades sin
 * que nadie lo notara (hallazgo del backfill Learning 4.0).
 */
function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutUndefined) as T;
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = withoutUndefined(v);
    }
    return out as T;
  }
  return value;
}

export async function ingestArticle(
  db: Firestore,
  input: IngestArticleInput,
): Promise<IngestResult> {
  const extracted = extractEntities(input.title, input.content, input.category);
  const newEntities = buildKnowledgeEntities(extracted, input.date, input.category);
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

  // Entidades/relaciones/timeline de UN artículo son ids únicos → se
  // escriben en paralelo sin carreras (un entityId aparece una sola vez
  // por artículo). Artículos distintos se procesan en serie en los
  // callers para no perder incrementos de articleCount/strength.
  const entityResults = await Promise.all(newEntities.map(async (entity) => {
    const ref = db.collection('kb_entities').doc(entity.id);
    const snap = await ref.get();
    if (snap.exists) {
      const existing = snap.data() as unknown as KnowledgeEntity;
      const cats = new Set([...(existing.categoriasRelacionadas || []), ...(input.category && input.category !== 'General' ? [input.category] : [])]);
      const kws = new Set([...(existing.keywords || []), ...entity.keywords]);
      await ref.update({
        articleCount: (existing.articleCount || 0) + 1,
        lastSeen: input.date > existing.lastSeen ? input.date : existing.lastSeen,
        firstSeen: input.date < existing.firstSeen ? input.date : existing.firstSeen,
        categoriasRelacionadas: [...cats],
        keywords: [...kws].slice(0, 20),
      });
      return 'updated' as const;
    }
    await ref.set(withoutUndefined(entity) as unknown as Record<string, unknown>);
    return 'created' as const;
  }));
  const entitiesCreated = entityResults.filter(r => r === 'created').length;
  const entitiesUpdated = entityResults.length - entitiesCreated;

  const relResults = await Promise.all(newRelations.map(async (rel) => {
    const ref = db.collection('kb_relations').doc(rel.id);
    const snap = await ref.get();
    if (snap.exists) {
      const existing = snap.data() as unknown as KnowledgeRelation;
      await ref.update({
        strength: (existing.strength || 0) + 1,
        articleIds: [...new Set([...(existing.articleIds || []), ...(rel.articleIds || [])])].slice(-50),
        lastSeen: rel.lastSeen > existing.lastSeen ? rel.lastSeen : existing.lastSeen,
      });
      return 'updated' as const;
    }
    await ref.set(withoutUndefined(rel) as unknown as Record<string, unknown>);
    return 'created' as const;
  }));
  const relationsCreated = relResults.filter(r => r === 'created').length;
  const relationsUpdated = relResults.length - relationsCreated;

  await Promise.all(newTimelineEntries.map((entry) =>
    db.collection('kb_timeline').doc(entry.id)
      .set(withoutUndefined(entry) as unknown as Record<string, unknown>),
  ));

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

/**
 * Carga acotada del grafo para UNA noticia (Learning 4.0 — FASE 14).
 *
 * Antes: `loadGraph` traía TODAS las colecciones kb_* a memoria (~12.9K
 * docs tras el backfill de 489 notas — 36s en frío y ~12.9K lecturas por
 * refresco de caché de 5 min).
 *
 * Ahora: extrae las entidades de la noticia y solo lee lo que el grafo
 * necesita para ELLAS — `queryKnowledge` filtra relaciones/timeline por
 * entityId de todos modos. Costo típico: ~200-600 lecturas por consulta
 * en vez de ~12.9K por refresco. Marcado como P1-01 en SPRINT3_AUDIT.
 */
async function loadScopedGraph(
  db: Firestore,
  entityIds: string[],
): Promise<KnowledgeGraphData> {
  const entities = new Map<string, KnowledgeEntity>();
  const relations: KnowledgeRelation[] = [];
  const timelines = new Map<string, KnowledgeTimelineEntry[]>();
  if (entityIds.length === 0) return { entities, relations, timelines };

  const chunk = <T>(arr: T[], n: number) =>
    Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

  // 1. Entidades extraídas que existen en el grafo (getAll = 1 llamada, N lecturas).
  const entityRefs = entityIds.map((id) => db.collection('kb_entities').doc(id));
  const entitySnaps = await db.getAll(...entityRefs);
  const matchedIds: string[] = [];
  for (const s of entitySnaps) {
    if (!s.exists) continue;
    const e = s.data() as unknown as KnowledgeEntity;
    entities.set(e.id, e);
    matchedIds.push(e.id);
  }
  if (matchedIds.length === 0) return { entities, relations, timelines };

  // 2+3. Relaciones que tocan esas entidades Y timeline por entidad — en
  // paralelo (son independientes). 'in' admite máx. 30 ids por query.
  const relQueries = [
    ...chunk(matchedIds, 30).map((ids) =>
      db.collection('kb_relations').where('sourceId', 'in', ids).get()),
    ...chunk(matchedIds, 30).map((ids) =>
      db.collection('kb_relations').where('targetId', 'in', ids).get()),
  ];
  const timelineQueries = matchedIds.map((id) =>
    db.collection('kb_timeline').where('entityId', '==', id).limit(25).get()
      .catch(() => null),
  );
  const [relSnaps, timelineSnaps] = await Promise.all([
    Promise.all(relQueries),
    Promise.all(timelineQueries),
  ]);
  const relDocs = new Map<string, KnowledgeRelation>();
  for (const snap of relSnaps) {
    for (const d of snap.docs) {
      const r = d.data() as unknown as KnowledgeRelation;
      relDocs.set(d.id, r);
    }
  }
  relations.push(...relDocs.values());
  for (const snap of timelineSnaps) {
    if (!snap) continue;
    for (const d of snap.docs) {
      const t = d.data() as unknown as KnowledgeTimelineEntry;
      const list = timelines.get(t.entityId) || [];
      list.push(t);
      timelines.set(t.entityId, list);
    }
  }

  // 4. Vecinos de las relaciones (para nombres en `relatedEntities`), acotado.
  const neighborIds = new Set<string>();
  for (const r of relations) {
    if (neighborIds.size >= 60) break;
    if (!entities.has(r.sourceId)) neighborIds.add(r.sourceId);
    if (!entities.has(r.targetId)) neighborIds.add(r.targetId);
  }
  if (neighborIds.size > 0) {
    const nRefs = [...neighborIds].map((id) => db.collection('kb_entities').doc(id));
    for (const s of await db.getAll(...nRefs)) {
      if (!s.exists) continue;
      const e = s.data() as unknown as KnowledgeEntity;
      entities.set(e.id, e);
    }
  }

  return { entities, relations, timelines };
}

export async function queryKnowledgeForArticle(
  db: Firestore,
  title: string,
  content: string,
  category: string,
): Promise<KnowledgeQueryResult> {
  const ids = extractEntities(title, content, category).map((e) => e.id);
  const graph = await loadScopedGraph(db, ids);
  return queryKnowledge(title, content, category, graph);
}

export type { KnowledgeQueryResult, KnowledgeGraphData };
