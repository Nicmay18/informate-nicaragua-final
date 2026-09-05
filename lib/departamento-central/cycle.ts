import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { openIncident, resolveIncident, getIncidentsSummary } from './incidents';
import { recordLearning } from './learning';
import { checkUrl } from './health';
import type { DepartamentoDailyReport } from './types';

async function loadLast24hActions(): Promise<{ completed: number; pending: number; failed: number; items: string[] }> {
  const db = getAdminDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [completedSnap, pendingSnap, failedSnap] = await Promise.all([
    db.collection('nios_actions').where('completedAt', '>=', since).count().get(),
    db.collection('nios_actions').where('status', '==', 'PENDING').count().get(),
    db.collection('nios_actions').where('failedAt', '>=', since).count().get(),
  ]);

  const completed = completedSnap.data().count;
  const pending = pendingSnap.data().count;
  const failed = failedSnap.data().count;

  return {
    completed,
    pending,
    failed,
    items: [
      completed > 0 ? `${completed} acciones completadas` : '',
      pending > 0 ? `${pending} acciones esperando aprobación` : '',
      failed > 0 ? `${failed} acciones fallaron` : '',
    ].filter(Boolean),
  };
}

async function loadIncidents(): Promise<{ active: number; resolved: number; items: string[]; activeItems: string[] }> {
  const summary = await getIncidentsSummary();

  const items: string[] = [];
  if (summary.active > 0) items.push(`${summary.active} incidente(s) activo(s)`);
  if (summary.resolved24h > 0) items.push(`${summary.resolved24h} incidente(s) resuelto(s) en las últimas 24h`);

  const activeItems = summary.items.map((i) => i.title);

  return { active: summary.active, resolved: summary.resolved24h, items, activeItems };
}

async function loadGrowthOpportunities(): Promise<{ count: number; note: string }> {
  const db = getAdminDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const snap = await db.collection('nios_growth_opportunities').where('createdAt', '>=', since).count().get();
  const count = snap.data().count;

  if (count === 0) {
    return { count: 0, note: 'No se generaron nuevas oportunidades de crecimiento en las últimas 24h.' };
  }

  return { count, note: `${count} oportunidades de crecimiento detectadas.` };
}

async function loadEditorialNotes(): Promise<{ count: number; note: string }> {
  const db = getAdminDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [supervisorSnap, meniSnap] = await Promise.all([
    db.collection('supervisor_cycles').where('runAt', '>=', since).count().get(),
    db.collection('meni_diagnosis').where('timestamp', '>=', since).count().get(),
  ]);

  const count = supervisorSnap.data().count + meniSnap.data().count;
  const note = count === 0
    ? 'Sin nuevas revisiones editoriales automáticas en las últimas 24h.'
    : `${count} revisiones editoriales registradas.`;

  return { count, note };
}

async function loadLearnings(): Promise<string[]> {
  const db = getAdminDb();
  const snap = await db.collection('nios_memory').orderBy('timestamp', 'desc').limit(20).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as { kind?: string; note?: string; timestamp?: string }))
    .filter((d) => d.kind === 'learning')
    .slice(0, 3)
    .map((d) => (typeof d.note === 'string' ? d.note : String(d.note || '')))
    .filter(Boolean);
}

