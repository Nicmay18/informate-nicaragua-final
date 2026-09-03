import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestDepartamentoReport } from './store';
import { getDepartmentHealth } from './heartbeat';
import { getWorkDone24h, countJobsByStatus, getRecentJobs } from './queue';
import { getIncidentsSummary } from './incidents';
import type { DepartamentoWorkSummary } from './types';

export async function getDepartamentoWorkSummary(): Promise<DepartamentoWorkSummary> {
  const db = getAdminDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [latestReport, incidents, workDone, pending, failed, deadLetter, recentJobs, opportunities, verifications] = await Promise.all([
    getLatestDepartamentoReport(),
    getIncidentsSummary(),
    getWorkDone24h(),
    countJobsByStatus('pending'),
    countJobsByStatus('failed'),
    countJobsByStatus('dead-letter'),
    getRecentJobs(8),
    db.collection('nios_growth_opportunities').where('createdAt', '>=', since).count().get(),
    db.collection('supervisor_cycles').where('runAt', '>=', since).count().get(),
  ]);

  const [actionsPending, learningsSnap, health] = await Promise.all([
    db.collection('nios_actions').where('status', '==', 'PENDING').count().get(),
    db.collection('nios_memory').where('kind', '==', 'learning').where('timestamp', '>=', since).count().get(),
    getDepartmentHealth(),
  ]);

  const lastWorkAt =
    (latestReport?.runAt) ??
    (recentJobs.find((j) => j.completedAt)?.completedAt) ??
    null;

  const recentItems: string[] = recentJobs
    .filter((j) => j.status === 'completed')
    .map((j) => {
      switch (j.type) {
        case 'health-check':
          return 'Revisión de disponibilidad';
        case 'article-pipeline':
          return `Análisis de artículo ${(j.payload?.articleId as string) ?? j.jobId}`;
        case 'daily-report':
          return 'Reporte diario generado';
        case 'growth-check':
          return 'Revisión de crecimiento';
        case 'watchdog':
          return 'Supervisión del departamento';
        default:
          return `${j.type} completado`;
      }
    });

  return {
    lastWorkAt,
    workDone24h: workDone,
    problemsDetected: incidents.active,
    problemsResolved: incidents.resolved24h,
    opportunitiesFound: opportunities.data().count || 0,
    actionsExecuted: workDone,
    verifications: verifications.data().count || 0,
    learnings: learningsSnap.data().count || 0,
    pendingApprovals: actionsPending.data().count || 0,
    activeJobs: pending,
    failedJobs: failed,
    deadLetterJobs: deadLetter,
    health: health.overall,
    componentStatus: health.components,
    recentItems,
  };
}
