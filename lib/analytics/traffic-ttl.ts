/**
 * NIOS Traffic Log TTL & Retention
 * ================================
 * Evita el crecimiento ilimitado de `traffic_log` escribiendo un campo
 * `expiresAt` en cada registro y proporcionando limpieza programada.
 *
 * La política TTL de Firestore debe activarse en Firebase Console
 * (colección `traffic_log`, campo `expiresAt`). El campo escrito aquí
 * es el dato que esa política necesita para funcionar.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

const DEFAULT_TRAFFIC_LOG_TTL_DAYS = 30;

export function trafficLogTTLDays(): number {
  const env = process.env.NIOS_TRAFFIC_LOG_TTL_DAYS;
  const parsed = env ? parseInt(env, 10) : DEFAULT_TRAFFIC_LOG_TTL_DAYS;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TRAFFIC_LOG_TTL_DAYS;
}

export function trafficLogExpiresAt(): Date {
  const days = trafficLogTTLDays();
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Verifica si los registros de traffic_log tienen el campo `expiresAt`.
 * No puede saber si la política TTL del proyecto está activa, pero detecta
 * si el código ya está escribiendo el campo requerido.
 */
export async function checkTrafficLogHasTTL(db: Firestore): Promise<boolean> {
  try {
    const snap = await db
      .collection('traffic_log')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    if (snap.empty) return false;
    return 'expiresAt' in snap.docs[0].data();
  } catch (err) {
    logger.warn('[traffic-ttl] No se pudo verificar TTL de traffic_log:', err);
    return false;
  }
}

interface CleanupResult {
  deleted: number;
  failed: number;
  scanned: number;
}

/**
 * Elimina registros de traffic_log más antiguos que `olderThanDays`.
 * Usar con cuidado; preferir la política TTL de Firestore en producción.
 */
export async function cleanupTrafficLog(
  db: Firestore,
  olderThanDays = trafficLogTTLDays(),
  batchSize = 500,
): Promise<CleanupResult> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  let deleted = 0;
  let failed = 0;
  let scanned = 0;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (true) {
    let query = db
      .collection('traffic_log')
      .where('timestamp', '<', cutoff)
      .orderBy('timestamp', 'asc')
      .limit(batchSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snap = await query.get();
    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
      scanned += 1;
    }

    try {
      await batch.commit();
      deleted += snap.docs.length;
      lastDoc = snap.docs[snap.docs.length - 1];
    } catch (err) {
      logger.error('[traffic-ttl] Fallo batch de eliminación:', err);
      failed += snap.docs.length;
      break;
    }

    if (snap.docs.length < batchSize) break;
  }

  logger.info('[traffic-ttl] Limpieza completada', { scanned, deleted, failed, olderThanDays });
  return { deleted, failed, scanned };
}
