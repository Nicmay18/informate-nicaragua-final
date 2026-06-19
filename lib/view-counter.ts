/**
 * MÓDULO 2: Batched View Counter — Nicaragua Informate
 * Mitiga costos de Firestore acumulando incrementos de vistas en memoria
 * y flush periódico vía WriteBatch atómico.
 *
 * En entorno serverless (Vercel), el buffer vive mientras la función
 * esté caliente. Vistas no flushadas antes de un cold start se pierden
 * (aceptable para medios digitales vs. costo de escritura unitaria).
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

// ─── Configuración ───
const FLUSH_INTERVAL_MS = 30_000;   // Flush cada 30 segundos
const MAX_BUFFER_SIZE = 100;        // Flush inmediato al llegar a 100

// ─── Estado interno ───
interface BufferEntry {
  docRef: FirebaseFirestore.DocumentReference;
  increments: number;
}

const buffer = new Map<string, BufferEntry>();
let flushTimer: ReturnType<typeof setInterval> | null = null;
let isFlushing = false;

// ─── Iniciar timer de flush periódico ───
function startFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    void flush();
  }, FLUSH_INTERVAL_MS);
}

// ─── Acumular vista en buffer ───
export function incrementView(docId: string, docRef: FirebaseFirestore.DocumentReference): void {
  const entry = buffer.get(docId);
  if (entry) {
    entry.increments += 1;
  } else {
    buffer.set(docId, { docRef, increments: 1 });
  }

  // Flush inmediato si el buffer está lleno
  if (buffer.size >= MAX_BUFFER_SIZE) {
    void flush();
  }

  // Asegurar que el timer esté corriendo
  startFlushTimer();
}

// ─── Flush atómico vía Firestore WriteBatch ───
export async function flush(): Promise<void> {
  if (isFlushing || buffer.size === 0) return;

  isFlushing = true;

  // Copiar y limpiar buffer inmediatamente para no bloquear nuevos incrementos
  const snapshot = new Map(buffer);
  buffer.clear();

  try {
    const batch = adminDb.batch();

    for (const { docRef, increments } of snapshot.values()) {
      batch.update(docRef, { vistas: FieldValue.increment(increments) });
    }

    await batch.commit();

    logger.debug(`[view-counter] Flush OK: ${snapshot.size} docs, total increments`);
  } catch (error) {
    logger.error('[view-counter] Error en batch flush:', error);
    // Reintentar en el próximo ciclo (los datos ya se perdieron del buffer,
    // pero es preferible a sobrecargar Firestore con reintentos)
  } finally {
    isFlushing = false;
  }
}

// ─── Flush manual (útil en graceful shutdown) ───
export async function forceFlush(): Promise<void> {
  await flush();
}

// ─── Stats de debug ───
export function getBufferStats(): { size: number; totalIncrements: number } {
  let total = 0;
  for (const entry of buffer.values()) {
    total += entry.increments;
  }
  return { size: buffer.size, totalIncrements: total };
}
