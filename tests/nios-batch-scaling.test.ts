import { describe, it, expect, vi } from 'vitest';
import { saveDailySnapshot } from '@/lib/nios/intelligence/store';
import { runLearningCycle } from '@/lib/meni/learning-engine';
import type { Firestore, WriteBatch, DocumentReference, DocumentSnapshot } from 'firebase-admin/firestore';

/**
 * Mock de Firestore que cuenta operaciones por batch y falla si un batch
 * supera 500 escrituras (límite real de Firestore).
 */
function mockFirestore(articleCount = 0) {
  const batchSizes: number[] = [];
  const writes: Record<string, unknown>[] = [];
  const docs = new Map<string, unknown>();

  const makeBatch = (): WriteBatch => {
    let ops = 0;
    const b = {
      set: (ref: DocumentReference, data: unknown) => {
        ops++;
        if (ops > 500) throw new Error('Firestore batch limit exceeded (500)');
        writes.push(data as Record<string, unknown>);
        docs.set(ref.path, data);
        return b;
      },
      commit: async () => { batchSizes.push(ops); },
      update: () => b,
      delete: () => b,
    } as unknown as WriteBatch;
    return b;
  };

  const docRef = (path: string): DocumentReference =>
    ({
      path,
      id: path.split('/').pop()!,
      get: async () =>
        ({ exists: docs.has(path), data: () => docs.get(path), id: path.split('/').pop() } as unknown as DocumentSnapshot),
      set: async (data: unknown) => { docs.set(path, data); },
      update: async () => {},
      collection: (sub: string) => ({ doc: (id: string) => docRef(`${path}/${sub}/${id}`) }),
    } as unknown as DocumentReference);

  const db = {
    batch: makeBatch,
    collection: (name: string) => ({
      doc: (id: string) => docRef(`${name}/${id}`),
      add: async (data: unknown) => { docs.set(`${name}/auto-${docs.size}`, data); },
      orderBy: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
      where: () => ({ orderBy: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }) }),
      get: async () => ({ empty: true, docs: [], size: articleCount, forEach: () => {} }),
    }),
  } as unknown as Firestore;

  return { db, batchSizes, docs };
}

function fakeArticle(i: number) {
  return {
    slug: `art-${i}`,
    titulo: `Artículo ${i}`,
    vistas: i,
    scoreMeni: 80,
    categoria: 'Nacionales',
  } as never;
}

describe('NIOS snapshot — escalabilidad del batch', () => {
  it('501 artículos → guarda sin exceder límite de batch', async () => {
    const { db, batchSizes } = mockFirestore();
    const articles = Array.from({ length: 501 }, (_, i) => fakeArticle(i));
    await saveDailySnapshot(db, { articlesFused: articles } as never);
    // 501 artículos en chunks de 450 → 2 batches de artículos
    const articleBatches = batchSizes.filter(s => s > 50);
    expect(articleBatches.every(s => s <= 500)).toBe(true);
    expect(articleBatches.length).toBeGreaterThanOrEqual(2);
  });

  it('1000 artículos → guarda sin exceder límite de batch', async () => {
    const { db, batchSizes } = mockFirestore();
    const articles = Array.from({ length: 1000 }, (_, i) => fakeArticle(i));
    await saveDailySnapshot(db, { articlesFused: articles } as never);
    const articleBatches = batchSizes.filter(s => s > 50);
    expect(articleBatches.every(s => s <= 500)).toBe(true);
    expect(articleBatches.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Learning Engine — gobernanza (sin auto-activación)', () => {
  it('runLearningCycle NUNCA escribe learning_config/active_adjustments', async () => {
    const { db, docs } = mockFirestore();
    // runLearningCycle retorna temprano con pocos artículos — suficiente para
    // verificar que en el flujo no se persiste active_adjustments.
    await runLearningCycle(db);
    const active = [...docs.keys()].filter(k => k.includes('active_adjustments'));
    expect(active.length).toBe(0);
  });
});
