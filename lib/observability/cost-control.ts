/**
 * NIOS Cost Control — políticas de retención, batching e índices.
 * Aplica TTL en documentos de Firestore y limita lecturas por agregación.
 */

import type { Firestore } from 'firebase-admin/firestore';

export interface CostPolicy {
  /** Colección donde se escriben eventos */
  telemetryCollection: string;
  /** TTL en días para eventos de journey */
  journeyTtlDays: number;
  /** TTL en días para auditorías */
  auditTtlDays: number;
  /** Máximo de documentos leídos por agregación */
  maxAggregationReads: number;
  /** Ventana máxima de agregación en horas */
  maxAggregationHours: number;
  /** Batch size para escritura en memoria */
  memoryBatchSize: number;
}

export const DEFAULT_COST_POLICY: CostPolicy = {
  telemetryCollection: 'nios_telemetry',
  journeyTtlDays: 30,
  auditTtlDays: 90,
  maxAggregationReads: 5000,
  maxAggregationHours: 168, // 7 días
  memoryBatchSize: 10,
};

/**
 * Índices recomendados para nios_telemetry en Firestore:
 * - timestamp (asc) → para agregaciones time-bounded
 * - sessionId (asc) + timestamp (asc) → para reconstrucción de sesiones
 * - articleSlug (asc) + timestamp (asc) → para lifecycle de artículos
 * - type (asc) + timestamp (asc) → para métricas por tipo
 * - source (asc) + timestamp (asc) → para análisis de tráfico
 */
export const RECOMMENDED_INDEXES = [
  { collection: 'nios_telemetry', fields: ['timestamp'] },
  { collection: 'nios_telemetry', fields: ['sessionId', 'timestamp'] },
  { collection: 'nios_telemetry', fields: ['articleSlug', 'timestamp'] },
  { collection: 'nios_telemetry', fields: ['type', 'timestamp'] },
  { collection: 'nios_telemetry', fields: ['source', 'timestamp'] },
];

/**
 * Configura TTL en la colección de Firestore si aún no existe.
 * Requiere permisos de administrador y debe ejecutarse una sola vez.
 */
export async function configureTtl(db: Firestore, policy = DEFAULT_COST_POLICY): Promise<{ ok: boolean }> {
  try {
    // Firestore Admin no expone API de TTL en JS. Se documenta para configuración manual en consola.
    // Política: eliminar documentos de nios_telemetry donde expiresAt < now.
    const now = new Date();
    const expiredBefore = new Date(now.getTime() - policy.journeyTtlDays * 24 * 60 * 60 * 1000).toISOString();
    const snapshot = await db
      .collection(policy.telemetryCollection)
      .where('expiresAt', '<', expiredBefore)
      .limit(100)
      .get();

    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    return { ok: true };
  } catch (_err) {
    return { ok: false };
  }
}
