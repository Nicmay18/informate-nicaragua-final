/**
 * Entity Page Loader — Carga datos completos de una entidad para su página pública.
 * Incluye: datos de la entidad, timeline, noticias relacionadas, entidades relacionadas.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { KnowledgeEntity, KnowledgeTimelineEntry, KnowledgeRelation } from './types';

export interface EntityPageData {
  entity: KnowledgeEntity;
  timeline: KnowledgeTimelineEntry[];
  relatedEntities: Array<{
    entity: KnowledgeEntity;
    relation: string;
    strength: number;
  }>;
  newsIds: string[];
}

export async function loadEntityPage(
  db: Firestore,
  slug: string,
): Promise<EntityPageData | null> {
  const snap = await db
    .collection('kb_entities')
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const entity = snap.docs[0].data() as unknown as KnowledgeEntity;

  const [timelineSnap, relationsSnap] = await Promise.all([
    db.collection('kb_timeline').where('entityId', '==', entity.id).get(),
    db.collection('kb_relations')
      .where('sourceId', '==', entity.id)
      .get(),
  ]);

  const timeline: KnowledgeTimelineEntry[] = timelineSnap.docs.map(
    (d) => d.data() as unknown as KnowledgeTimelineEntry,
  );
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const newsIds = [...new Set(timeline.map((t) => t.articleId))];

  const relatedEntityIds = new Set<string>();
  const relations: KnowledgeRelation[] = relationsSnap.docs.map(
    (d) => d.data() as unknown as KnowledgeRelation,
  );

  for (const rel of relations) {
    relatedEntityIds.add(rel.targetId);
  }

  const reverseRelSnap = await db
    .collection('kb_relations')
    .where('targetId', '==', entity.id)
    .get();

  const reverseRelations: KnowledgeRelation[] = reverseRelSnap.docs.map(
    (d) => d.data() as unknown as KnowledgeRelation,
  );

  for (const rel of reverseRelations) {
    relatedEntityIds.add(rel.sourceId);
  }

  const allRelations = [...relations, ...reverseRelations];
  const relatedEntityIdArr = Array.from(relatedEntityIds);

  // Batch read all related entities in a single call (fixes N+1)
  const relatedDocs = await db.getAll(
    ...relatedEntityIdArr.map((id) => db.collection('kb_entities').doc(id))
  );

  const relatedEntities: Array<{
    entity: KnowledgeEntity;
    relation: string;
    strength: number;
  }> = [];

  for (let i = 0; i < relatedEntityIdArr.length; i++) {
    const doc = relatedDocs[i];
    if (!doc.exists) continue;
    const ent = doc.data() as unknown as KnowledgeEntity;
    const id = relatedEntityIdArr[i];
    const rel = allRelations.find(
      (r) =>
        (r.sourceId === entity.id && r.targetId === id) ||
        (r.targetId === entity.id && r.sourceId === id),
    );
    relatedEntities.push({
      entity: ent,
      relation: rel?.type || 'relacionado_con',
      strength: rel?.strength || 0,
    });
  }

  relatedEntities.sort((a, b) => b.strength - a.strength);

  return {
    entity,
    timeline: timeline.slice(0, 30),
    relatedEntities: relatedEntities.slice(0, 12),
    newsIds: newsIds.slice(0, 50),
  };
}

/**
 * Lista todas las entidades para un índice público.
 */
export async function listAllEntities(
  db: Firestore,
  limit = 100,
): Promise<KnowledgeEntity[]> {
  const snap = await db
    .collection('kb_entities')
    .orderBy('articleCount', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as unknown as KnowledgeEntity);
}

export async function listEntitiesPaginated(
  db: Firestore,
  page: number,
  pageSize: number,
): Promise<KnowledgeEntity[]> {
  const offset = (page - 1) * pageSize;
  const snap = await db
    .collection('kb_entities')
    .orderBy('articleCount', 'desc')
    .offset(offset)
    .limit(pageSize)
    .get();

  return snap.docs.map((d) => d.data() as unknown as KnowledgeEntity);
}

export async function getEntityCount(db: Firestore): Promise<number> {
  const snap = await db.collection('kb_entities').count().get();
  return snap.data().count;
}

/**
 * Genera JSON-LD schema.org según el tipo de entidad.
 */
export function generateEntitySchema(entity: KnowledgeEntity): Record<string, unknown> {
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    name: entity.name,
    description: entity.description || `${entity.name} — Nicaragua Informate`,
    url: `https://nicaraguainformate.com/entidad/${entity.slug}`,
  };

  switch (entity.type) {
    case 'persona':
      return { ...base, '@type': 'Person' };
    case 'institucion':
    case 'empresa':
    case 'ministerio':
    case 'organizacion':
      return { ...base, '@type': 'Organization' };
    case 'lugar':
    case 'ciudad':
    case 'departamento':
    case 'volcan':
    case 'rio':
    case 'carretera':
    case 'infraestructura':
      return { ...base, '@type': 'Place' };
    case 'evento':
    case 'festival':
      return { ...base, '@type': 'Event' };
    case 'equipo':
      return { ...base, '@type': 'SportsTeam' };
    case 'hospital':
      return { ...base, '@type': 'Hospital' };
    case 'universidad':
      return { ...base, '@type': 'CollegeOrUniversity' };
    case 'ley':
      return { ...base, '@type': 'Legislation' };
    case 'proyecto':
      return { ...base, '@type': 'Project' };
    default:
      return { ...base, '@type': 'Thing' };
  }
}
