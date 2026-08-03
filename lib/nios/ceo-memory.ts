/**
 * CEO Memory — Memoria operativa de NIOS.
 * Guarda decisiones y tareas del CEO para recordar pendientes y celebrar avances.
 * No crea lógica editorial. Solo persiste el estado de las recomendaciones ejecutivas.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';

export interface CeoMemoryTask {
  id: string;
  action: string;
  source: string;
  createdAt: string;
  completedAt?: string;
  status: 'pending' | 'done';
}

export interface CeoMemory {
  pending: CeoMemoryTask[];
  recentDone: CeoMemoryTask[];
}

function db(): Firestore {
  return getAdminDb();
}

export async function getCeoMemory(): Promise<CeoMemory> {
  const snap = await db().collection('nios_memory').orderBy('createdAt', 'desc').limit(50).get();
  const tasks: CeoMemoryTask[] = snap.docs.map((d) => d.data() as unknown as CeoMemoryTask);

  return {
    pending: tasks.filter((t) => t.status === 'pending').slice(0, 10),
    recentDone: tasks.filter((t) => t.status === 'done').slice(0, 5),
  };
}

export async function trackRecommendation(
  id: string,
  action: string,
  source: string,
): Promise<void> {
  const ref = db().collection('nios_memory').doc(id);
  const snap = await ref.get();
  if (snap.exists) return;

  await ref.set({
    id,
    action,
    source,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
}

export async function completeTask(id: string): Promise<void> {
  const ref = db().collection('nios_memory').doc(id);
  await ref.update({
    status: 'done',
    completedAt: new Date().toISOString(),
  });
}

export async function syncRecommendations(recommendations: Array<{ id: string; action: string; source: string }>): Promise<void> {
  for (const r of recommendations) {
    await trackRecommendation(r.id, r.action, r.source);
  }

  // Marcar como posiblemente obsoletas las recomendaciones antiguas que ya no aparecen
  const activeIds = new Set(recommendations.map((r) => r.id));
  const snap = await db().collection('nios_memory').where('status', '==', 'pending').get();
  const batch = db().batch();
  snap.docs.forEach((d) => {
    const data = d.data() as unknown as CeoMemoryTask;
    if (!activeIds.has(data.id)) {
      batch.update(d.ref, { status: 'done', completedAt: new Date().toISOString() });
    }
  });
  await batch.commit();
}
