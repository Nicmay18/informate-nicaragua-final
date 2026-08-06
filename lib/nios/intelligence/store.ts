/**
 * NIOS Intelligence Platform — Firestore Store
 * =============================================
 * Persiste snapshots diarios en Firestore.
 * Colección: nios_daily_snapshots
 * Documento ID: {YYYY-MM-DD}
 * Nunca sobrescribe datos históricos.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import type { DailySnapshot } from './types';

const COLLECTION = 'nios_daily_snapshots';

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Guarda el snapshot diario en Firestore.
 * Si ya existe para hoy, no sobrescribe (preserva histórico).
 */
export async function saveDailySnapshot(
  db: Firestore,
  snapshot: Omit<DailySnapshot, 'date'>,
): Promise<string> {
  const date = todayKey();
  const docRef = db.collection(COLLECTION).doc(date);

  const existing = await docRef.get();
  if (existing.exists) {
    logger.warn(`[nios-store] Snapshot for ${date} already exists. Skipping to preserve history.`);
    return date;
  }

  await docRef.set({
    date,
    ...snapshot,
  });

  logger.info(`[nios-store] Saved daily snapshot for ${date}`);
  return date;
}

/**
 * Obtiene el snapshot más reciente.
 */
export async function getLatestSnapshot(db: Firestore): Promise<DailySnapshot | null> {
  const snap = await db
    .collection(COLLECTION)
    .orderBy('date', 'desc')
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].data() as unknown as DailySnapshot;
}

/**
 * Obtiene snapshots históricos para comparación.
 */
export async function getHistoricalSnapshots(
  db: Firestore,
  days: number,
): Promise<DailySnapshot[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const snap = await db
    .collection(COLLECTION)
    .where('date', '>=', cutoff)
    .orderBy('date', 'desc')
    .limit(days)
    .get();

  return snap.docs.map((d) => d.data() as unknown as DailySnapshot);
}

/**
 * Obtiene un snapshot por fecha específica.
 */
export async function getSnapshotByDate(db: Firestore, date: string): Promise<DailySnapshot | null> {
  const doc = await db.collection(COLLECTION).doc(date).get();
  if (!doc.exists) return null;
  return doc.data() as unknown as DailySnapshot;
}

/**
 * Verifica cuántos días de datos históricos existen.
 */
export async function getHistoricalDataDays(db: Firestore): Promise<number> {
  const snap = await db.collection(COLLECTION).orderBy('date', 'desc').limit(365).get();
  return snap.size;
}
