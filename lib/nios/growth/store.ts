/**
 * NIOS v5 — Growth Store
 * ======================
 * Persistencia de acciones de crecimiento en Firestore.
 * Colección: nios_actions
 */

import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type {
  GrowthAction,
  GrowthActionPayload,
  GrowthMetrics,
  GrowthOpportunity,
  GrowthLearning,
} from './types';
import type { ArticleFusion, DailySnapshot } from '@/lib/nios/intelligence/types';

function collection(db: Firestore) {
  return db.collection('nios_actions');
}

function now() {
  return new Date().toISOString();
}

function toFirestoreDoc(action: GrowthAction): Record<string, unknown> {
  // Sanitiza undefined/funciones.
  return JSON.parse(JSON.stringify(action)) as Record<string, unknown>;
}

export function buildMetricsFromArticle(article: ArticleFusion, source: 'snapshot' | 'live' = 'snapshot'): GrowthMetrics {
  return {
    impressions: article.gscImpressions ?? 0,
    clicks: article.gscClicks ?? 0,
    ctr: article.gscCtr ?? 0,
    position: article.gscPosition ?? 0,
    users: article.ga4Users ?? 0,
    sessions: article.ga4Sessions ?? 0,
    pageviews: article.ga4Pageviews ?? 0,
    engagementRate: article.ga4EngagementRate ?? 0,
    avgEngagementTimeSec: article.ga4AvgEngagementTimeSec ?? 0,
    capturedAt: now(),
    source,
  };
}

export function buildMetricsFromSnapshot(
  slug: string,
  snapshot: DailySnapshot | null,
  source: 'snapshot' | 'live' = 'snapshot',
): GrowthMetrics | null {
  const article = snapshot?.articlesFused?.find((a) => a.slug === slug);
  if (!article) return null;
  return buildMetricsFromArticle(article, source);
}

function buildPayload(opportunity: GrowthOpportunity): GrowthActionPayload {
  const p: GrowthActionPayload = {};
  const title = opportunity.target.title ?? opportunity.target.query ?? '';
  const url = opportunity.target.url ?? '';

  switch (opportunity.kind) {
    case 'distribution-recirculation':
    case 'distribution-second-push':
    case 'distribution-telegram':
      p.preparedCopy = `${title}\n\nLeer más: ${url}`;
      p.distributionChannels = ['Telegram', 'Facebook'];
      break;
    case 'seo-ctr-title':
    case 'seo-title-experiment':
      p.experimentHypothesis = `Mejorar el título de "${title}" para la consulta "${opportunity.target.query ?? ''}" podría aumentar el CTR.`;
      p.proposedTitle = `Sugerencia: incluir "${opportunity.target.query ?? title}" en el título.`;
      break;
    case 'seo-strike-zone':
      p.evergreenBrief = `Añadir sección H2 que responda a "${opportunity.target.query ?? ''}".`;
      break;
    case 'content-update':
    case 'recovery-position-drop':
      p.updateNotes = `Actualizar fechas, datos y contexto de "${title}". Verificar enlaces.`;
      break;
    case 'content-evergreen':
      p.evergreenBrief = `Crear guía derivada de "${title}" para captar tráfico recurrente.`;
      break;
    case 'content-related':
      p.suggestedLinks = [];
      break;
    default:
      p.updateNotes = opportunity.recommendedAction;
  }
  return p;
}

export function computeLearning(baseline: GrowthMetrics, after: GrowthMetrics): GrowthLearning {
  const fields: (keyof GrowthMetrics)[] = ['impressions', 'clicks', 'ctr', 'position', 'users', 'sessions', 'pageviews', 'engagementRate', 'avgEngagementTimeSec'];
  const absoluteChange: Record<string, number | null> = {};
  const percentChange: Record<string, number | null> = {};

  let ups = 0;
  let downs = 0;
  let flats = 0;

  for (const key of fields) {
    const beforeVal = baseline[key] as number;
    const afterVal = after[key] as number;
    if (typeof beforeVal !== 'number' || typeof afterVal !== 'number' || Number.isNaN(beforeVal) || Number.isNaN(afterVal)) {
      absoluteChange[key] = null;
      percentChange[key] = null;
      continue;
    }
    absoluteChange[key] = Math.round((afterVal - beforeVal) * 100) / 100;
    if (beforeVal === 0) {
      percentChange[key] = afterVal === 0 ? 0 : null;
    } else {
      percentChange[key] = Math.round(((afterVal - beforeVal) / beforeVal) * 1000) / 10;
    }
    const delta = afterVal - beforeVal;
    if (Math.abs(delta) < 0.001 * Math.max(1, Math.abs(beforeVal))) flats++;
    else if (delta > 0) ups++;
    else downs++;
  }

  const trend = ups > downs ? 'up' : downs > ups ? 'down' : 'flat';
  let result: GrowthLearning['result'] = 'INCONCLUSIVE';
  if (ups > 0 && downs === 0) result = 'SUCCESS';
  else if (downs > 0 && ups === 0) result = 'FAILURE';

  const observation =
    trend === 'up'
      ? 'Las métricas relevantes muestran una tendencia positiva después de la acción.'
      : trend === 'down'
        ? 'Las métricas relevantes muestran una tendencia negativa; revisar la acción.'
        : 'No se observa cambio significativo en las métricas. Puede deberse a poco tiempo transcurrido.';

  const learning =
    result === 'SUCCESS'
      ? 'La acción parece haber funcionado. Antes de declarar causalidad, replicar en artículos similares.'
      : result === 'FAILURE'
        ? 'La acción no mostró mejora. Revisar hipótesis y probar variante diferente.'
        : 'Se necesita más tiempo o más volumen para aprender. Repetir medición en la próxima ventana.';

  const nextAction =
    result === 'SUCCESS'
      ? 'Replicar en artículos con misma señal.'
      : result === 'FAILURE'
        ? 'Ajustar la acción y volver a medir.'
        : 'Esperar la siguiente ventana de medición.';

  return {
    result,
    observation,
    absoluteChange,
    percentChange,
    trend,
    learning,
    confidence: result === 'INCONCLUSIVE' ? 'baja' : 'media',
    nextAction,
  };
}

