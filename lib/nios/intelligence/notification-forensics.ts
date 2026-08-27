/**
 * NIOS Notification Forensics
 * ===========================
 * Auditoría por canal de las distribuciones reales registradas en Firestore
 * (`distribuciones` y `distribuciones_pendientes`).
 *
 * Núcleo puro: `buildNotificationForensics` no lee Firestore; recibe registros
 * ya cargados y produce el veredicto por canal (éxitos, fallos, último error).
 */

import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

export type NotificationChannel = 'telegram' | 'facebook' | 'indexnow' | 'push' | 'twitter';

export const KNOWN_CHANNELS: NotificationChannel[] = ['telegram', 'facebook', 'indexnow', 'push', 'twitter'];

export interface DistributionRecord {
  slug: string;
  titulo?: string;
  fecha: string;
  resultados: Record<string, { ok: boolean; skipped?: boolean; error?: string }>;
}

export interface PendingRetryRecord {
  slug: string;
  canalesFallidos: string[];
  reintentos: number;
  proximoIntento: string;
}

export type ChannelHealth = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'NO_DATA';

export interface ChannelForensics {
  channel: NotificationChannel;
  health: ChannelHealth;
  attempts: number;
  successes: number;
  failures: number;
  skipped: number;
  successRate: number | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  pendingRetries: number;
  note: string;
}

export interface NotificationForensicsReport {
  generatedAt: string;
  windowDays: number;
  recordsAnalyzed: number;
  channels: ChannelForensics[];
  summary: string;
}

function healthFor(attempts: number, successRate: number | null, pendingRetries: number): ChannelHealth {
  if (attempts === 0) return 'NO_DATA';
  if (successRate === null) return 'NO_DATA';
  if (successRate >= 90 && pendingRetries === 0) return 'HEALTHY';
  if (successRate >= 50 || pendingRetries > 0) return 'DEGRADED';
  return 'DOWN';
}

/**
 * Construye el reporte forense por canal a partir de registros reales.
 * No inventa datos: canales sin intentos se reportan como NO_DATA.
 */
export function buildNotificationForensics(
  records: DistributionRecord[],
  pending: PendingRetryRecord[],
  windowDays = 7,
): NotificationForensicsReport {
  const generatedAt = new Date().toISOString();
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const recent = records.filter((r) => r.fecha && r.fecha >= cutoff);

  const pendingByChannel = new Map<string, number>();
  for (const p of pending) {
    for (const canal of p.canalesFallidos || []) {
      pendingByChannel.set(canal, (pendingByChannel.get(canal) ?? 0) + 1);
    }
  }

  const channels: ChannelForensics[] = KNOWN_CHANNELS.map((channel) => {
    let attempts = 0;
    let successes = 0;
    let failures = 0;
    let skipped = 0;
    let lastSuccessAt: string | null = null;
    let lastFailureAt: string | null = null;
    let lastError: string | null = null;

    for (const record of recent) {
      const result = record.resultados?.[channel];
      if (!result) continue;
      if (result.skipped) {
        skipped += 1;
        continue;
      }
      attempts += 1;
      if (result.ok) {
        successes += 1;
        if (!lastSuccessAt || record.fecha > lastSuccessAt) lastSuccessAt = record.fecha;
      } else {
        failures += 1;
        if (!lastFailureAt || record.fecha > lastFailureAt) {
          lastFailureAt = record.fecha;
          lastError = result.error || 'Error no especificado';
        }
      }
    }

    const successRate = attempts > 0 ? Math.round((successes / attempts) * 100) : null;
    const pendingRetries = pendingByChannel.get(channel) ?? 0;
    const health = healthFor(attempts, successRate, pendingRetries);

    const note =
      health === 'NO_DATA'
        ? `Sin envíos a ${channel} en los últimos ${windowDays} días.`
        : health === 'HEALTHY'
          ? `${successes}/${attempts} envíos exitosos (${successRate}%).`
          : `${failures} fallos de ${attempts} intentos (${successRate}% éxito).${lastError ? ` Último error: ${lastError}` : ''}${
              pendingRetries > 0 ? ` ${pendingRetries} reintentos en cola.` : ''
            }`;

    return {
      channel,
      health,
      attempts,
      successes,
      failures,
      skipped,
      successRate,
      lastSuccessAt,
      lastFailureAt,
      lastError,
      pendingRetries,
      note,
    };
  });

  const down = channels.filter((c) => c.health === 'DOWN').length;
  const degraded = channels.filter((c) => c.health === 'DEGRADED').length;
  const noData = channels.filter((c) => c.health === 'NO_DATA').length;
  const summary = `Notificaciones (${windowDays}d): ${recent.length} distribuciones analizadas. ${down} canales caídos, ${degraded} degradados, ${noData} sin datos.`;

  return { generatedAt, windowDays, recordsAnalyzed: recent.length, channels, summary };
}

/**
 * Carga registros reales desde Firestore y construye el reporte.
 * Devuelve reporte vacío (todos NO_DATA) si la lectura falla.
 */
export async function fetchNotificationForensics(
  db: Firestore,
  windowDays = 7,
): Promise<NotificationForensicsReport> {
  try {
    const [distSnap, pendingSnap] = await Promise.all([
      db.collection('distribuciones').orderBy('fecha', 'desc').limit(200).get(),
      db.collection('distribuciones_pendientes').limit(100).get(),
    ]);

    const records = distSnap.docs.map((d) => d.data() as DistributionRecord);
    const pending = pendingSnap.docs.map((d) => d.data() as PendingRetryRecord);

    return buildNotificationForensics(records, pending, windowDays);
  } catch (err) {
    logger.error('[notification-forensics] Error leyendo distribuciones:', err);
    return buildNotificationForensics([], [], windowDays);
  }
}
