/**
 * NIOS Action Engine
 * ==================
 * Convierte oportunidades en acciones aprobadas, ejecutadas, medidas y aprendidas.
 * No ejecuta cambios editoriales sensibles sin aprobación humana.
 */

import { getAdminDb } from '@/lib/firebase-admin';
import { getNewsBySlug } from '@/lib/data';
import { logger } from '@/lib/logger';
import type { NiosGrowthOpportunity } from './nios-growth-radar';

export type NiosActionStatus = 'PENDING' | 'APPROVED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export interface NiosAction {
  id: string;
  actionId: string;
  opportunityId: string;
  articleId?: string | null;
  target: string;
  kind: NiosGrowthOpportunity['kind'];
  title: string;
  evidence: string;
  proposal: string;
  objective: string;
  metric: string;
  impact: 'Alto' | 'Medio' | 'Bajo';
  confidence: 'Alta' | 'Media' | 'Baja';
  status: NiosActionStatus;
  source: 'nios-growth-radar';
  createdAt: string;
  proposedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  executedAt?: string;
  completedAt?: string;
  failedAt?: string;
  measureAt?: string;
  user?: string | null;
  rejectionReason?: string | null;
  error?: string | null;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  result?: Record<string, unknown>;
  learning?: string | null;
}

function db() {
  return getAdminDb();
}

function todayStart(): string {
  return new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
}

