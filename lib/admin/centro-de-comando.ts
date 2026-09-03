import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { getNiosExecutiveData } from '@/lib/nios/executive-center';
import type { NiosExecutiveData } from '@/lib/nios/executive-center';
import { getDepartamentoWorkSummary } from '@/lib/departamento-central/summary';
import { getLatestDepartamentoReport } from '@/lib/departamento-central/store';
import {
  getRecentJobs,
  getDeadLetter,
} from '@/lib/departamento-central/queue';
import { getDepartmentHealth } from '@/lib/departamento-central/heartbeat';
import { getIncidentsSummary } from '@/lib/departamento-central/incidents';
import type { DepartamentoIncident } from '@/lib/departamento-central/incidents';
import type {
  DepartamentoWorkSummary,
  DepartamentoDailyReport,
  DeptoJob,
} from '@/lib/departamento-central/types';
import type { NiosAction } from '@/lib/nios/action-engine';

export interface PendingAction {
  id: string;
  title: string;
  evidence: string;
  proposal: string;
  kind: string;
  impact: string;
  confidence: string;
  createdAt: string;
  articleId?: string | null;
  target: string;
}

export interface LearningItem {
  id: string;
  kind: string;
  text: string;
  timestamp: string;
  actionId?: string;
}

export interface ContentHealth {
  total: number;
  approved: number;
  pendingReview: number;
  withOpportunities: number;
  withProblems: number;
}

export interface CentroDeComandoData {
  greeting: string;
  generatedAt: string;
  estadoGeneral: {
    level: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    label: 'OPERATIVO' | 'DEGRADADO' | 'CRÍTICO';
    dot: '🟢' | '🟡' | '🔴';
    lastWorkAt: string | null;
    lastHeartbeatAt: string | null;
    workDone24h: number;
    activeIncidents: number;
    pendingApprovals: number;
  };
  summary: DepartamentoWorkSummary | null;
  report: DepartamentoDailyReport | null;
  jobs: DeptoJob[];
  deadLetter: DeptoJob[];
  incidents: DepartamentoIncident[];
  pendingActions: PendingAction[];
  learnings: LearningItem[];
  content: ContentHealth | null;
  nios: NiosExecutiveData | null;
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

async function getLatestHeartbeatTime(): Promise<string | null> {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('depto_heartbeat')
      .orderBy('lastRunAt', 'desc')
      .limit(1)
      .get();
    if (snap.empty) return null;
    return (snap.docs[0].data() as { lastRunAt?: string }).lastRunAt ?? null;
  } catch (err) {
    logger.error('[centro-de-comando] Error leyendo heartbeat:', err);
    return null;
  }
}

async function getPendingActions(): Promise<PendingAction[]> {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('nios_actions')
      .where('status', '==', 'PENDING')
      .orderBy('proposedAt', 'desc')
      .limit(20)
      .get();
    return snap.docs.map((d) => {
      const a = d.data() as NiosAction;
      return {
        id: d.id,
        title: a.title,
        evidence: a.evidence,
        proposal: a.proposal,
        kind: a.kind,
        impact: a.impact,
        confidence: a.confidence,
        createdAt: a.proposedAt || a.createdAt,
        articleId: a.articleId,
        target: a.target,
      };
    });
  } catch (err) {
    logger.error('[centro-de-comando] Error consultando acciones pendientes:', err);
    return [];
  }
}

async function getRecentLearnings(): Promise<LearningItem[]> {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('nios_memory')
      .where('kind', 'in', ['learning', 'action_learning', 'insight'])
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    return snap.docs.map((d) => {
      const m = d.data() as { kind?: string; learning?: string; observation?: string; text?: string; timestamp?: string; actionId?: string };
      const text = m.learning || m.observation || m.text || 'Aprendizaje registrado';
      return {
        id: d.id,
        kind: m.kind || 'learning',
        text,
        timestamp: m.timestamp || new Date().toISOString(),
        actionId: m.actionId,
      };
    });
  } catch (err) {
    logger.error('[centro-de-comando] Error consultando aprendizajes:', err);
    return [];
  }
}

