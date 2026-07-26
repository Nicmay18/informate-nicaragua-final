/**
 * Relation Builder — Construye relaciones entre entidades extraídas de un mismo artículo.
 * Las relaciones son aristas del grafo de conocimiento.
 */

import type { KnowledgeRelation, RelationType } from './types';
import type { ExtractedEntity } from './entity-extractor';

function relationId(sourceId: string, targetId: string, type: RelationType): string {
  return `${sourceId}__${targetId}__${type}`;
}

function inferRelation(
  source: ExtractedEntity,
  target: ExtractedEntity,
): RelationType | null {
  if (source.id === target.id) return null;

  if (source.type === 'persona' && target.type === 'institucion') {
    return 'pertenece_a';
  }

  if (source.type === 'tema' && target.type === 'lugar') {
    return 'ocurrio_en';
  }

  if (source.type === 'institucion' && target.type === 'lugar') {
    return 'relacionado_con';
  }

  if (source.type === 'categoria' && target.type === 'tema') {
    return 'categorizado_como';
  }

  if (source.type === 'lugar' && target.type === 'lugar') {
    return 'relacionado_con';
  }

  if (source.type === 'persona' && target.type === 'persona') {
    return 'mencionado_junto';
  }

  if (source.type === 'institucion' && target.type === 'institucion') {
    return 'mencionado_junto';
  }

  return 'mencionado_junto';
}

export function buildRelations(
  entities: ExtractedEntity[],
  articleId: string,
  articleDate: string,
): KnowledgeRelation[] {
  const relations: KnowledgeRelation[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const source = entities[i];
      const target = entities[j];

      const type = inferRelation(source, target);
      if (!type) continue;

      const id = relationId(source.id, target.id, type);
      if (seen.has(id)) continue;
      seen.add(id);

      relations.push({
        id,
        sourceId: source.id,
        targetId: target.id,
        type,
        strength: 1,
        articleIds: [articleId],
        lastSeen: articleDate,
      });

      const reverseType = inferRelation(target, source);
      if (reverseType && reverseType !== type) {
        const reverseId = relationId(target.id, source.id, reverseType);
        if (!seen.has(reverseId)) {
          seen.add(reverseId);
          relations.push({
            id: reverseId,
            sourceId: target.id,
            targetId: source.id,
            type: reverseType,
            strength: 1,
            articleIds: [articleId],
            lastSeen: articleDate,
          });
        }
      }
    }
  }

  return relations;
}

export function mergeRelations(
  existing: KnowledgeRelation[],
  incoming: KnowledgeRelation[],
): { created: KnowledgeRelation[]; updated: Array<{ existing: KnowledgeRelation; incoming: KnowledgeRelation }> } {
  const existingMap = new Map(existing.map((r) => [r.id, r]));
  const created: KnowledgeRelation[] = [];
  const updated: Array<{ existing: KnowledgeRelation; incoming: KnowledgeRelation }> = [];

  for (const inc of incoming) {
    const ex = existingMap.get(inc.id);
    if (ex) {
      updated.push({
        existing: ex,
        incoming: {
          ...ex,
          strength: ex.strength + 1,
          articleIds: [...new Set([...ex.articleIds, ...inc.articleIds])].slice(-50),
          lastSeen: inc.lastSeen > ex.lastSeen ? inc.lastSeen : ex.lastSeen,
        },
      });
    } else {
      created.push(inc);
    }
  }

  return { created, updated };
}
