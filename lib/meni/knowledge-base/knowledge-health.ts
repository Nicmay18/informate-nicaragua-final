/**
 * Knowledge Health — Estadísticas de salud del Knowledge Graph.
 * Muestra: entidades creadas, huérfanas, noticias sin entidad,
 * entidades más consultadas, temas creciendo/olvidados,
 * cobertura por departamento/institución/persona.
 *
 * Arquitectura v2 (scalable):
 *   - Primero intenta leer snapshot diario desde kb_health_daily/{date}
 *   - Si no existe, recalcula en vivo y guarda snapshot
 *   - Usa count() en lugar de get() donde es posible
 *   - Agrega limit() para prevenir lecturas sin límite
 */

import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import type { KnowledgeEntity } from './types';

const HEALTH_COLLECTION = 'kb_health_daily';

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

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Intenta leer el snapshot de salud desde Firestore.
 * Devuelve null si no existe o está stale (>24h).
 */
async function getCachedHealth(db: Firestore): Promise<KnowledgeHealth | null> {
  try {
    const date = todayKey();
    const doc = await db.collection(HEALTH_COLLECTION).doc(date).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;
    // Verificar frescura: generado en las últimas 24h
    const generatedAt = new Date(data.generatedAt).getTime();
    if (Date.now() - generatedAt > 24 * 60 * 60 * 1000) return null;
    logger.info('[knowledge-health] Using cached snapshot from', date);
    return data as unknown as KnowledgeHealth;
  } catch {
    return null;
  }
}

/**
 * Guarda el snapshot de salud en Firestore.
 */
async function saveHealthSnapshot(db: Firestore, health: KnowledgeHealth): Promise<void> {
  try {
    const date = todayKey();
    await db.collection(HEALTH_COLLECTION).doc(date).set({
      ...health,
      generatedAt: new Date().toISOString(),
    });
    logger.info('[knowledge-health] Saved snapshot for', date);
  } catch (err) {
    logger.warn('[knowledge-health] Failed to save snapshot:', err);
  }
}

/**
 * Calcula la salud del Knowledge Graph en vivo.
 * Usa count() y limit() para minimizar lecturas.
 */
async function computeHealthLive(db: Firestore): Promise<KnowledgeHealth> {
  const [entitiesSnap, relationsCountSnap, timelineCountSnap, noticiasCountSnap] = await Promise.all([
    db.collection('kb_entities').limit(5000).get(),
    db.collection('kb_relations').count().get(),
    db.collection('kb_timeline').count().get(),
    db.collection('noticias').count().get(),
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

  const totalNoticias = noticiasCountSnap.data().count;
  const totalTimelineEntries = timelineCountSnap.data().count;
  const totalRelations = relationsCountSnap.data().count;

  // Para calcular noticiasSinEntidad, usar timeline sample en lugar de full scan
  const timelineSampleSnap = await db
    .collection('kb_timeline')
    .select('articleId')
    .limit(5000)
    .get();
  const timelineArticleIds = new Set(
    timelineSampleSnap.docs.map((d) => (d.data() as { articleId: string }).articleId),
  );
  // Estimación: si tenemos más timeline entries que el sample, usar proporción
  const coverageRatio = totalNoticias > 0
    ? Math.min(timelineArticleIds.size / totalNoticias, 1)
    : 0;
  const noticiasConEntidad = Math.round(coverageRatio * totalNoticias);
  const noticiasSinEntidad = totalNoticias - noticiasConEntidad;

  let saludGeneral: KnowledgeHealth['saludGeneral'] = 'deficiente';
  if (coverageRatio > 0.8 && entities.length > 50) saludGeneral = 'excelente';
  else if (coverageRatio > 0.6 && entities.length > 30) saludGeneral = 'buena';
  else if (coverageRatio > 0.4) saludGeneral = 'regular';

  return {
    totalEntities: entities.length,
    totalRelations,
    totalTimelineEntries,
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

/**
 * Obtiene la salud del Knowledge Graph.
 * Primero intenta snapshot diario, luego recalcula en vivo.
 */
export async function getKnowledgeHealth(db: Firestore): Promise<KnowledgeHealth> {
  const cached = await getCachedHealth(db);
  if (cached) return cached;

  logger.info('[knowledge-health] No cached snapshot, computing live...');
  const health = await computeHealthLive(db);
  await saveHealthSnapshot(db, health);
  return health;
}
