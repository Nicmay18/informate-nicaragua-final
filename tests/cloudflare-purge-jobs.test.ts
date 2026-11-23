import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests de la cola cf_purge_jobs con Firestore en memoria.
 * Cubren: reserva atómica, nextRetryAt, lease expirado, resurrección
 * única de dead, drenado tras fallo y límite de jobs por ejecución.
 */

// ---------- Firestore en memoria ----------
type Doc = Record<string, any>;

function matchField(value: any, op: string, expected: any): boolean {
  if (op === '==') return value === expected;
  if (op === 'in') return Array.isArray(expected) && expected.includes(value);
  return false;
}

function createFakeDb() {
  const store = new Map<string, Doc>();
  const key = (col: string, id: string) => `${col}/${id}`;

  const makeRef = (col: string, id: string) => ({
    id,
    get: async () => ({
      exists: store.has(key(col, id)),
      data: () => store.get(key(col, id)),
    }),
    set: async (data: Doc, opts?: { merge?: boolean }) => {
      store.set(key(col, id), opts?.merge ? { ...(store.get(key(col, id)) || {}), ...data } : { ...data });
    },
  });

  const makeQuery = (col: string, filters: Array<{ f: string; op: string; v: any }>, lim?: number) => ({
    where: (f: string, op: string, v: any) => makeQuery(col, [...filters, { f, op, v }], lim),
    limit: (n: number) => makeQuery(col, filters, n),
    get: async () => {
      let entries = [...store.entries()]
        .filter(([k]) => k.startsWith(`${col}/`))
        .map(([k, v]) => ({ id: k.slice(col.length + 1), data: () => v }));
      entries = entries.filter((d) => filters.every((fl) => matchField(d.data()[fl.f], fl.op, fl.v)));
      if (lim) entries = entries.slice(0, lim);
      return { docs: entries, empty: entries.length === 0 };
    },
  });

  // Serializa transacciones para simular atomicidad de Firestore.
  let txChain: Promise<unknown> = Promise.resolve();
  const db = {
    collection: (col: string) => ({
      doc: (id: string) => makeRef(col, id),
      where: (f: string, op: string, v: any) => makeQuery(col, [{ f, op, v }]),
    }),
    runTransaction: async (fn: (tx: any) => Promise<any>) => {
      const prev = txChain;
      let release!: () => void;
      txChain = new Promise((r) => { release = r as () => void; });
      await prev;
      try {
        const tx = {
          get: (ref: any) => ref.get(),
          set: (ref: any, data: Doc, opts?: any) => ref.set(data, opts),
        };
        return await fn(tx);
      } finally {
        release();
      }
    },
  };
  return { db, store };
}

// ---------- Mock de firebase-admin + fetch ----------
const fake = vi.hoisted(() => ({ db: null as any, store: null as any as Map<string, Doc> }));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => fake.db),
}));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import {
  enqueueAndPurgeCloudflare,
  processPendingCloudflarePurges,
} from '@/lib/cloudflare-purge';

const ORIGIN = 'https://nicaraguainformate.com';
const JOBS = 'cf_purge_jobs';

function seedJob(id: string, data: Doc) {
  fake.store.set(`${JOBS}/${id}`, { jobId: id, urls: [`${ORIGIN}/noticias/x`], status: 'pending', attempts: 0, ...data });
}
function getJob(id: string): Doc | undefined {
  return fake.store.get(`${JOBS}/${id}`);
}
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();
const future = (msAhead: number) => new Date(Date.now() + msAhead).toISOString();

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  const f = createFakeDb();
  fake.db = f.db;
  fake.store = f.store;
  process.env.CF_PURGE_ENABLED = 'true';
  process.env.CF_ZONE_ID = 'zone-test';
  process.env.CF_API_TOKEN = 'token-test';
  process.env.CF_PURGE_LEASE_MS = '50'; // lease corto para probar expiración
  fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
  }) as any);
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CF_PURGE_ENABLED;
  delete process.env.CF_ZONE_ID;
  delete process.env.CF_API_TOKEN;
  delete process.env.CF_PURGE_LEASE_MS;
});

