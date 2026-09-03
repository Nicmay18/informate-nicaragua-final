import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { DepartamentoDailyReport } from './types';

const DAILY_COLLECTION = 'depto_central_daily';
const LATEST_DOC = 'depto_central_latest/latest';

export async function saveDepartamentoReport(report: DepartamentoDailyReport): Promise<void> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const batch = db.batch();

  const dailyRef = db.collection(DAILY_COLLECTION).doc(now);
  batch.set(dailyRef, report);

  const latestRef = db.doc(LATEST_DOC);
  batch.set(latestRef, { ...report, updatedAt: now });

  await batch.commit();
  logger.info('[departamento-central] Reporte guardado', { date: report.date });
}

export async function getLatestDepartamentoReport(): Promise<DepartamentoDailyReport | null> {
  const db = getAdminDb();
  const snap = await db.doc(LATEST_DOC).get();
  if (!snap.exists) return null;
  return snap.data() as DepartamentoDailyReport;
}
