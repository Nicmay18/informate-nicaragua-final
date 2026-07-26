/**
 * Sistema de Seguimiento — Orquestador
 * =======================================
 * Punto de entrada para casos abiertos y continuidad editorial.
 * - processArticle: detecta y vincula casos al publicar un artículo.
 * - getDashboard: obtiene el panel completo de seguimiento.
 * - manageCase: CRUD de casos manuales.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type {
  TrackingCase,
  CaseDetectionResult,
  SeguimientoDashboard,
  SeguimientoConfig,
  CaseType,
  CaseStatus,
  CasePriority,
} from './types';
import { DEFAULT_SEGUIMIENTO_CONFIG } from './types';
import {
  createCase,
  updateCase,
  addArticleToCase,
  closeCase,
  getOpenCases,
  getAllCases,
  getCaseUpdates,
} from './case-manager';
import { detectCaseFromArticle, shouldCloseCase, isSignificantUpdate } from './case-detector';
import { linkCaseToEntities, findRelatedCases } from './case-linker';
import { generateAlerts } from './alert-generator';

/**
 * Procesa un artículo recién publicado para detectar/vincular casos.
 */
export async function processArticle(
  db: Firestore,
  articleId: string,
  title: string,
  content: string,
  slug: string,
  category: string,
  departamento: string,
  config?: SeguimientoConfig,
): Promise<CaseDetectionResult & { action: string }> {
  const cfg = config || DEFAULT_SEGUIMIENTO_CONFIG;
  const openCases = await getOpenCases(db);

  const detection = detectCaseFromArticle(title, content, category, openCases);

  // Caso existente detectado
  if (detection.detected && detection.caseId) {
    const shouldClose = shouldCloseCase(title, content);

    if (shouldClose) {
      await closeCase(db, detection.caseId, articleId, `Cierre detectado desde artículo: ${title}`);
      return {
        ...detection,
        action: 'closed',
        caseId: detection.caseId,
      };
    }

    const significant = isSignificantUpdate(title, content);
    await addArticleToCase(
      db,
      detection.caseId,
      articleId,
      slug,
      title,
      detection.reason,
      significant,
    );

    if (cfg.autoLinkEntities) {
      await linkCaseToEntities(db, detection.caseId, title, content);
    }

    return {
      ...detection,
      action: significant ? 'significant_update' : 'linked',
      caseId: detection.caseId,
    };
  }

  // Nuevo caso detectado
  if (detection.detected && detection.newCase) {
    const newCase = await createCase(db, {
      ...detection.newCase,
      articleIds: [articleId],
      articleSlugs: [slug],
      articleCount: 1,
      lastArticleAt: new Date().toISOString(),
      departamento,
      metadata: {
        keyEntities: [],
        location: departamento,
        peopleInvolved: [],
        institutionsInvolved: [],
      },
    });

    if (cfg.autoLinkEntities) {
      await linkCaseToEntities(db, newCase.id, title, content);
    }

    return {
      ...detection,
      action: 'created',
      caseId: newCase.id,
    };
  }

  return {
    ...detection,
    action: 'none',
  };
}

/**
 * Obtiene el dashboard completo de seguimiento.
 */
export async function getDashboard(
  db: Firestore,
  config?: SeguimientoConfig,
): Promise<SeguimientoDashboard> {
  const cfg = config || DEFAULT_SEGUIMIENTO_CONFIG;
  const allCases = await getAllCases(db, 200);
  const openCases = allCases.filter(
    (c) => c.status === 'abierto' || c.status === 'en_desarrollo' || c.status === 'en_pausa',
  );
  const closedCases = allCases.filter(
    (c) => c.status === 'cerrado' || c.status === 'archivado',
  );

  const byType = {} as Record<CaseType, number>;
  const byPriority = {} as Record<CasePriority, number>;
  const byStatus = {} as Record<CaseStatus, number>;

  for (const c of openCases) {
    byType[c.type] = (byType[c.type] || 0) + 1;
    byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
  }

  const alerts = generateAlerts(openCases, cfg);

  const staleCases = openCases.filter((c) => {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(c.lastUpdateAt).getTime()) / (24 * 60 * 60 * 1000),
    );
    return daysSinceUpdate >= cfg.staleThresholdDays;
  });

  const urgentCases = openCases
    .filter((c) => c.priority === 'urgente' || c.priority === 'alta')
    .sort((a, b) => {
      const priorityOrder = { urgente: 0, alta: 1, media: 2, baja: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  // Actualizaciones recientes
  const recentUpdatesPromises = openCases.slice(0, 10).map((c) => getCaseUpdates(db, c.id));
  const updatesArrays = await Promise.all(recentUpdatesPromises);
  const recentUpdates = updatesArrays.flat().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);

  const topCases = openCases
    .sort((a, b) => b.articleCount - a.articleCount)
    .slice(0, 10);

  return {
    totalOpen: openCases.length,
    totalClosed: closedCases.length,
    byType,
    byPriority,
    byStatus,
    staleCases,
    urgentCases,
    recentUpdates,
    alerts,
    topCases,
  };
}

/**
 * Obtiene casos abiertos.
 */
export async function getCases(db: Firestore, status?: CaseStatus): Promise<TrackingCase[]> {
  if (status) {
    const all = await getAllCases(db, 200);
    return all.filter((c) => c.status === status);
  }
  return getOpenCases(db);
}

/**
 * Obtiene un caso específico con sus actualizaciones.
 */
export async function getCaseDetail(
  db: Firestore,
  caseId: string,
): Promise<{ case: TrackingCase | null; updates: Awaited<ReturnType<typeof getCaseUpdates>> }> {
  const all = await getAllCases(db, 200);
  const caseItem = all.find((c) => c.id === caseId) || null;
  if (!caseItem) return { case: null, updates: [] };

  const updates = await getCaseUpdates(db, caseId);
  return { case: caseItem, updates };
}

/**
 * Crea un caso manualmente.
 */
export async function createManualCase(
  db: Firestore,
  data: Partial<TrackingCase>,
): Promise<TrackingCase> {
  return createCase(db, data);
}

/**
 * Actualiza un caso manualmente.
 */
export async function updateManualCase(
  db: Firestore,
  caseId: string,
  updates: Partial<TrackingCase>,
): Promise<void> {
  return updateCase(db, caseId, updates);
}

/**
 * Cierra un caso.
 */
export async function closeManualCase(
  db: Firestore,
  caseId: string,
  closingSummary?: string,
): Promise<void> {
  return closeCase(db, caseId, undefined, closingSummary);
}

/**
 * Busca casos relacionados con un artículo (para sugerencias editoriales).
 */
export async function findCasesForArticle(
  db: Firestore,
  title: string,
  content: string,
): Promise<TrackingCase[]> {
  return findRelatedCases(db, title, content);
}

export type {
  TrackingCase,
  CaseDetectionResult,
  CaseAlert,
  SeguimientoDashboard,
  SeguimientoConfig,
  CaseType,
  CaseStatus,
  CasePriority,
} from './types';
