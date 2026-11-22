import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

/**
 * MEDICIÓN DE REGENERACIONES Y LECTURAS (2026-11-22)
 * =================================================
 * Objetivo: identificar las rutas/cargas que más lecturas y transferencia
 * de Firestore generan, SIN instrumentation de requests (los bots no
 * ejecutan JS y no dejan rastro en traffic_log).
 *
 * Cómo funciona: los callbacks de unstable_cache SOLO se ejecutan cuando
 * hay una regeneración real (cache miss/expiry). Instrumentar dentro del
 * callback cuenta exactamente las regeneraciones que llegan a Firestore.
 *
 * Documento: metrics_daily/{YYYY-MM-DD}
 *   m.<metrica>.<clave> = FieldValue.increment — una sola escritura por
 *   regeneración (set+merge). Las escrituras están en US$0.00 en la
 *   factura actual; el volumen esperado (~5-15K/día) sigue siendo ínfimo.
 *
 * Métricas registradas:
 *   regen.<ruta>  — regeneraciones del cache (1 por ejecución del callback)
 *   docs.<ruta>   — documentos leídos aprox. (docs devueltos por la query)
 *   kb.<ruta>     — bytes aprox. de payload Firestore (solo donde se mide
 *                   el documento completo, p.ej. artículo y feeds)
 *
 * Fail-open: cualquier error se loguea y se ignora — la medición NUNCA
 * puede romper una página pública.
 */

const SAFE = /[^a-zA-Z0-9_-]/g;

function sanitize(part: string): string {
  return part.replace(SAFE, '_').slice(0, 60) || 'total';
}

export interface RegenSample {
  /** Documentos leídos aprox. en esta regeneración. */
  docs?: number;
  /** Bytes aprox. de payload Firestore (si se midió). */
  bytes?: number;
  /** Sub-clave (categoría, slug de entidad, tipo de feed...). */
  key?: string;
}

/**
 * Registra UNA regeneración de cache con sus lecturas estimadas.
 * Llamar DENTRO del callback de unstable_cache (o de la función de datos
 * que solo corre en regeneración ISR).
 */
export async function trackRegen(route: string, sample: RegenSample = {}): Promise<void> {
  const r = sanitize(route);
  const k = sample.key ? sanitize(sample.key) : 'total';
  const fields: Record<string, unknown> = {
    date: new Date().toISOString().slice(0, 10),
    updatedAt: FieldValue.serverTimestamp(),
    [`m.regen.${r}.${k}`]: FieldValue.increment(1),
  };
  if (sample.docs && sample.docs > 0) {
    fields[`m.docs.${r}.${k}`] = FieldValue.increment(Math.round(sample.docs));
  }
  if (sample.bytes && sample.bytes > 0) {
    fields[`m.kb.${r}.${k}`] = FieldValue.increment(Math.round(sample.bytes));
  }
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = getAdminDb();
    await db.collection('metrics_daily').doc(fields.date as string).set(fields, { merge: true });
  } catch (err) {
    logger.warn('[metrics] trackRegen falló (ignorado):', err instanceof Error ? err.message : String(err));
  }
}
