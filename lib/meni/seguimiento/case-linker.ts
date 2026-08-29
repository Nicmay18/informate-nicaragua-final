/**
 * Case Linker — Sistema de Seguimiento
 * ======================================
 * Vincula casos de seguimiento con entidades del Knowledge Graph.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { TrackingCase } from './types';
import { logger } from '@/lib/logger';

/**
 * Busca entidades del Knowledge Graph que coincidan con el texto del artículo
 * y las vincula al caso.
 */
export async function linkCaseToEntities(
  db: Firestore,
  caseId: string,
  title: string,
  content: string,
): Promise<string[]> {
  const fullText = `${title} ${content}`.toLowerCase();

  try {
    const snap = await db.collection('kb_entities').limit(500).get();

    const matchedEntityIds: string[] = [];
    const keyEntities: string[] = [];
    const peopleInvolved: string[] = [];
    const institutionsInvolved: string[] = [];

    for (const doc of snap.docs) {
      const entity = doc.data() as { id: string; name: string; type: string; aliases?: string[] };
      const names = [entity.name, ...(entity.aliases || [])].filter(Boolean);

      const matches = names.some((name) => {
        const n = name.toLowerCase();
        return n.length > 3 && fullText.includes(n);
      });

      if (matches) {
        matchedEntityIds.push(entity.id);
        keyEntities.push(entity.name);

        if (entity.type === 'persona') peopleInvolved.push(entity.name);
        if (entity.type === 'institucion') institutionsInvolved.push(entity.name);
      }
    }

    if (matchedEntityIds.length > 0) {
      const caseRef = db.collection('seguimiento_cases').doc(caseId);
      const caseSnap = await caseRef.get();
      if (caseSnap.exists) {
        const existing = caseSnap.data() as unknown as TrackingCase;
        const mergedEntityIds = [...new Set([...(existing.entityIds || []), ...matchedEntityIds])];
        const mergedKeyEntities = [...new Set([...(existing.metadata.keyEntities || []), ...keyEntities])];
        const mergedPeople = [...new Set([...(existing.metadata.peopleInvolved || []), ...peopleInvolved])];
        const mergedInstitutions = [...new Set([...(existing.metadata.institutionsInvolved || []), ...institutionsInvolved])];

        await caseRef.update({
          entityIds: mergedEntityIds,
          metadata: {
            ...existing.metadata,
            keyEntities: mergedKeyEntities,
            peopleInvolved: mergedPeople,
            institutionsInvolved: mergedInstitutions,
          },
        });
      }
    }

    return matchedEntityIds;
  } catch (err) {
    logger.warn('[case-linker] Error vinculando entidades:', err);
    return [];
  }
}

/**
 * Busca casos abiertos que compartan entidades con un artículo nuevo.
 */
export async function findRelatedCases(
  db: Firestore,
  title: string,
  content: string,
): Promise<TrackingCase[]> {
  const fullText = `${title} ${content}`.toLowerCase();

  try {
    const snap = await db
      .collection('seguimiento_cases')
      .where('status', 'in', ['abierto', 'en_desarrollo', 'en_pausa'])
      .get();

    const related: TrackingCase[] = [];

    for (const doc of snap.docs) {
      const caseItem = doc.data() as unknown as TrackingCase;
      const keyEntities = caseItem.metadata.keyEntities || [];

      const hasMatch = keyEntities.some((entity) => {
        const e = entity.toLowerCase();
        return e.length > 3 && fullText.includes(e);
      });

      if (hasMatch) {
        related.push(caseItem);
      }
    }

    return related;
  } catch {
    return [];
  }
}
