/**
 * Knowledge Health — Estadísticas de salud del Knowledge Graph.
 * Muestra: entidades creadas, huérfanas, noticias sin entidad,
 * entidades más consultadas, temas creciendo/olvidados,
 * cobertura por departamento/institución/persona.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { KnowledgeEntity } from './types';

export interface KnowledgeHealth {
  totalEntities: number;
  totalRelations: number;
  totalTimelineEntries: number;
  entitiesByType: Record<string, number>;
  orphanEntities: KnowledgeEntity[];
  topEntities: KnowledgeEntity[];
  growingTopics: Array<{ name: string; count: number; trend: 'up' | 'stable' }>;
  forgottenTopics: Array<{ name: string; count: number; lastSeen: string }>;
  coverageByDepartamento: Array<{ name: string; count: number }>;
  coverageByInstitucion: Array<{ name: string; count: number }>;
  coverageByPersona: Array<{ name: string; count: number }>;
  noticiasSinEntidad: number;
  totalNoticias: number;
  saludGeneral: 'excelente' | 'buena' | 'regular' | 'deficiente';
}

export async function getKnowledgeHealth(db: Firestore): Promise<KnowledgeHealth> {
  const [entitiesSnap, relationsSnap, timelineSnap, noticiasSnap] = await Promise.all([
    db.collection('kb_entities').get(),
    db.collection('kb_relations').get(),
    db.collection('kb_timeline').get(),
    db.collection('noticias').get(),
  ]);

  const entities: KnowledgeEntity[] = entitiesSnap.docs.map(
    (d) => d.data() as unknown as KnowledgeEntity,
  );

  const entitiesByType: Record<string, number> = {};
  for (const e of entities) {
    entitiesByType[e.type] = (entitiesByType[e.type] || 0) + 1;
  }

  const orphanEntities = entities
    .filter((e) => e.articleCount <= 1)
    .sort((a, b) => a.articleCount - b.articleCount)
    .slice(0, 20);

  const topEntities = [...entities]
    .sort((a, b) => b.articleCount - a.articleCount)
    .slice(0, 20);

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86400000;

  const topicEntities = entities.filter((e) => e.type === 'tema');
  const growingTopics = topicEntities
    .map((e) => ({
      name: e.name,
      count: e.articleCount,
      trend: (new Date(e.lastSeen).getTime() > thirtyDaysAgo ? 'up' : 'stable') as 'up' | 'stable',
    }))
    .filter((t) => t.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const forgottenTopics = topicEntities
    .filter((e) => new Date(e.lastSeen).getTime() < thirtyDaysAgo && e.articleCount >= 3)
    .map((e) => ({
      name: e.name,
      count: e.articleCount,
      lastSeen: e.lastSeen,
    }))
    .sort((a, b) => new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime())
    .slice(0, 10);

  const coverageByDepartamento = entities
    .filter((e) => e.type === 'lugar' || e.type === 'departamento' || e.type === 'ciudad')
    .map((e) => ({ name: e.name, count: e.articleCount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const coverageByInstitucion = entities
    .filter((e) => e.type === 'institucion' || e.type === 'ministerio' || e.type === 'hospital')
    .map((e) => ({ name: e.name, count: e.articleCount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const coverageByPersona = entities
    .filter((e) => e.type === 'persona')
    .map((e) => ({ name: e.name, count: e.articleCount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const timelineArticleIds = new Set(
    timelineSnap.docs.map((d) => (d.data() as { articleId: string }).articleId),
  );
  const noticiasConEntidad = noticiasSnap.docs.filter((d) =>
    timelineArticleIds.has(d.id),
  ).length;
  const noticiasSinEntidad = noticiasSnap.size - noticiasConEntidad;
  const totalNoticias = noticiasSnap.size;

  const coverageRatio = totalNoticias > 0 ? noticiasConEntidad / totalNoticias : 0;
  let saludGeneral: KnowledgeHealth['saludGeneral'] = 'deficiente';
  if (coverageRatio > 0.8 && entities.length > 50) saludGeneral = 'excelente';
  else if (coverageRatio > 0.6 && entities.length > 30) saludGeneral = 'buena';
  else if (coverageRatio > 0.4) saludGeneral = 'regular';

  return {
    totalEntities: entities.length,
    totalRelations: relationsSnap.size,
    totalTimelineEntries: timelineSnap.size,
    entitiesByType,
    orphanEntities,
    topEntities,
    growingTopics,
    forgottenTopics,
    coverageByDepartamento,
    coverageByInstitucion,
    coverageByPersona,
    noticiasSinEntidad,
    totalNoticias,
    saludGeneral,
  };
}
