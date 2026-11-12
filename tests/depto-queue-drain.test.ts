import { describe, it, expect, vi } from 'vitest';

/**
 * Regresión producción: depto_jobs acumulaba 221 pending mientras el
 * scheduler reportaba "processed 0". La query tomaba los 50 más viejos por
 * scheduledFor — todos completed/dead-letter (los docs no se borran) — y el
 * filtro de estado en memoria quedaba vacío. La corrección filtra por
 * status en la query.
 */

type DocData = Record<string, unknown>;
interface FakeDoc { id: string; data(): DocData }

function fakeDb(initial: Record<string, DocData>) {
  const store = new Map(Object.entries(initial));

  function matches(filters: [string, string, unknown][], d: DocData): boolean {
    return filters.every(([f, op, v]) => {
      if (op === 'in') return (v as unknown[]).includes(d[f]);
      if (op === '==') return d[f] === v;
      if (op === '<=') return (d[f] as string) <= (v as string);
      return false;
    });
  }

  const col = {
    where(field: string, op: string, val: unknown) {
      const filters: [string, string, unknown][] = [[field, op, val]];
      const q = {
        where(f2: string, op2: string, v2: unknown) { filters.push([f2, op2, v2]); return q; },
        orderBy() { return q; },
        limit(n: number) {
          return {
            get: async () => {
              const docs = [...store.entries()]
                .filter(([, d]) => matches(filters, d))
                .slice(0, n)
                .map(([id, data]) => ({ id, data: () => data }));
              return { docs, empty: docs.length === 0, size: docs.length };
            },
          };
        },
        get: async () => {
          const docs = [...store.entries()]
            .filter(([, d]) => matches(filters, d))
            .map(([id, data]) => ({ id, data: () => data }));
          return { docs, empty: docs.length === 0, size: docs.length };
        },
      };
      return q;
    },
    doc(id: string) {
      return {
        id,
        get: async () => ({ exists: store.has(id), data: () => store.get(id) }),
        update: async (patch: DocData) => { store.set(id, { ...store.get(id), ...patch }); },
      };
    },
  };

  return {
    collection: () => col,
    runTransaction: async (fn: (tx: { get: (r: unknown) => Promise<{ exists: boolean; data(): DocData | undefined }>; update: (r: unknown, p: DocData) => void }) => Promise<unknown>) => {
      const tx = {
        get: async (ref: { id: string }) => ({ exists: store.has(ref.id), data: () => store.get(ref.id) }),
        update: (ref: { id: string }, patch: DocData) => { store.set(ref.id, { ...store.get(ref.id), ...patch }); },
      };
      return fn(tx);
    },
    __store: store,
  };
}

const OLD = '2026-09-05T00:00:00.000Z';
const NEWER = '2026-09-22T00:00:00.000Z';

function seedCongelada() {
  const docs: Record<string, DocData> = {};
  // 50 completados/dead-letter con scheduledFor viejo — lo que saturaba la ventana.
  for (let i = 0; i < 50; i++) {
    docs[`done-${i}`] = {
      jobId: `done-${i}`, type: 'watchdog', priority: 'P0', status: i < 3 ? 'dead-letter' : 'completed',
      scheduledFor: OLD, createdAt: OLD, attempts: 1, source: 'x',
    };
  }
  // Pendientes con scheduledFor algo más nuevo — quedaban fuera del limit(50).
  docs['pend-1'] = {
    jobId: 'pend-1', type: 'health-check', priority: 'P0', status: 'pending',
    scheduledFor: NEWER, createdAt: NEWER, attempts: 0, source: 'scheduler',
  };
  docs['pend-2'] = {
    jobId: 'pend-2', type: 'daily-report', priority: 'P1', status: 'pending',
    scheduledFor: NEWER, createdAt: NEWER, attempts: 0, source: 'scheduler',
  };
  // Futuro: no debe reclamarse aunque esté pending.
  docs['pend-futuro'] = {
    jobId: 'pend-futuro', type: 'health-check', priority: 'P0', status: 'pending',
    scheduledFor: '2099-01-01T00:00:00.000Z', createdAt: NEWER, attempts: 0, source: 'scheduler',
  };
  return docs;
}

describe('claimNextJob — la cola no puede quedar congelada por completados', () => {
  it('selecciona el pending P0 aunque los 50 más viejos por scheduledFor sean completed', async () => {
    const db = fakeDb(seedCongelada());
    vi.doMock('@/lib/firebase-admin', () => ({ getAdminDb: () => db }));
    vi.resetModules();
    const { claimNextJob: claim } = await import('@/lib/departamento-central/queue');

    const job = await claim();
    expect(job).not.toBeNull();
    expect(job!.jobId).toBe('pend-1');
    // Claim atómico: queda running.
    expect((db.__store.get('pend-1') as DocData).status).toBe('running');
  });

  it('respeta scheduledFor futuro', async () => {
    const db = fakeDb({
      'fut-1': { jobId: 'fut-1', type: 'health-check', priority: 'P0', status: 'pending', scheduledFor: '2099-01-01T00:00:00.000Z', createdAt: NEWER, attempts: 0 },
    });
    vi.doMock('@/lib/firebase-admin', () => ({ getAdminDb: () => db }));
    vi.resetModules();
    const { claimNextJob: claim } = await import('@/lib/departamento-central/queue');
    expect(await claim()).toBeNull();
  });
});

describe('completeJob — resultado con undefined no puede romper el update', () => {
  // Producción: article-pipeline quedó en retry permanente porque
  // `result.invalidScoreSource` era undefined y Firestore rechaza undefined
  // en cualquier nivel ("Cannot use undefined as a Firestore value").
  function strictDb() {
    const store = new Map<string, DocData>([
      ['job-undef', { jobId: 'job-undef', status: 'running' }],
    ]);
    const rejectUndefined = (v: unknown, path: string): void => {
      if (v === undefined) throw new Error(`invalid Firestore value at ${path}`);
      if (v && typeof v === 'object') {
        for (const [k, val] of Object.entries(v)) rejectUndefined(val, `${path}.${k}`);
      }
    };
    return {
      collection: () => ({
        doc: (id: string) => ({
          update: async (patch: DocData) => {
            for (const [k, v] of Object.entries(patch)) rejectUndefined(v, k);
            store.set(id, { ...store.get(id), ...patch });
          },
        }),
      }),
      __store: store,
    };
  }

  it('sanea campos undefined dentro de result antes de escribir', async () => {
    const db = strictDb();
    vi.doMock('@/lib/firebase-admin', () => ({ getAdminDb: () => db }));
    vi.resetModules();
    const { completeJob } = await import('@/lib/departamento-central/queue');

    await expect(
      completeJob('job-undef', { ok: true, invalidScoreSource: undefined, nota: 'x' }),
    ).resolves.toBeUndefined();

    const saved = db.__store.get('job-undef') as DocData;
    expect(saved.status).toBe('completed');
    expect((saved.result as DocData).invalidScoreSource).toBeUndefined();
    expect((saved.result as DocData).nota).toBe('x');
  });

  it('omite result si no se pasa ninguno', async () => {
    const db = strictDb();
    vi.doMock('@/lib/firebase-admin', () => ({ getAdminDb: () => db }));
    vi.resetModules();
    const { completeJob } = await import('@/lib/departamento-central/queue');

    await expect(completeJob('job-undef')).resolves.toBeUndefined();
    expect((db.__store.get('job-undef') as DocData).status).toBe('completed');
  });
});
