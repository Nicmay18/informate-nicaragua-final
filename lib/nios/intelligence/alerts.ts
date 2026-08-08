/**
 * NIOS Internal Alerts System
 * ============================
 * Persiste alertas en Firestore (colección nios_alerts).
 * No envía notificaciones externas — solo persistencia.
 */

import { logger } from '@/lib/logger';
import type { Firestore } from 'firebase-admin/firestore';
import type { ReliabilitySnapshot } from './reliability-monitor';
import type { NiosHealthScore } from './health-score';

const ALERTS_COLLECTION = 'nios_alerts';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface NiosAlert {
  date: string;
  severity: AlertSeverity;
  category: 'pipeline' | 'traffic' | 'performance' | 'health';
  message: string;
  metadata?: Record<string, unknown>;
  resolved: boolean;
  createdAt: string;
}

/**
 * Evalúa un reliability snapshot y genera alertas si los umbrales se superan.
 */
export function evaluateAlerts(
  snapshot: ReliabilitySnapshot,
  health: NiosHealthScore,
  baselineDurationMs?: number,
): NiosAlert[] {
  const alerts: NiosAlert[] = [];
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // Pipeline failure
  if (!snapshot.pipeline.success) {
    alerts.push({
      date: today,
      severity: 'critical',
      category: 'pipeline',
      message: `Pipeline NIOS falló en última ejecución (${snapshot.date})`,
      metadata: { failedModules: snapshot.pipeline.failedModules },
      resolved: false,
      createdAt: now,
    });
  }

  // Traffic fallback > 5%
  if (snapshot.trafficMigration.fallbackReads > 0) {
    const fallbackPercentage = snapshot.trafficMigration.trafficDailyCoverage < 95
      ? 100 - snapshot.trafficMigration.trafficDailyCoverage
      : 0;
    if (fallbackPercentage > 5) {
      alerts.push({
        date: today,
        severity: 'warning',
        category: 'traffic',
        message: `Fallback traffic >5%: ${fallbackPercentage.toFixed(1)}% (coverage ${snapshot.trafficMigration.trafficDailyCoverage}%)`,
        metadata: { fallbackReads: snapshot.trafficMigration.fallbackReads },
        resolved: false,
        createdAt: now,
      });
    }
  }

  // Duration increase > 50%
  if (baselineDurationMs && baselineDurationMs > 0) {
    const increase = (snapshot.pipeline.durationMs - baselineDurationMs) / baselineDurationMs;
    if (increase > 0.5) {
      alerts.push({
        date: today,
        severity: 'warning',
        category: 'performance',
        message: `Duración pipeline aumentó >50%: ${snapshot.pipeline.durationMs}ms vs baseline ${baselineDurationMs}ms`,
        metadata: { increase: `${(increase * 100).toFixed(1)}%` },
        resolved: false,
        createdAt: now,
      });
    }
  }

  // Health score < 80
  if (health.score < 80) {
    alerts.push({
      date: today,
      severity: 'critical',
      category: 'health',
      message: `Health score por debajo de 80: ${health.score} (${health.level})`,
      metadata: { score: health.score, level: health.level },
      resolved: false,
      createdAt: now,
    });
  }

  return alerts;
}

/**
 * Persiste alertas en Firestore. No envía notificaciones.
 */
export async function persistAlerts(
  db: Firestore,
  alerts: NiosAlert[],
): Promise<void> {
  if (alerts.length === 0) return;

  try {
    const batch = db.batch();
    for (const alert of alerts) {
      const ref = db.collection(ALERTS_COLLECTION).doc();
      batch.set(ref, alert);
    }
    await batch.commit();
    logger.info(`[nios-alerts] Persisted ${alerts.length} alerts`);
  } catch (err) {
    logger.error('[nios-alerts] Failed to persist alerts:', err);
  }
}

/**
 * Lee alertas activas (no resueltas) de los últimos N días.
 */
export async function getActiveAlerts(
  db: Firestore,
  days = 7,
): Promise<NiosAlert[]> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const snap = await db
      .collection(ALERTS_COLLECTION)
      .where('resolved', '==', false)
      .where('createdAt', '>=', cutoff.toISOString())
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snap.docs.map((d) => d.data() as NiosAlert);
  } catch (err) {
    logger.error('[nios-alerts] Failed to read alerts:', err);
    return [];
  }
}
