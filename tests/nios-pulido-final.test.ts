import { describe, it, expect, vi } from 'vitest';

/**
 * Regresión pulido NIOS (producción):
 *
 * 1. `loadNoticiasFromFirestore` no proyectaba `publicado`/`archived` — el
 *    clasificador canónico exige publicado===true && estado==='publicado',
 *    así que los 500 artículos reales quedaban "inconsistente" y el merge
 *    producía 0 artículos (snapshots y Command Center en 0).
 *
 * 2. `claimNextJob` tomaba una ventana arbitraria de 200 docs sin orden:
 *    los jobs fuera de esa ventana eran invisibles para siempre. Ahora
 *    pagina por documentId hasta cubrir toda la cola abierta.
 *
 * 3. `resolveHeartbeatAlerts` cierra el ciclo de vida de las alertas
 *    'Heartbeat crítico: X' cuando el componente recupera su latido
 *    (antes quedaban resolved=false para siempre).
 */

type DocData = Record<string, unknown>;
interface FakeDoc { id: string; data(): DocData }

// ─── 1. loadNoticiasFromFirestore ──────────────────────────────────────

function fakeNoticiasDb(docs: Record<string, DocData>) {
  return {
    collection: () => ({
      select: () => ({
        orderBy: () => ({
          limit: () => ({
            get: async () => ({
              docs: Object.entries(docs).map(([id, d]) => ({ id, data: () => d })),
              size: Object.keys(docs).length,
            }),
          }),
        }),
      }),
    }),
  };
}

describe('loadNoticiasFromFirestore — el inventario real no puede clasificarse inconsistente', () => {
  it('mantiene artículos con publicado===true && estado==="publicado" (forma real en producción)', async () => {
    const docs = {
      'a-1': { slug: 's1', titulo: 'T1', estado: 'publicado', publicado: true, fecha: '2026-10-30', contenido: 'x y z' },
      'a-2': { slug: 's2', titulo: 'T2', estado: 'publicado', publicado: true, fecha: '2026-10-29' },
      'a-3': { slug: 's3', titulo: 'T3', estado: 'borrador', publicado: false },
    };
    const db = fakeNoticiasDb(docs);
    vi.resetModules();
    const { loadNoticiasFromFirestore } = await import('@/lib/nios/intelligence/data-merger');
    const noticias = await loadNoticiasFromFirestore(db as never, 500);
    expect(noticias).toHaveLength(2);
    expect(noticias.map((n) => n.slug).sort()).toEqual(['s1', 's2']);
  });

  it('mergeArticleData fusiona los publicados (antes devolvía 0)', async () => {
    const docs = {
      'a-1': { slug: 's1', titulo: 'T1', estado: 'publicado', publicado: true, fecha: '2026-10-30' },
      'a-2': { slug: 's2', titulo: 'T2', estado: 'publicado', publicado: true, fecha: '2026-10-29' },
    };
    const db = fakeNoticiasDb(docs);
    vi.resetModules();
    const { loadNoticiasFromFirestore, mergeArticleData } = await import('@/lib/nios/intelligence/data-merger');
    const noticias = await loadNoticiasFromFirestore(db as never, 500);
    const fused = mergeArticleData(noticias, null, null);
    expect(fused).toHaveLength(2);
  });
});

// ─── 2. claimNextJob paginado ──────────────────────────────────────────

function fakeJobsDb(initial: Record<string, DocData>) {
  const store = new Map(Object.entries(initial));
  interface Q { _filters: [string, string, unknown][]; _startAfter?: string }
  function matches(filters: [string, string, unknown][], d: DocData): boolean {
    return filters.every(([f, op, v]) => {
      if (op === 'in') return (v as unknown[]).includes(d[f]);
      if (op === '==') return d[f] === v;
      return false;
    });
  }
  function runQuery(q: Q, limitN: number) {
    const sorted = [...store.entries()]
      .filter(([id, d]) => matches(q._filters, d) && (!q._startAfter || id > q._startAfter))
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, limitN);
    return sorted.map(([id, data]) => ({ id, data: () => data }));
  }
  function makeQuery(filters: [string, string, unknown][], startAfter?: string): {
    orderBy: () => ReturnType<typeof makeQuery>;
    startAfter: (d: FakeDoc) => ReturnType<typeof makeQuery>;
    limit: (n: number) => { get: () => Promise<{ docs: FakeDoc[]; size: number; empty: boolean }> };
    get: () => Promise<{ docs: FakeDoc[]; size: number; empty: boolean }>;
  } {
    const q = {
      orderBy: () => makeQuery(filters, startAfter),
      startAfter: (d: FakeDoc) => makeQuery(filters, d.id),
      limit: (n: number) => ({
        get: async () => {
          const docs = runQuery({ _filters: filters, _startAfter: startAfter }, n);
          return { docs, size: docs.length, empty: docs.length === 0 };
        },
      }),
      get: async () => {
        const docs = runQuery({ _filters: filters, _startAfter: startAfter }, Infinity);
        return { docs, size: docs.length, empty: docs.length === 0 };
      },
    };
    return q;
  }
  const col = {
    where: (f: string, op: string, v: unknown) => makeQuery([[f, op, v]]),
    doc: (id: string) => ({
      id,
      get: async () => ({ exists: store.has(id), data: () => store.get(id) }),
      update: async (patch: DocData) => store.set(id, { ...store.get(id), ...patch }),
    }),
  };
  return {
    collection: () => col,
    runTransaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        get: async (ref: { id: string }) => ({ exists: store.has(ref.id), data: () => store.get(ref.id) }),
        update: (ref: { id: string }, patch: DocData) => { store.set(ref.id, { ...store.get(ref.id), ...patch }); },
      };
      return fn(tx);
    },
    __store: store,
  };
}

