import { getAdminDb } from '@/lib/firebase-admin';
import type { PortadaConfig } from './types';

const COLLECTION = 'portada_config';
const DOC = 'default';

export async function getPortadaConfig(): Promise<PortadaConfig | null> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTION).doc(DOC).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return {
    version: data.version ?? 1,
    updatedAt: data.updatedAt || new Date().toISOString(),
    sections: data.sections || {},
    scheduledReplacements: data.scheduledReplacements || [],
  } as PortadaConfig;
}

export async function savePortadaConfig(
  config: Omit<PortadaConfig, 'updatedAt'>,
): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(DOC).set({
    ...config,
    updatedAt: new Date().toISOString(),
  });
}
