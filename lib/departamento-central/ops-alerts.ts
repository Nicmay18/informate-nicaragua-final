/**
 * Alertas operativas reales → nios_alerts
 * ======================================
 * Convierte condiciones operativas observadas en alertas persistidas con
 * deduplicación/cooldown (vía emitAlerts + alert-engine). Solo emite cuando
 * existe una condición real; nunca genera alertas sintéticas.
 *
 * Condiciones cubiertas:
 *   - heartbeat CRITICAL (cron falló o está ausente más allá de su ventana)
 *   - jobs pending demasiado tiempo
 *   - snapshot diario faltante
 *   - fuente crítica (GSC/GA4) sin datos reales en el último snapshot
 *   - motor que reporta VERIFIED sin evidencia verificable
 */

import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { emitAlerts, type NiosAlert } from '@/lib/nios/intelligence/alerts';

const SNAPSHOT_COLLECTION = 'nios_daily_snapshots';
const JOBS_COLLECTION = 'depto_jobs';
const MEMORY_COLLECTION = 'nios_memory';
const PENDING_JOB_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SNAPSHOT_MAX_AGE_H = 30;

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayDate(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function baseAlert(partial: Omit<NiosAlert, 'date' | 'createdAt' | 'resolved'>): NiosAlert {
  const now = new Date().toISOString();
  return { ...partial, date: todayDate(), createdAt: now, resolved: false };
}

async function checkSnapshot(db: Firestore, alerts: NiosAlert[]): Promise<void> {
  const today = todayDate();
  const yesterday = yesterdayDate();
  const [todayDoc, yesterdayDoc] = await Promise.all([
    db.collection(SNAPSHOT_COLLECTION).doc(today).get(),
    db.collection(SNAPSHOT_COLLECTION).doc(yesterday).get(),
  ]);

  const latest = todayDoc.exists ? todayDoc : yesterdayDoc.exists ? yesterdayDoc : null;
  if (!latest) {
    alerts.push(
      baseAlert({
        severity: 'critical',
        category: 'ops',
        message: `Snapshot diario faltante: no existe ${today} ni ${yesterday} en ${SNAPSHOT_COLLECTION}`,
        metadata: { today, yesterday },
      }),
    );
    return;
  }

  const data = latest.data() as Record<string, unknown>;
  const collectedAt = Date.parse(String(data.collectedAt || ''));
  if (!Number.isNaN(collectedAt) && Date.now() - collectedAt > SNAPSHOT_MAX_AGE_H * 36e5) {
    alerts.push(
      baseAlert({
        severity: 'warning',
        category: 'ops',
        message: `Último snapshot ${latest.id} tiene ${Math.round((Date.now() - collectedAt) / 36e5)}h de antigüedad`,
        metadata: { snapshot: latest.id, collectedAt: data.collectedAt },
      }),
    );
  }

  for (const source of ['gsc', 'ga4'] as const) {
    const src = data[source] as { status?: string } | null | undefined;
    if (!src || (src.status !== undefined && src.status !== 'REAL')) {
      alerts.push(
        baseAlert({
          severity: 'warning',
          category: 'ops',
          message: `Fuente crítica ${source.toUpperCase()} sin datos REAL en snapshot ${latest.id} (status: ${src?.status ?? 'ausente'})`,
          metadata: { snapshot: latest.id, source, status: src?.status ?? null },
        }),
      );
    }
  }
}

async function checkStalePendingJobs(db: Firestore, alerts: NiosAlert[]): Promise<void> {
  const cutoff = new Date(Date.now() - PENDING_JOB_MAX_AGE_MS).toISOString();
  const snap = await db
    .collection(JOBS_COLLECTION)
    .where('status', '==', 'pending')
    .where('createdAt', '<=', cutoff)
    .limit(50)
    .get();
  if (snap.empty) return;

  const types = new Map<string, number>();
  for (const doc of snap.docs) {
    const t = String((doc.data() as { type?: string }).type || 'unknown');
    types.set(t, (types.get(t) || 0) + 1);
  }
  const breakdown = Array.from(types.entries()).map(([t, c]) => `${t}:${c}`).join(', ');
  alerts.push(
    baseAlert({
      severity: 'warning',
      category: 'ops',
      message: `${snap.size} job(s) llevan más de 24h en estado pending: ${breakdown}`,
      metadata: { count: snap.size, breakdown },
    }),
  );
}

async function checkUnverifiedAutonomy(db: Firestore, alerts: NiosAlert[]): Promise<void> {
  const snap = await db
    .collection(MEMORY_COLLECTION)
    .where('kind', '==', 'ceo_loop')
    .limit(20)
    .get();
  if (snap.empty) return;

  const latest = snap.docs
    .map((d) => d.data() as Record<string, unknown>)
    .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')))[0];
  if (!latest) return;

  const evidence = latest.autonomyEvidence as Record<string, string> | undefined;
  const report = latest.autonomyReport as Record<string, string> | undefined;
  if (!report) return; // registros históricos sin reporte no evaluables aquí

  const unverified: string[] = [];
  for (const [stage, status] of Object.entries(report)) {
    if (status === 'VERIFIED' && !(evidence && evidence[stage])) {
      unverified.push(stage);
    }
  }
  if (unverified.length > 0) {
    alerts.push(
      baseAlert({
        severity: 'warning',
        category: 'ops',
        message: `CEO Loop reporta VERIFIED sin evidencia persistida en: ${unverified.join(', ')}`,
        metadata: { loopId: latest.id, stages: unverified },
      }),
    );
  }
}

export async function emitOperationalAlerts(
  db: Firestore,
  criticalComponents: string[],
): Promise<{ emitted: number; candidates: number }> {
  const alerts: NiosAlert[] = [];

  for (const component of criticalComponents) {
    alerts.push(
      baseAlert({
        severity: 'critical',
        category: 'ops',
        message: `Heartbeat crítico: ${component} (cron ausente o falló más allá de su ventana esperada)`,
        metadata: { component },
      }),
    );
  }

  try {
    await checkSnapshot(db, alerts);
  } catch (err) {
    logger.error('[ops-alerts] checkSnapshot failed:', err);
  }
  try {
    await checkStalePendingJobs(db, alerts);
  } catch (err) {
    logger.error('[ops-alerts] checkStalePendingJobs failed:', err);
  }
  try {
    await checkUnverifiedAutonomy(db, alerts);
  } catch (err) {
    logger.error('[ops-alerts] checkUnverifiedAutonomy failed:', err);
  }

  if (alerts.length === 0) return { emitted: 0, candidates: 0 };
  const result = await emitAlerts(db, alerts);
  return { emitted: result.toEmit.length, candidates: alerts.length };
}
