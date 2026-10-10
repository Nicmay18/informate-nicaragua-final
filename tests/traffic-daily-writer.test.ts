import { describe, it, expect, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import {
  incrementTrafficDaily,
  saveTrafficDailySummary,
  getTrafficDailySummary,
} from '@/lib/analytics/traffic-aggregator';

/**
 * P0-7 — Replica fiel de la semántica Firestore que causaba el falso
 * "traffic_daily vacío":
 *
 *  - Escribir docs en una subcolección NO crea el doc padre (queda "fantasma").
 *  - collection.get() devuelve SOLO documentos existentes → los padres
 *    fantasma no aparecen aunque su subcolección esté poblada.
 *  - collection.listDocuments() SÍ devuelve los IDs de padres fantasma.
 *  - FieldValue.increment(n) suma al valor actual (0 si no existe).
 */
vi.mock('firebase-admin/firestore', async (importOriginal) => {
  const mod = await importOriginal<typeof import('firebase-admin/firestore')>();
  return {
    ...mod,
    FieldValue: {
      ...mod.FieldValue,
      increment: (n: number) => ({ __p07Increment: n }),
      serverTimestamp: () => ({ __p07ServerTs: true }),
    },
  };
});

type DocData = Record<string, unknown>;

function applyFieldValue(existing: unknown, value: unknown): unknown {
  if (value && typeof value === 'object' && '__p07Increment' in value) {
    const inc = (value as { __p07Increment: number }).__p07Increment;
    return (typeof existing === 'number' ? existing : 0) + inc;
  }
  return value;
}

function setDeep(target: DocData, path: string[], value: unknown): void {
  if (path.length === 1) {
    target[path[0]] = applyFieldValue(target[path[0]], value);
    return;
  }
  const head = path[0];
  if (typeof target[head] !== 'object' || target[head] === null) target[head] = {};
  setDeep(target[head] as DocData, path.slice(1), value);
}

interface FakeDbHandle {
  db: Firestore;
  store: Map<string, DocData>;
  /** IDs de docs existentes (reales) bajo una colección — lo que get() devuelve. */
  existingIds: (colPath: string) => string[];
  /** IDs de todos los hijos incluidos padres fantasma — lo que listDocuments() devuelve. */
  childIds: (colPath: string) => string[];
}

function createFakeFirestore(): FakeDbHandle {
  const store = new Map<string, DocData>();

  const existingIds = (colPath: string) => {
    const prefix = `${colPath}/`;
    const ids = new Set<string>();
    for (const key of store.keys()) {
      if (!key.startsWith(prefix)) continue;
      const rest = key.slice(prefix.length);
      if (!rest.includes('/')) ids.add(rest); // solo hijos directos existentes
    }
    return [...ids].sort();
  };

  const childIds = (colPath: string) => {
    const prefix = `${colPath}/`;
    const ids = new Set<string>();
    for (const key of store.keys()) {
      if (!key.startsWith(prefix)) continue;
      const first = key.slice(prefix.length).split('/')[0];
      ids.add(first);
    }
    return [...ids].sort();
  };

  const docRef = (path: string): any => ({
    id: path.split('/').pop(),
    path,
    collection: (name: string) => colRef(`${path}/${name}`),
    set: async (data: DocData, opts?: { merge?: boolean }) => {
      const base = opts?.merge ? { ...(store.get(path) || {}) } : {};
      for (const [k, v] of Object.entries(data)) setDeep(base, k.split('.'), v);
      store.set(path, base);
    },
    get: async () => ({
      exists: store.has(path),
      data: () => store.get(path),
    }),
  });

  const colRef = (path: string): any => ({
    doc: (id: string) => docRef(`${path}/${id}`),
    listDocuments: async () => childIds(path).map((id) => docRef(`${path}/${id}`)),
    get: async () => {
      const docs = existingIds(path).map((id) => ({ id, data: () => store.get(`${path}/${id}`)! }));
      return { empty: docs.length === 0, size: docs.length, docs };
    },
  });

  const db: any = {
    collection: (name: string) => colRef(name),
    batch: () => {
      const ops: Array<() => Promise<void>> = [];
      return {
        set: (ref: any, data: DocData, opts?: { merge?: boolean }) => {
          ops.push(() => ref.set(data, opts));
          return this;
        },
        commit: async () => {
          for (const op of ops) await op();
        },
      };
    },
  };

  return { db, store, existingIds, childIds };
}

const TODAY = new Date().toISOString().split('T')[0];

describe('P0-7 traffic_daily — dual-write y doc padre', () => {
  it('incrementTrafficDaily materializa el doc padre y el artículo', async () => {
    const { db, store } = createFakeFirestore();
    await incrementTrafficDaily(db, 'noticia-a', 'facebook', 'mobile');

    const article = store.get(`traffic_daily/${TODAY}/articles/noticia-a`)!;
    expect(article.slug).toBe('noticia-a');
    expect(article.views).toBe(1);
    expect((article.sources as DocData).facebook).toBe(1);
    expect((article.devices as DocData).mobile).toBe(1);

    // El padre existe y solo contiene updatedAt (contrato de firestore.rules).
    const parent = store.get(`traffic_daily/${TODAY}`)!;
    expect(parent).toBeDefined();
    expect(Object.keys(parent)).toEqual(['updatedAt']);
  });

  it('la raíz de la colección deja de reportar vacío tras el incremento', async () => {
    const { db } = createFakeFirestore();
    const rootBefore = await db.collection('traffic_daily').get();
    expect(rootBefore.empty).toBe(true); // semántica fantasma: sin docs → get() = 0

    await incrementTrafficDaily(db, 'noticia-a', 'google', 'desktop');

    const rootAfter = await db.collection('traffic_daily').get();
    expect(rootAfter.empty).toBe(false);
    expect(rootAfter.docs.map((d: { id: string }) => d.id)).toEqual([TODAY]);
  });

  it('increments repetidos acumulan sin duplicar docs (idempotencia de contador)', async () => {
    const { db, store, childIds } = createFakeFirestore();
    await incrementTrafficDaily(db, 'noticia-a', 'facebook', 'mobile');
    await incrementTrafficDaily(db, 'noticia-a', 'facebook', 'mobile');
    await incrementTrafficDaily(db, 'noticia-a', 'directo', 'desktop');
    await incrementTrafficDaily(db, 'noticia-b', 'otro', 'tablet');

    const a = store.get(`traffic_daily/${TODAY}/articles/noticia-a`)!;
    expect(a.views).toBe(3);
    expect((a.sources as DocData).facebook).toBe(2);
    expect((a.sources as DocData).direct).toBe(1); // 'directo' normaliza a 'direct'
    expect((a.devices as DocData).mobile).toBe(2);
    expect((a.devices as DocData).desktop).toBe(1);

    const b = store.get(`traffic_daily/${TODAY}/articles/noticia-b`)!;
    expect(b.views).toBe(1);
    expect((b.sources as DocData).other).toBe(1); // 'otro' normaliza a 'other'

    // Un solo doc por artículo: sin duplicados.
    const articles = await db.collection('traffic_daily').doc(TODAY).collection('articles').get();
    expect(articles.size).toBe(2);
    expect(childIds('traffic_daily')).toEqual([TODAY]);
  });

  it('saveTrafficDailySummary también materializa el padre', async () => {
    const { db, store } = createFakeFirestore();
    await saveTrafficDailySummary(db, '2026-10-09', 'noticia-x', {
      slug: 'noticia-x',
      date: '2026-10-09',
      views: 42,
      sources: { google: 42 },
      devices: { mobile: 42 },
    });

    expect(store.get('traffic_daily/2026-10-09')).toBeDefined();
    const article = store.get('traffic_daily/2026-10-09/articles/noticia-x')!;
    expect(article.views).toBe(42);

    const summary = await getTrafficDailySummary(db, '2026-10-09');
    expect(summary['noticia-x'].views).toBe(42);
  });
});
