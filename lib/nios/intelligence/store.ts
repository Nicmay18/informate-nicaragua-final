/**
 * NIOS Intelligence Platform — Firestore Store (Scalable)
 * =========================================================
 * Persiste snapshots diarios en Firestore.
 *
 * Arquitectura v2 (scalable):
 *   nios_daily_snapshots/{date}                    → metadata + reportes ligeros (<900KB)
 *   nios_daily_snapshots/{date}/articles/{slug}    → 1 doc por artículo
 *   nios_daily_snapshots/{date}/reports/{name}     → 1 doc por reporte FASE 2/3
 *
 * Backward compatibility:
 *   - Si articlesFused existe inline (snapshots viejos), se usa directamente.
 *   - Si no existe inline, se carga desde subcolección /articles.
 *   - Mismo fallback para reportes.
 *
 * Colección: nios_daily_snapshots
 * Documento ID: {YYYY-MM-DD}
 * Nunca sobrescribe datos históricos.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import type { DailySnapshot, ArticleFusion } from './types';

const COLLECTION = 'nios_daily_snapshots';
const ARTICLES_SUBCOLLECTION = 'articles';
const REPORTS_SUBCOLLECTION = 'reports';
const SNAPSHOT_VERSION = '2.1';

function removeUndefined(obj: unknown): unknown {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) out[k] = removeUndefined(v);
  }
  return out;
}

const REPORT_KEYS = [
  'compliance',
  'readiness',
  'trust',
  'contentRecovery',
  'adSenseRecoveryFullReport',
  'contentOpportunity',
  'categoryIntelligence',
  'contentMix',
  'articleUpdate',
  'editorCEOReport',
  'meniLearning',
  'trafficPerformance',
] as const;

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Guarda el snapshot diario en Firestore.
 * Estrategia dual-write: metadata inline + articles en subcolección.
 * Si ya existe para hoy, no sobrescribe (preserva histórico).
 */
export async function saveDailySnapshot(
  db: Firestore,
  snapshot: Omit<DailySnapshot, 'date'>,
): Promise<string> {
  const date = todayKey();
  const docRef = db.collection(COLLECTION).doc(date);

  const existing = await docRef.get();
  if (existing.exists) {
    logger.warn(`[nios-store] Snapshot for ${date} already exists. Skipping to preserve history.`);
    return date;
  }

  const articles = snapshot.articlesFused || [];
  const articlesCount = articles.length;

  // Separar reportes para subcolección
  const reportsToSave: Array<{ key: string; data: unknown }> = [];

  for (const key of REPORT_KEYS) {
    const reportData = (snapshot as Record<string, unknown>)[key];
    if (reportData !== null && reportData !== undefined) {
      reportsToSave.push({ key, data: reportData });
    }
  }

  // Documento principal: metadata + datos ligeros
  // Los reportes grandes se guardan en subcolección para no exceder 1MB
  const inlinePayload: Record<string, unknown> = removeUndefined({
    date,
    version: SNAPSHOT_VERSION,
    collectedAt: snapshot.collectedAt,
    gsc: snapshot.gsc,
    ga4: snapshot.ga4,
    recommendations: snapshot.recommendations,
    learningPatterns: snapshot.learningPatterns,
    articlesCount,
  }) as Record<string, unknown>;

  // Dual-write: incluir articlesFused inline solo si cabe seguro en 1MB
  const articlesClean = removeUndefined(articles);
  const articlesJsonSize = JSON.stringify(articlesClean).length;
  const maxArticlesInline = 50;
  if (articlesCount <= maxArticlesInline && articlesJsonSize < 300_000) {
    inlinePayload.articlesFused = articlesClean;
  }

  await docRef.set(inlinePayload);

  // Guardar articles en subcolección (siempre, para habilitar fallback)
  if (articles.length > 0) {
    const articlesBatch = db.batch();
    for (const article of articles) {
      const slug = article.slug || Math.random().toString(36).slice(2);
      const articleRef = docRef.collection(ARTICLES_SUBCOLLECTION).doc(slug);
      articlesBatch.set(articleRef, removeUndefined(article));
    }
    await articlesBatch.commit();
    logger.info(`[nios-store] Saved ${articles.length} articles to subcollection for ${date}`);
  }

  // Guardar reportes en subcolección
  if (reportsToSave.length > 0) {
    const reportsBatch = db.batch();
    for (const { key, data } of reportsToSave) {
      const reportRef = docRef.collection(REPORTS_SUBCOLLECTION).doc(key);
      reportsBatch.set(reportRef, removeUndefined({ key, data }));
    }
    await reportsBatch.commit();
    logger.info(`[nios-store] Saved ${reportsToSave.length} reports to subcollection for ${date}`);
  }

  logger.info(`[nios-store] Saved daily snapshot for ${date} (${articlesCount} articles)`);
  return date;
}