export async function prepareGrowthAction(
  db: Firestore,
  opportunity: GrowthOpportunity,
  baseline: GrowthMetrics,
  requestedBy?: string,
): Promise<GrowthAction> {
  const action: GrowthAction = {
    id: '',
    status: 'PREPARED',
    kind: opportunity.kind,
    category: opportunity.category,
    opportunityId: opportunity.id,
    articleSlug: opportunity.target.slug,
    articleTitle: opportunity.target.title,
    articleUrl: opportunity.target.url,
    query: opportunity.target.query,
    baseline,
    preparedAt: now(),
    actionTaken: opportunity.recommendedAction,
    payload: buildPayload(opportunity),
    createdAt: now(),
    updatedAt: now(),
    requestedBy,
    nextMeasurementAt: new Date(Date.now() + opportunity.measurementWindowHours * 60 * 60 * 1000).toISOString(),
  };

  const ref = collection(db).doc();
  action.id = ref.id;
  await ref.set(toFirestoreDoc(action));
  logger.info('[growth-store] prepared action', { actionId: action.id, kind: action.kind, slug: action.articleSlug });
  return action;
}

export async function approveGrowthAction(db: Firestore, actionId: string): Promise<GrowthAction | null> {
  const ref = collection(db).doc(actionId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as unknown as GrowthAction;
  if (data.status !== 'PREPARED' && data.status !== 'PENDING') return data;

  const updated: GrowthAction = {
    ...data,
    status: 'APPROVED',
    approvedAt: now(),
    updatedAt: now(),
  };
  await ref.set(toFirestoreDoc(updated), { merge: true });
  return updated;
}

export async function runGrowthAction(db: Firestore, actionId: string): Promise<GrowthAction | null> {
  const ref = collection(db).doc(actionId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as unknown as GrowthAction;
  if (data.status !== 'APPROVED' && data.status !== 'PREPARED') return data;

  // SAFE execution: solo "preparar". Cualquier cambio público requiere humano.
  const status: GrowthAction['status'] =
    data.kind.startsWith('distribution') && data.payload.distributionChannels ? 'QUEUED' : 'RUNNING';

  const updated: GrowthAction = {
    ...data,
    status,
    executedAt: now(),
    updatedAt: now(),
  };
  await ref.set(toFirestoreDoc(updated), { merge: true });
  logger.info('[growth-store] executed action', { actionId, status });
  return updated;
}

export async function measureGrowthAction(
  db: Firestore,
  actionId: string,
  snapshot: DailySnapshot | null,
): Promise<GrowthAction | null> {
  const ref = collection(db).doc(actionId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as unknown as GrowthAction;
  if (!data.articleSlug) return data;

  const after = buildMetricsFromSnapshot(data.articleSlug, snapshot, 'snapshot');
  if (!after) {
    const updated: GrowthAction = { ...data, errorMessage: 'No se encontró el artículo en el snapshot actual.', updatedAt: now() };
    await ref.set(toFirestoreDoc(updated), { merge: true });
    return updated;
  }

  const learning = computeLearning(data.baseline, after);
  const updated: GrowthAction = {
    ...data,
    after,
    learning,
    measuredAt: now(),
    updatedAt: now(),
    status: learning.result === 'SUCCESS' ? 'COMPLETED' : 'RUNNING',
  };
  await ref.set(toFirestoreDoc(updated), { merge: true });
  logger.info('[growth-store] measured action', { actionId, result: learning.result });
  return updated;
}

export async function listGrowthActions(
  db: Firestore,
  options: { status?: string; limit?: number } = {},
): Promise<GrowthAction[]> {
  let q = collection(db).orderBy('createdAt', 'desc');
  if (options.status) {
    q = q.where('status', '==', options.status) as typeof q;
  }
  const snap = await q.limit(options.limit ?? 50).get();
  return snap.docs.map((d) => d.data() as unknown as GrowthAction);
}

export { getAdminDb };