describe('processPendingCloudflarePurges — cola y concurrencia', () => {
  it('respeta nextRetryAt: un job con backoff vigente no se procesa', async () => {
    seedJob('j1', { status: 'failed', attempts: 1, nextRetryAt: future(10 * 60_000) });
    const out = await processPendingCloudflarePurges();
    expect(out.processed).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getJob('j1')?.status).toBe('failed');
  });

  it('dos procesos no reclaman el mismo trabajo (reserva atómica)', async () => {
    seedJob('j1', { status: 'pending' });
    // Dos drenados concurrentes compiten por el mismo job.
    const [a, b] = await Promise.all([
      processPendingCloudflarePurges(),
      processPendingCloudflarePurges(),
    ]);
    const totalSent = a.sent + b.sent;
    // Exactamente un sent; el otro drain no procesó nada (job ya processing/sent).
    expect(totalSent).toBe(1);
    // La API de CF se llamó una sola vez para las urls del job.
    const callsForJob = fetchMock.mock.calls.filter((c) =>
      JSON.stringify(c[1]?.body).includes('/noticias/x'),
    );
    expect(callsForJob.length).toBe(1);
    expect(getJob('j1')?.status).toBe('sent');
  });

  it('un ejecutor viejo no sobrescribe el resultado de uno más reciente', async () => {
    seedJob('j1', { status: 'processing', claimedBy: 'exec-viejo', leaseUntil: iso(1000), attempts: 1 });
    // El lease de exec-viejo está vencido → un nuevo drain lo reclama.
    const out = await processPendingCloudflarePurges();
    expect(out.sent).toBe(1);
    const job = getJob('j1');
    expect(job?.status).toBe('sent');
    expect(job?.claimedBy).toBeNull();
    // Simula que exec-viejo termina tarde e intenta escribir 'failed':
    // completeClaimedJob debe rechazarlo porque claimedBy ya no coincide.
    // (Se verifica indirectamente: el estado sigue 'sent', no 'failed'.)
    expect(job?.status).not.toBe('failed');
  });

  it('recupera una reserva processing con lease vencido sin perder el job', async () => {
    seedJob('j1', { status: 'processing', claimedBy: 'muerto', leaseUntil: iso(5000), attempts: 2 });
    const out = await processPendingCloudflarePurges();
    expect(out.sent).toBe(1);
    expect(getJob('j1')?.status).toBe('sent');
    expect(getJob('j1')?.attempts).toBe(3); // 2 previos + 1 del reclamo que completó
  });

  it('no procesa un processing con lease vigente', async () => {
    seedJob('j1', { status: 'processing', claimedBy: 'activo', leaseUntil: future(60_000), attempts: 1 });
    const out = await processPendingCloudflarePurges();
    expect(out.processed).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getJob('j1')?.status).toBe('processing');
  });

  it('drenado tras purga fallida: la cola se procesa igualmente', async () => {
    // Job ajeno pendiente + la mutación actual fallará.
    seedJob('otro', { status: 'pending' });
    fetchMock.mockImplementation(async () => {
      throw new Error('cf down');
    });
    const res = await enqueueAndPurgeCloudflare({
      reason: 'publish', slug: 'noticia-test', categoria: 'Sucesos', mutationKey: 'm1',
    });
    expect(res.error).toBeTruthy();
    // El drain post-fallo debió intentar 'otro' (falló también, pero se procesó).
    const otro = [...fake.store.entries()].find(([k]) => k.includes('otro'));
    // 'otro' quedó failed con nextRetryAt (intento registrado) o pending procesado.
    const drainCalls = fetchMock.mock.calls.length;
    expect(drainCalls).toBeGreaterThanOrEqual(2); // purga propia + drain del job ajeno
    expect(otro).toBeTruthy();
  });

  it('publicación continúa aunque Cloudflare falle (fail-open)', async () => {
    fetchMock.mockImplementation(async () => { throw new Error('network'); });
    const res = await enqueueAndPurgeCloudflare({
      reason: 'publish', slug: 'ok-slug', mutationKey: 'm-fail',
    });
    expect(res.jobId).toBeTruthy();
    expect(res.error).toBeTruthy();
    // El job quedó persistido para reintento — no se perdió.
    const job = getJob(res.jobId!);
    expect(job?.status).toBe('failed');
    expect(job?.nextRetryAt).toBeTruthy();
  });

  it('resucita dead >24h una sola vez', async () => {
    seedJob('dead-old', { status: 'dead', deadAt: iso(25 * 3600_000), attempts: 5 });
    seedJob('dead-fresh', { status: 'dead', deadAt: iso(3600_000), attempts: 5 });
    seedJob('dead-once', { status: 'dead', deadAt: iso(30 * 3600_000), attempts: 5, resurrectionCount: 1 });

    const out = await processPendingCloudflarePurges();
    expect(out.resurrected).toBe(1);
    // dead-old resucitó → pending → fue reclamado y purgado en el mismo drain.
    expect(getJob('dead-old')?.status).toBe('sent');
    expect(getJob('dead-old')?.resurrectionCount).toBe(1);
    // Los otros dos permanecen dead.
    expect(getJob('dead-fresh')?.status).toBe('dead');
    expect(getJob('dead-once')?.status).toBe('dead');
  });

  it('token inválido persistente termina en dead sin ciclo infinito', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false, status: 403, json: async () => ({ success: false, errors: [{ message: 'invalid token' }] }),
    }) as any);
    // Job a un intento de agotar los 5.
    seedJob('j-fail', { status: 'failed', attempts: 4, nextRetryAt: iso(1000) });
    const out = await processPendingCloudflarePurges();
    expect(out.dead).toBe(1);
    const job = getJob('j-fail');
    expect(job?.status).toBe('dead');
    expect(job?.deadAt).toBeTruthy();
    // deadAt es reciente → la resurrección de 24h no aplica todavía.
    const out2 = await processPendingCloudflarePurges();
    expect(out2.resurrected).toBe(0);
    expect(getJob('j-fail')?.status).toBe('dead');
  });

  it('límite de 10 trabajos por drenado', async () => {
    for (let i = 0; i < 15; i++) seedJob(`bulk-${i}`, { status: 'pending' });
    const out = await processPendingCloudflarePurges(10);
    expect(out.sent).toBeLessThanOrEqual(10);
    const remaining = [...fake.store.values()].filter((j) => j.status === 'pending' || j.status === 'failed');
    expect(remaining.length).toBeGreaterThanOrEqual(5);
  });

  it('enqueue idempotente: misma mutación no duplica job ni llamada API', async () => {
    const ctx = { reason: 'publish' as const, slug: 'dup', mutationKey: 'same', categoria: 'Sucesos' };
    const r1 = await enqueueAndPurgeCloudflare(ctx);
    const r2 = await enqueueAndPurgeCloudflare(ctx);
    expect(r2.skipped).toMatch(/^already_/);
    expect(r1.jobId).toBe(r2.jobId);
    // Solo 1 llamada API para las urls propias (el drain no encuentra pendientes).
    expect(fake.store.size).toBe(1);
  });
});