/**
 * Reensambla un DailySnapshot completo desde documento + subcolecciones.
 * Si el documento ya tiene articlesFused inline, lo usa directamente.
 */
async function assembleSnapshot(
  db: Firestore,
  docSnap: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Promise<DailySnapshot | null> {
  const data = docSnap.data();
  if (!data) return null;

  // Fast path: articlesFused existe inline (snapshots viejos o <400 art)
  if (data.articlesFused && Array.isArray(data.articlesFused) && data.articlesFused.length > 0) {
    return data as unknown as DailySnapshot;
  }

  // Fallback: cargar articles desde subcolección
  const date = data.date as string;
  const docRef = db.collection(COLLECTION).doc(date);

  const [articlesSnap, reportsSnap] = await Promise.all([
    docRef.collection(ARTICLES_SUBCOLLECTION).get(),
    docRef.collection(REPORTS_SUBCOLLECTION).get(),
  ]);

  const articlesFused: ArticleFusion[] = articlesSnap.docs.map(
    (d) => d.data() as unknown as ArticleFusion,
  );

  // Reconstruir reportes desde subcolección
  const reportData: Record<string, unknown> = {};
  for (const doc of reportsSnap.docs) {
    const rd = doc.data();
    if (rd.key && rd.data !== undefined) {
      reportData[rd.key] = rd.data;
    }
  }

  return {
    date: data.date,
    collectedAt: data.collectedAt,
    version: data.version || SNAPSHOT_VERSION,
    articlesCount: data.articlesCount ?? articlesFused.length,
    gsc: data.gsc || null,
    ga4: data.ga4 || null,
    articlesFused,
    recommendations: data.recommendations || [],
    compliance: reportData.compliance || data.compliance || null,
    readiness: reportData.readiness || data.readiness || null,
    trust: reportData.trust || data.trust || null,
    learningPatterns: data.learningPatterns || [],
    contentRecovery: reportData.contentRecovery || data.contentRecovery || null,
    adSenseRecoveryFullReport: reportData.adSenseRecoveryFullReport || data.adSenseRecoveryFullReport || null,
    contentOpportunity: reportData.contentOpportunity || data.contentOpportunity || null,
    categoryIntelligence: reportData.categoryIntelligence || data.categoryIntelligence || null,
    contentMix: reportData.contentMix || data.contentMix || null,
    articleUpdate: reportData.articleUpdate || data.articleUpdate || null,
    editorCEOReport: reportData.editorCEOReport || data.editorCEOReport || null,
    meniLearning: reportData.meniLearning || data.meniLearning || null,
    trafficPerformance: reportData.trafficPerformance || data.trafficPerformance || null,
  } as unknown as DailySnapshot;
}

/**
 * Obtiene el snapshot más reciente.
 */
export async function getLatestSnapshot(db: Firestore): Promise<DailySnapshot | null> {
  const snap = await db
    .collection(COLLECTION)
    .orderBy('date', 'desc')
    .limit(1)
    .get();

  if (snap.empty) return null;
  return assembleSnapshot(db, snap.docs[0]);
}

/**
 * Obtiene snapshots históricos para comparación.
 * Usa solo metadata inline (sin cargar articles de subcolecciones) para eficiencia.
 */
export async function getHistoricalSnapshots(
  db: Firestore,
  days: number,
): Promise<DailySnapshot[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const snap = await db
    .collection(COLLECTION)
    .where('date', '>=', cutoff)
    .orderBy('date', 'desc')
    .limit(days)
    .get();

  // Para históricos, devolver metadata inline directamente (sin ensamblar articles)
  return snap.docs.map((d) => d.data() as unknown as DailySnapshot);
}

/**
 * Obtiene un snapshot por fecha específica.
 */
export async function getSnapshotByDate(db: Firestore, date: string): Promise<DailySnapshot | null> {
  const doc = await db.collection(COLLECTION).doc(date).get();
  if (!doc.exists) return null;
  return assembleSnapshot(db, doc);
}

/**
 * Verifica cuántos días de datos históricos existen.
 */
export async function getHistoricalDataDays(db: Firestore): Promise<number> {
  const snap = await db.collection(COLLECTION).orderBy('date', 'desc').limit(365).get();
  return snap.size;
}