export async function runDepartamentoCentralCycle(): Promise<DepartamentoDailyReport> {
  const started = Date.now();
  const now = new Date().toISOString();

  const [rootHealth, noticiasHealth] = await Promise.all([
    checkUrl('/'),
    checkUrl('/noticias/'),
  ]);

  const actions = await loadLast24hActions();
  const incidents = await loadIncidents();
  const growth = await loadGrowthOpportunities();
  const editorial = await loadEditorialNotes();
  const learnings = await loadLearnings();

  const siteStatus: 'ok' | 'warning' | 'critical' =
    rootHealth.ok && noticiasHealth.ok ? 'ok' : 'critical';

  const incidentItems = [...incidents.items, ...incidents.activeItems];
  if (!rootHealth.ok) {
    const title = `Disponibilidad de la página principal: ${rootHealth.status || 'timeout'}`;
    await openIncident({
      type: 'site-availability',
      severity: 'critical',
      title,
      url: rootHealth.url,
      status: 'active',
      detectedAt: now,
    });
    incidentItems.push(`Página principal responde ${rootHealth.status || 'error'}: ${rootHealth.error || 'sin respuesta'}`);
  } else {
    const titleRoot = 'Disponibilidad de la página principal';
    await resolveIncident(titleRoot, {
      diagnosis: 'Se detectó una respuesta correcta (HTTP 200) en la página principal.',
      correction: 'No se requieren correcciones; el incidente se resolvió o no existía.',
      verification: `Verificación real: HTTP ${rootHealth.status} en ${rootHealth.responseMs}ms.`,
      learning: 'El sitio responde correctamente.',
    });
    await recordLearning({
      source: 'departamento-central',
      kind: 'learning',
      note: 'Mantener un sitio con caché controlado es crítico: una respuesta 403 generada por un bot puede ser cacheada por el CDN y afectar a todos.',
      tags: ['disponibilidad', 'cdn', 'cache', 'middleware'],
    });
  }

  if (!noticiasHealth.ok) {
    const title = `Disponibilidad de /noticias: ${noticiasHealth.status || 'timeout'}`;
    await openIncident({
      type: 'site-availability',
      severity: 'critical',
      title,
      url: noticiasHealth.url,
      status: 'active',
      detectedAt: now,
    });
    incidentItems.push(`Sección /noticias responde ${noticiasHealth.status || 'error'}`);
  } else {
    const titleNews = 'Disponibilidad de la sección /noticias';
    await resolveIncident(titleNews, {
      diagnosis: 'La sección de noticias responde correctamente.',
      correction: 'No se requiere acción.',
      verification: `Verificación real: HTTP ${noticiasHealth.status} en ${noticiasHealth.responseMs}ms.`,
      learning: 'La sección de noticias está disponible.',
    });
  }

  const summaryLines: string[] = [];
  summaryLines.push(siteStatus === 'ok' ? 'El sitio está funcionando.' : 'El sitio tiene problemas de disponibilidad.');
  if (actions.items.length > 0) summaryLines.push(actions.items.join(' · '));
  if (incidentItems.length > 0) summaryLines.push(...incidentItems);
  if (growth.count > 0) summaryLines.push(growth.note);
  if (learnings.length > 0) summaryLines.push(`Aprendizajes registrados: ${learnings.length}`);

  const nextWork = actions.pending > 0
    ? `Hay ${actions.pending} acción(es) esperando aprobación. Es la prioridad.`
    : growth.count > 0
    ? `Revisar ${growth.count} oportunidades de crecimiento detectadas.`
    : 'Continuar vigilancia del sitio, SEO y contenido.';

  logger.info('[departamento-central] Ciclo completado', { siteStatus, durationMs: Date.now() - started });

  return {
    date: now.slice(0, 10),
    runAt: now,
    site: {
      status: siteStatus,
      root: rootHealth,
      noticias: noticiasHealth,
    },
    corrections: {
      name: 'correcciones',
      ok: actions.failed === 0,
      count: actions.completed,
      note: `Completadas ${actions.completed} · Fallaron ${actions.failed} · Pendientes ${actions.pending}`,
    },
    approvals: {
      name: 'aprobaciones',
      ok: actions.pending <= 5,
      count: actions.pending,
      note: actions.pending > 0 ? `${actions.pending} acciones esperan aprobación humana.` : 'No hay acciones pendientes de aprobación.',
    },
    growth: {
      name: 'crecimiento',
      ok: true,
      count: growth.count,
      note: growth.note,
    },
    editorial: {
      name: 'editorial',
      ok: true,
      count: editorial.count,
      note: editorial.note,
    },
    incidents: {
      level: incidentItems.length > 0 ? 'critical' : 'ok',
      active: incidents.active,
      resolved: incidents.resolved,
      items: incidentItems,
    },
    learning: learnings,
    summary: summaryLines.join('\n'),
    nextWork,
  };
}