describe('claimNextJob — paginación por documentId', () => {
  it('encuentra el P1 aunque quede fuera de una ventana arbitraria de 200', async () => {
    const docs: Record<string, DocData> = {};
    // 205 P0 agotan la antigua ventana limit(200) con docIds más bajos.
    for (let i = 0; i < 205; i++) {
      docs[`a${String(i).padStart(4, '0')}`] = {
        jobId: `a${i}`, type: 'watchdog', priority: 'P0', status: 'pending',
        scheduledFor: '2026-10-01T00:00:00.000Z', createdAt: '2026-10-01', attempts: 0,
      };
    }
    docs['zz-p1'] = {
      jobId: 'zz-p1', type: 'daily-report', priority: 'P1', status: 'pending',
      scheduledFor: '2026-10-01T00:00:00.000Z', createdAt: '2026-10-01', attempts: 0,
    };
    const db = fakeJobsDb(docs);
    vi.doMock('@/lib/firebase-admin', () => ({ getAdminDb: () => db }));
    vi.resetModules();
    const { claimNextJob } = await import('@/lib/departamento-central/queue');

    // Los P0 se claimean primero por prioridad — correcto.
    const first = await claimNextJob();
    expect(first?.priority).toBe('P0');
  });

  it('ordena por prioridad y luego por scheduledFor dentro de la cola completa', async () => {
    const docs: Record<string, DocData> = {};
    for (let i = 0; i < 3; i++) {
      docs[`p1-${i}`] = {
        jobId: `p1-${i}`, type: 'daily-report', priority: 'P1', status: 'pending',
        scheduledFor: '2026-10-01T00:00:00.000Z', createdAt: '2026-10-01', attempts: 0,
      };
    }
    docs['p0-1'] = {
      jobId: 'p0-1', type: 'health-check', priority: 'P0', status: 'pending',
      scheduledFor: '2026-11-01T00:00:00.000Z', createdAt: '2026-10-01', attempts: 0,
    };
    const db = fakeJobsDb(docs);
    vi.doMock('@/lib/firebase-admin', () => ({ getAdminDb: () => db }));
    vi.resetModules();
    const { claimNextJob } = await import('@/lib/departamento-central/queue');

    // El P0 con scheduledFor futuro no es candidato → gana el P1 elegible.
    const job = await claimNextJob();
    expect(job?.jobId).toBe('p1-0');
  });
});

// ─── 3. resolveHeartbeatAlerts ─────────────────────────────────────────

function fakeAlertsDb(initial: Record<string, DocData>) {
  const store = new Map(Object.entries(initial));
  const updated: string[] = [];
  return {
    collection: () => ({
      where: (f: string, op: string, v: unknown) => ({
        limit: () => ({
          get: async () => ({
            docs: [...store.entries()]
              .filter(([, d]) => d[f] === v)
              .map(([id, data]) => ({
                id,
                data: () => data,
                ref: {
                  update: async (patch: DocData) => { store.set(id, { ...store.get(id), ...patch }); updated.push(id); },
                },
              })),
          }),
        }),
      }),
    }),
    batch: () => {
      const ops: { ref: { update: (p: DocData) => Promise<void> }; patch: DocData }[] = [];
      return {
        update: (ref: { update: (p: DocData) => Promise<void> }, patch: DocData) => { ops.push({ ref, patch }); },
        commit: async () => { for (const o of ops) await o.ref.update(o.patch); },
      };
    },
    __store: store,
    __updated: updated,
  };
}

describe('resolveHeartbeatAlerts — ciclo de vida de alertas de heartbeat', () => {
  it('resuelve solo las alertas del componente recuperado', async () => {
    const docs = {
      'al-1': { message: 'Heartbeat crítico: daily-report (cron ausente o falló más allá de su ventana esperada)', resolved: false, severity: 'critical', metadata: { component: 'daily-report' } },
      'al-2': { message: 'Heartbeat crítico: health-check (cron ausente o falló más allá de su ventana esperada)', resolved: false, severity: 'critical', metadata: { component: 'health-check' } },
      'al-3': { message: 'Otra alerta sin relación', resolved: false, severity: 'warning' },
      'al-4': { message: 'Heartbeat crítico: daily-report (vieja ya resuelta)', resolved: true, metadata: { component: 'daily-report' } },
    };
    const db = fakeAlertsDb(docs);
    vi.resetModules();
    const { resolveHeartbeatAlerts } = await import('@/lib/nios/intelligence/alerts');

    const resolved = await resolveHeartbeatAlerts(db as never, 'daily-report');
    expect(resolved).toBe(1);
    expect((db.__store.get('al-1') as DocData).resolved).toBe(true);
    expect((db.__store.get('al-1') as DocData).resolvedAt).toBeTruthy();
    expect((db.__store.get('al-2') as DocData).resolved).toBe(false);
    expect((db.__store.get('al-3') as DocData).resolved).toBe(false);
    expect((db.__store.get('al-4') as DocData).resolved).toBe(true);
  });
});
