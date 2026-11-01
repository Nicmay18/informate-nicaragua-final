/**
 * Concurrencia — guards atómicos de estado (G3).
 * Cubre: claim de envío Telegram (nios-queues), transiciones de
 * approve/reject (action-engine) y unicidad de slugs (slug_claims).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';

// ─────────────────────────── Fake Firestore ───────────────────────────

type FakeDoc = Record<string, any> & { id: string };
type Filter = { f: string; op: string; v: any };

const store = new Map<string, Map<string, FakeDoc>>();
let seq = 0;

function colDocs(col: string): FakeDoc[] {
  return Array.from(store.get(col)?.values() ?? []);
}

function makeDocRef(col: string, id?: string): any {
  const docId = id || `doc-${++seq}`;
  const ref: any = {
    id: docId,
    set: async (data: any, opts?: { merge?: boolean }) => {
      const m = store.get(col) ?? new Map<string, FakeDoc>();
      const prev = opts?.merge ? (m.get(docId) ?? { id: docId }) : { id: docId };
      m.set(docId, { ...prev, ...data });
      store.set(col, m);
    },
    update: async (data: any) => {
      const m = store.get(col) ?? new Map<string, FakeDoc>();
      if (!m.get(docId)) throw new Error(`update sobre doc inexistente ${col}/${docId}`);
      m.set(docId, { ...m.get(docId)!, ...data });
      store.set(col, m);
    },
    get: async () => {
      const d = store.get(col)?.get(docId);
      return { exists: !!d, id: docId, data: () => d, ref };
    },
    collection: (sub: string) => makeCol(`${col}/${docId}/${sub}`),
  };
  return ref;
}

function makeQuery(col: string, filters: Filter[] = [], limitN?: number): any {
  return {
    where: (f: string, op: string, v: any) => makeQuery(col, [...filters, { f, op, v }], limitN),
    limit: (n: number) => makeQuery(col, filters, n),
    get: async () => {
      let list = colDocs(col);
      for (const { f, op, v } of filters) {
        list = list.filter((d) => {
          const val = f.split('.').reduce((o: any, k) => o?.[k], d);
          if (op === '==') return val === v;
          if (op === 'in') return Array.isArray(v) && v.includes(val);
          return true;
        });
      }
      if (limitN !== undefined) list = list.slice(0, limitN);
      return {
        docs: list.map((d) => ({ id: d.id, exists: true, data: () => d, ref: makeDocRef(col, d.id) })),
        empty: list.length === 0,
        size: list.length,
      };
    },
  };
}

function makeCol(name: string): any {
  return {
    doc: (id?: string) => makeDocRef(name, id),
    where: (f: string, op: string, v: any) => makeQuery(name, [{ f, op, v }]),
    get: () => makeQuery(name).get(),
    add: async (data: any) => {
      const ref = makeDocRef(name);
      await ref.set(data);
      return ref;
    },
  };
}

const txApi = {
  get: (r: any) => r.get(),
  set: (r: any, d: any) => r.set(d),
  update: (r: any, d: any) => r.update(d),
  create: async (r: any, d: any) => {
    if ((await r.get()).exists) throw new Error(`doc ${r.id} ya existe`);
    return r.set(d);
  },
};

// Firestore serializa transacciones que tocan el mismo doc (conflict →
// retry). El fake aproxima eso serializando TODAS las txs: la segunda ve
// los writes de la primera y el guard interno (tx.get previo al create)
// decide — igual que el retry real, que re-ejecuta el callback.
let txChain: Promise<any> = Promise.resolve();
const fakeDb = {
  collection: (name: string) => makeCol(name),
  runTransaction: <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
    const run = txChain.then(() => fn(txApi));
    txChain = run.catch(() => {});
    return run;
  },
} as unknown as Firestore;

function seed(col: string, id: string, data: Record<string, any>) {
  const m = store.get(col) ?? new Map<string, FakeDoc>();
  m.set(id, { ...data, id });
  store.set(col, m);
}
function docData(col: string, id: string): FakeDoc | undefined {
  return store.get(col)?.get(id);
}

// ─────────────────────────── Mocks ───────────────────────────

vi.mock('@/lib/firebase-admin', () => ({ getAdminDb: vi.fn(() => fakeDb) }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/auth', () => ({
  verifyAdminOrCleanupToken: vi.fn(() => true),
  NO_STORE_401_HEADERS: {},
}));
vi.mock('@/lib/telegram', () => ({
  getTelegramConfig: vi.fn(async () => ({ token: 't', chatId: 'c' })),
}));
vi.mock('@/lib/data', () => ({
  getNewsBySlug: vi.fn(async () => null),
}));

const fetchMock = vi.fn(async () => ({
  ok: true,
  json: async () => ({ ok: true }),
}));
vi.stubGlobal('fetch', fetchMock);

import { POST as niosQueuePost } from '@/app/api/admin/nios-queues/route';
import { approveAndExecuteAction, rejectAction } from '@/lib/nios/action-engine';
import { claimSlug, claimUniqueSlug } from '@/lib/slug';

function queueReq(body: unknown) {
  return new Request('http://localhost/api/admin/nios-queues', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-token': 'ok' },
    body: JSON.stringify(body),
  });
}

function seedQueueItem(status = 'PREPARED', extra: Record<string, any> = {}) {
  seed('nios_distribution_queue', 'q-1', {
    id: 'q-1', status, message: 'Hola', slug: 'nota-x', actionId: 'act-q',
    createdAt: new Date().toISOString(), ...extra,
  });
}

beforeEach(() => {
  store.clear();
  fetchMock.mockClear();
});

describe('nios-queues — claim atómico del envío Telegram (CODE-02)', () => {
  it('doble send concurrente: solo UN mensaje a Telegram, el segundo recibe 409', async () => {
    seedQueueItem();
    const [r1, r2] = await Promise.all([
      niosQueuePost(queueReq({ queue: 'distribution', id: 'q-1', action: 'send' })),
      niosQueuePost(queueReq({ queue: 'distribution', id: 'q-1', action: 'send' })),
    ]);
    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([200, 409]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(docData('nios_distribution_queue', 'q-1')!.status).toBe('SENT');
    expect(docData('nios_actions', undefined as any)).toBeUndefined();
  });

  it('send tras send → 409 y cero llamadas nuevas a Telegram', async () => {
    seedQueueItem('SENT');
    const res = await niosQueuePost(queueReq({ queue: 'distribution', id: 'q-1', action: 'send' }));
    expect(res.status).toBe(409);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('dismiss mientras hay un claim SENDING activo → 409', async () => {
    seedQueueItem('SENDING', { sendingAt: new Date().toISOString() });
    const res = await niosQueuePost(queueReq({ queue: 'distribution', id: 'q-1', action: 'dismiss' }));
    expect(res.status).toBe(409);
  });

  it('claim SENDING estancado (>10 min) puede reclamarse — sin deadlock', async () => {
    seedQueueItem('SENDING', { sendingAt: new Date(Date.now() - 11 * 60 * 1000).toISOString() });
    const res = await niosQueuePost(queueReq({ queue: 'distribution', id: 'q-1', action: 'send' }));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fallo de Telegram devuelve el item a PREPARED (reintento manual posible)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ ok: false, description: 'x' }) } as any);
    seedQueueItem();
    const res = await niosQueuePost(queueReq({ queue: 'distribution', id: 'q-1', action: 'send' }));
    expect(res.status).toBe(502);
    expect(docData('nios_distribution_queue', 'q-1')!.status).toBe('PREPARED');
  });
});

describe('action-engine — transiciones de estado protegidas (CODE-03)', () => {
  const baseAction = {
    id: 'act-1', actionId: 'act-1', opportunityId: 'op-1',
    kind: 'seo-query', target: 'consulta x', title: 'Exp',
    createdAt: new Date().toISOString(), proposedAt: new Date().toISOString(),
    before: {}, after: {}, source: 'nios-growth-radar',
  };

  it('segunda aprobación concurrente no re-ejecuta — el claim PENDING→RUNNING es único', async () => {
    seed('nios_actions', 'act-1', { ...baseAction, status: 'PENDING' });
    const [r1, r2] = await Promise.allSettled([
      approveAndExecuteAction('act-1', 'tester'),
      approveAndExecuteAction('act-1', 'tester'),
    ]);
    const rejected = [r1, r2].filter((r) => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    // una sola ejecución → un solo experimento SEO en cola
    expect(colDocs('nios_seo_experiments')).toHaveLength(1);
  });

  it('una acción COMPLETED no puede re-aprobarse ni rechazarse', async () => {
    seed('nios_actions', 'act-1', { ...baseAction, status: 'COMPLETED' });
    await expect(approveAndExecuteAction('act-1')).rejects.toThrow('COMPLETED');
    await expect(rejectAction('act-1', 'x')).rejects.toThrow('COMPLETED');
    expect(docData('nios_actions', 'act-1')!.status).toBe('COMPLETED');
  });

  it('reject desde PENDING funciona y escribe memoria de rechazo una vez', async () => {
    seed('nios_actions', 'act-1', { ...baseAction, status: 'PENDING' });
    const [r1, r2] = await Promise.allSettled([
      rejectAction('act-1', 'no aplica', 'tester'),
      rejectAction('act-1', 'no aplica', 'tester'),
    ]);
    expect([r1, r2].filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(docData('nios_actions', 'act-1')!.status).toBe('REJECTED');
    expect(colDocs('nios_memory')).toHaveLength(1);
  });
});

describe('slug_claims — unicidad atómica de slugs (CODE-07)', () => {
  it('el segundo claim del mismo slug pierde', async () => {
    expect(await claimSlug(fakeDb, 'mi-slug')).toBe(true);
    expect(await claimSlug(fakeDb, 'mi-slug')).toBe(false);
  });

  it('claimUniqueSlug asigna sufijos bajo contención real', async () => {
    seed('noticias', 'n-1', { slug: 'nota-x', titulo: 'x' });
    const [a, b, c] = await Promise.all([
      claimUniqueSlug(fakeDb, 'nota x'),
      claimUniqueSlug(fakeDb, 'nota x'),
      claimUniqueSlug(fakeDb, 'nota x'),
    ]);
    expect(new Set([a, b, c]).size).toBe(3);
    expect([a, b, c].sort()).toEqual(['nota-x-1', 'nota-x-2', 'nota-x-3']);
  });

  it('un artículo existente sin claim también bloquea el slug', async () => {
    seed('noticias', 'n-9', { slug: 'vieja-nota', titulo: 'x' });
    expect(await claimSlug(fakeDb, 'vieja-nota')).toBe(false);
  });
});