async function getContentHealth(): Promise<ContentHealth | null> {
  try {
    const db = getAdminDb();
    const [totalSnap, approvedSnap, pendingSnap, problemSnap] = await Promise.all([
      db.collection('noticias').count().get(),
      db.collection('noticias').where('aprobadoMeni', '==', true).count().get().catch(() => null),
      db.collection('noticias').where('aprobadoMeni', '==', false).count().get().catch(() => null),
      db.collection('nios_growth_opportunities').where('status', '==', 'PENDING').count().get().catch(() => null),
    ]);

    const total = totalSnap.data().count || 0;
    const approved = approvedSnap?.data().count ?? 0;
    const pendingReview = pendingSnap?.data().count ?? 0;
    const withOpportunities = problemSnap?.data().count ?? 0;

    return {
      total,
      approved,
      pendingReview,
      withOpportunities,
      withProblems: 0,
    };
  } catch (err) {
    logger.error('[centro-de-comando] Error consultando salud de contenido:', err);
    return null;
  }
}

export async function getCentroDeComandoData(): Promise<CentroDeComandoData> {
  const [
    niosResult,
    summaryResult,
    reportResult,
    jobsResult,
    deadResult,
    healthResult,
    incidentsResult,
    heartbeatResult,
    pendingActionsResult,
    learningsResult,
    contentResult,
  ] = await Promise.allSettled([
    getNiosExecutiveData().catch((e) => {
      logger.error('[centro-de-comando] NIOS executive data falló:', e);
      return null;
    }),
    getDepartamentoWorkSummary().catch((e) => {
      logger.error('[centro-de-comando] Resumen de trabajo falló:', e);
      return null;
    }),
    getLatestDepartamentoReport().catch((e) => {
      logger.error('[centro-de-comando] Reporte diario falló:', e);
      return null;
    }),
    getRecentJobs(50).catch((e) => {
      logger.error('[centro-de-comando] Trabajos recientes fallaron:', e);
      return [] as DeptoJob[];
    }),
    getDeadLetter(10).catch((e) => {
      logger.error('[centro-de-comando] Dead letter falló:', e);
      return [] as DeptoJob[];
    }),
    getDepartmentHealth().catch((e) => {
      logger.error('[centro-de-comando] Heartbeat falló:', e);
      return { overall: 'HEALTHY' as const, components: {} as Record<string, 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN'> };
    }),
    getIncidentsSummary().catch((e) => {
      logger.error('[centro-de-comando] Incidentes fallaron:', e);
      return { active: 0, resolved24h: 0, items: [] as DepartamentoIncident[] };
    }),
    getLatestHeartbeatTime(),
    getPendingActions(),
    getRecentLearnings(),
    getContentHealth(),
  ]);

  const nios = niosResult.status === 'fulfilled' ? niosResult.value : null;
  const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
  const report = reportResult.status === 'fulfilled' ? reportResult.value : null;
  const jobs = jobsResult.status === 'fulfilled' ? jobsResult.value : [];
  const deadLetter = deadResult.status === 'fulfilled' ? deadResult.value : [];
  const health = healthResult.status === 'fulfilled' ? healthResult.value : { overall: 'HEALTHY' as const, components: {} as Record<string, 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN'> };
  const incidents = incidentsResult.status === 'fulfilled'
    ? incidentsResult.value
    : { active: 0, resolved24h: 0, items: [] as DepartamentoIncident[] };
  const lastHeartbeatAt = heartbeatResult.status === 'fulfilled' ? heartbeatResult.value : null;
  const pendingActions = pendingActionsResult.status === 'fulfilled' ? pendingActionsResult.value : [];
  const learnings = learningsResult.status === 'fulfilled' ? learningsResult.value : [];
  const content = contentResult.status === 'fulfilled' ? contentResult.value : null;

  const level = health.overall;
  const labelMap = { HEALTHY: 'OPERATIVO', DEGRADED: 'DEGRADADO', CRITICAL: 'CRÍTICO' } as const;
  const dotMap = { HEALTHY: '🟢', DEGRADED: '🟡', CRITICAL: '🔴' } as const;

  const lastWorkAt = summary?.lastWorkAt ?? report?.runAt ?? null;

  return {
    greeting: `${timeGreeting()}, Maycol.`,
    generatedAt: new Date().toISOString(),
    estadoGeneral: {
      level,
      label: labelMap[level],
      dot: dotMap[level],
      lastWorkAt,
      lastHeartbeatAt,
      workDone24h: summary?.workDone24h ?? 0,
      activeIncidents: incidents.active,
      pendingApprovals: summary?.pendingApprovals ?? 0,
    },
    summary,
    report,
    jobs,
    deadLetter,
    incidents: incidents.items,
    pendingActions,
    learnings,
    content,
    nios,
  };
}

