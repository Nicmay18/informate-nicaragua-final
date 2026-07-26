/**
 * Case Manager — Sistema de Seguimiento
 * =======================================
 * CRUD de casos de seguimiento editorial en Firestore.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { TrackingCase, CaseUpdate, CaseStatus, CasePriority } from './types';

const COLLECTION = 'seguimiento_cases';
const UPDATES_COLLECTION = 'seguimiento_updates';

function generateCaseId(): string {
  return `case-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateUpdateId(): string {
  return `upd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createCase(
  db: Firestore,
  data: Partial<TrackingCase>,
): Promise<TrackingCase> {
  const now = new Date().toISOString();
  const id = data.id || generateCaseId();

  const trackingCase: TrackingCase = {
    id,
    title: data.title || 'Caso sin título',
    summary: data.summary || '',
    type: data.type || 'general',
    status: data.status || 'abierto',
    priority: data.priority || 'media',
    category: data.category || 'General',
    departamento: data.departamento || '',
    articleIds: data.articleIds || [],
    articleSlugs: data.articleSlugs || [],
    articleCount: data.articleIds?.length || 0,
    entityIds: data.entityIds || [],
    openedAt: data.openedAt || now,
    lastUpdateAt: now,
    lastArticleAt: data.lastArticleAt || null,
    closedAt: null,
    expectedUpdateFrequencyDays: data.expectedUpdateFrequencyDays || 7,
    nextCheckDate: data.nextCheckDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: data.tags || [],
    metadata: data.metadata || {
      keyEntities: [],
      location: '',
      peopleInvolved: [],
      institutionsInvolved: [],
    },
  };

  await db.collection(COLLECTION).doc(id).set(trackingCase as unknown as Record<string, unknown>);
  return trackingCase;
}

export async function updateCase(
  db: Firestore,
  caseId: string,
  updates: Partial<TrackingCase>,
): Promise<void> {
  const ref = db.collection(COLLECTION).doc(caseId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Caso ${caseId} no encontrado`);

  const updateData: Record<string, unknown> = { ...updates, lastUpdateAt: new Date().toISOString() };

  if (updates.status === 'cerrado' || updates.status === 'archivado') {
    updateData.closedAt = new Date().toISOString();
  }

  await ref.update(updateData);
}

export async function addArticleToCase(
  db: Firestore,
  caseId: string,
  articleId: string,
  articleSlug: string,
  articleTitle: string,
  summary: string,
  significant: boolean,
): Promise<CaseUpdate> {
  const ref = db.collection(COLLECTION).doc(caseId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Caso ${caseId} no encontrado`);

  const existing = snap.data() as unknown as TrackingCase;
  const now = new Date().toISOString();

  const articleIds = [...new Set([...(existing.articleIds || []), articleId])];
  const articleSlugs = [...new Set([...(existing.articleSlugs || []), articleSlug])];

  await ref.update({
    articleIds,
    articleSlugs,
    articleCount: articleIds.length,
    lastArticleAt: now,
    lastUpdateAt: now,
    status: existing.status === 'en_pausa' ? 'en_desarrollo' : existing.status,
  });

  const caseUpdate: CaseUpdate = {
    id: generateUpdateId(),
    caseId,
    articleId,
    articleSlug,
    articleTitle,
    updateType: significant ? 'novedad' : 'nuevo_articulo',
    summary,
    timestamp: now,
    significant,
  };

  await db.collection(UPDATES_COLLECTION).doc(caseUpdate.id).set(caseUpdate as unknown as Record<string, unknown>);

  return caseUpdate;
}

export async function closeCase(
  db: Firestore,
  caseId: string,
  closingArticleId?: string,
  closingSummary?: string,
): Promise<void> {
  if (closingArticleId && closingSummary) {
    await addArticleToCase(db, caseId, closingArticleId, '', '', closingSummary, true);
  }

  await updateCase(db, caseId, {
    status: 'cerrado',
    closedAt: new Date().toISOString(),
  });
}

export async function getCase(db: Firestore, caseId: string): Promise<TrackingCase | null> {
  const snap = await db.collection(COLLECTION).doc(caseId).get();
  if (!snap.exists) return null;
  return snap.data() as unknown as TrackingCase;
}

export async function getOpenCases(db: Firestore): Promise<TrackingCase[]> {
  const snap = await db
    .collection(COLLECTION)
    .where('status', 'in', ['abierto', 'en_desarrollo', 'en_pausa'])
    .get();

  return snap.docs.map((d) => d.data() as unknown as TrackingCase);
}

export async function getAllCases(db: Firestore, limit = 100): Promise<TrackingCase[]> {
  const snap = await db
    .collection(COLLECTION)
    .orderBy('lastUpdateAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as unknown as TrackingCase);
}

export async function getCaseUpdates(db: Firestore, caseId: string): Promise<CaseUpdate[]> {
  const snap = await db
    .collection(UPDATES_COLLECTION)
    .where('caseId', '==', caseId)
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();

  return snap.docs.map((d) => d.data() as unknown as CaseUpdate);
}

export async function setCasePriority(
  db: Firestore,
  caseId: string,
  priority: CasePriority,
): Promise<void> {
  await updateCase(db, caseId, { priority });
}

export async function setCaseStatus(
  db: Firestore,
  caseId: string,
  status: CaseStatus,
): Promise<void> {
  await updateCase(db, caseId, { status });
}