function safeId(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function makeOpportunityId(kind: string, target: string): string {
  return `${kind}-${safeId(target)}-${new Date().toISOString().slice(0, 10)}`;
}

function metricFor(kind: NiosGrowthOpportunity['kind']): string {
  return kind === 'seo-query' || kind === 'seo-page'
    ? 'CTR, clics y posición durante las próximas 72 horas'
    : 'Vistas, sesiones y alcance durante las próximas 72 horas';
}

function titleForMetric(kind: NiosGrowthOpportunity['kind'], title: string): string {
  if (kind === 'content-recirculation') return `Recircular en Telegram: ${title.replace(/^Recircular "/, '').replace(/"$/, '')}`;
  if (kind === 'content-momentum') return `Impulsar en Telegram: ${title.replace(/^Impulsar "/, '').replace(/"$/, '')}`;
  return title;
}

async function findExistingProposal(opportunityId: string): Promise<NiosAction | null> {
  try {
    const snap = await db().collection('nios_actions').where('opportunityId', '==', opportunityId).limit(5).get();
    const candidates = snap.docs
      .map((d) => d.data() as NiosAction)
      .filter((a) => a.proposedAt >= todayStart() && a.status !== 'REJECTED')
      .sort((a, b) => b.proposedAt.localeCompare(a.proposedAt));
    return candidates[0] || null;
  } catch (err) {
    logger.error('[action-engine] Error buscando acción existente:', err);
    return null;
  }
}

export async function proposeActionsFromOpportunities(opportunities: NiosGrowthOpportunity[]): Promise<NiosAction[]> {
  const actions: NiosAction[] = [];

  for (const o of opportunities.slice(0, 5)) {
    const opportunityId = makeOpportunityId(o.kind, o.target);
    const existing = await findExistingProposal(opportunityId);

    if (existing) {
      actions.push(existing);
      continue;
    }

    const now = new Date().toISOString();
    const ref = db().collection('nios_actions').doc();
    const action: NiosAction = {
      id: ref.id,
      actionId: ref.id,
      opportunityId,
      articleId: null,
      target: o.target,
      kind: o.kind,
      title: titleForMetric(o.kind, o.title),
      evidence: o.evidence,
      proposal: o.action,
      objective: o.expectedResult,
      metric: metricFor(o.kind),
      impact: o.impact,
      confidence: o.confidence,
      status: 'PENDING',
      source: 'nios-growth-radar',
      createdAt: now,
      proposedAt: now,
      before: o.before || {},
      after: {},
      result: {},
      user: null,
      rejectionReason: null,
      error: null,
      learning: null,
    };

    await ref.set(action);
    actions.push(action);
  }

  return actions;
}

export async function getAction(id: string): Promise<NiosAction | null> {
  const snap = await db().collection('nios_actions').doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as NiosAction;
}

export async function getActions(limit = 50): Promise<NiosAction[]> {
  const snap = await db().collection('nios_actions').orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map((d) => d.data() as NiosAction);
}

export async function approveAndExecuteAction(actionId: string, user?: string): Promise<NiosAction> {
  const ref = db().collection('nios_actions').doc(actionId);
  const now = new Date().toISOString();
  await ref.update({ status: 'APPROVED', approvedAt: now, user: user || null });

  await ref.update({ status: 'RUNNING', executedAt: now });

  try {
    const action = (await ref.get()).data() as NiosAction;
    const { after, result } = await executeActionInFirestore(action);
    const completedAt = new Date().toISOString();
    const measureAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    await ref.update({ status: 'COMPLETED', completedAt, measureAt, after, result });
    return (await ref.get()).data() as NiosAction;
  } catch (err) {
    const failedAt = new Date().toISOString();
    const message = err instanceof Error ? err.message : String(err);
    await ref.update({ status: 'FAILED', failedAt, error: message });
    logger.error('[action-engine] Ejecución fallida:', { actionId, error: message });
    return (await ref.get()).data() as NiosAction;
  }
}

export async function rejectAction(actionId: string, reason?: string, user?: string): Promise<NiosAction> {
  const ref = db().collection('nios_actions').doc(actionId);
  const now = new Date().toISOString();
  await ref.update({
    status: 'REJECTED',
    rejectedAt: now,
    user: user || null,
    rejectionReason: reason || null,
  });

  // Guardar rechazo como memoria para no insistir
  await db().collection('nios_memory').add({
    kind: 'rejected_action',
    actionId,
    reason: reason || null,
    timestamp: now,
  });

  return (await ref.get()).data() as NiosAction;
}

async function executeActionInFirestore(action: NiosAction): Promise<{ after: Record<string, unknown>; result: Record<string, unknown> }> {
  if (action.kind === 'content-recirculation' || action.kind === 'content-momentum') {
    const slug = action.target;
    const article = await getNewsBySlug(slug);
    if (!article) throw new Error(`No se encontró el artículo ${slug}`);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nicaragua-informate.com';
    const url = `${siteUrl}/noticias/${article.slug}`;
    const preparedCopy =
      action.kind === 'content-momentum'
        ? `🔥 Tendencia en Nicaragua Informate\n\n${article.titulo}\n\n${(article.resumen || '').slice(0, 120)}...\n\n👉 ${url}`
        : `🔄 Volver a leer: ${article.titulo}\n\n${(article.resumen || '').slice(0, 120)}...\n\n👉 ${url}`;

    const queueRef = await db().collection('nios_distribution_queue').add({
      actionId: action.id,
      articleId: article.id,
      slug: article.slug,
      title: article.titulo,
      message: preparedCopy,
      channel: 'telegram',
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    });

    return {
      after: {
        articleId: article.id,
        slug: article.slug,
        titulo: article.titulo,
        preparedCopy,
        distributionQueueId: queueRef.id,
      },
      result: {
        queueId: queueRef.id,
        channel: 'telegram',
        status: 'pending_review',
        note: 'Copia preparada para revisión humana. No se publicó automáticamente.',
      },
    };
  }

  if (action.kind === 'seo-page') {
    const slug = (action.before.slug as string) || action.target.split('/').pop() || action.target;
    const article = await getNewsBySlug(slug);
    const originalTitle = article ? article.titulo : (action.before.title || action.title);
    const originalMeta = article ? (article.resumen || '').slice(0, 160) : '';

    const experimentRef = await db().collection('nios_seo_experiments').add({
      actionId: action.id,
      articleId: article?.id || null,
      slug: article?.slug || slug,
      url: action.target,
      originalTitle,
      originalMeta,
      query: null,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    });

    return {
      after: {
        articleId: article?.id || null,
        slug: article?.slug || slug,
        originalTitle,
        originalMeta,
        experimentId: experimentRef.id,
      },
      result: {
        experimentId: experimentRef.id,
        status: 'pending_review',
        note: article
          ? 'Propuesta de título/meta preparada. Requiere revisión humana.'
          : 'URL identificada. Se preparó experimento, pero el artículo no coincide con la base de datos.',
      },
    };
  }

  if (action.kind === 'seo-query') {
    const query = action.target;
    const experimentRef = await db().collection('nios_seo_experiments').add({
      actionId: action.id,
      articleId: null,
      slug: null,
      url: null,
      query,
      originalTitle: null,
      originalMeta: null,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    });

    return {
      after: {
        query,
        impressions: action.before.impressions,
        clicks: action.before.clicks,
        ctr: action.before.ctr,
        experimentId: experimentRef.id,
      },
      result: {
        experimentId: experimentRef.id,
        status: 'pending_review',
        note: 'Experimento SEO preparado. Identificar el artículo rankeado y proponer título/meta.',
      },
    };
  }

  throw new Error(`Tipo de acción no ejecutable: ${action.kind}`);
}

export async function recordActionResult(actionId: string, after: Record<string, unknown>): Promise<NiosAction | null> {
  const ref = db().collection('nios_actions').doc(actionId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const action = snap.data() as NiosAction;
  const beforeMetric = (action.before.clicks || 0) as number;
  const afterMetric = (after.clicks || 0) as number;
  const delta = beforeMetric > 0 ? (afterMetric - beforeMetric) / beforeMetric : 0;

  const learning =
    delta > 0.2
      ? 'La acción mostró mejoría significativa en la métrica principal.'
      : delta > -0.1
        ? 'La acción mostró resultados estables; se necesitan más ciclos para aprender.'
        : 'La acción no mejoró la métrica. Revisar hipótesis.';

  await ref.update({
    status: 'COMPLETED',
    after,
    result: { ...action.result, measuredAt: new Date().toISOString(), delta },
    learning,
    completedAt: new Date().toISOString(),
  });

  await db().collection('nios_memory').add({
    kind: 'action_learning',
    actionId,
    before: action.before,
    after,
    learning,
    timestamp: new Date().toISOString(),
  });

  return (await ref.get()).data() as NiosAction;
}
