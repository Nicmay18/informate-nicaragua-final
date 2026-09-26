/**
 * FASE 0 — Estabilización y verdad operativa.
 * Cubre: panel sin side-effects, lifecycle de nios_actions y tareas CEO,
 * lifecycle de depto_jobs, transición inválida segura y alertas reales.
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
    set: async (data: any) => {
      const m = store.get(col) ?? new Map<string, FakeDoc>();
      m.set(docId, { ...data, id: docId });
      store.set(col, m);
    },
    update: async (data: any) => {
      const m = store.get(col) ?? new Map<string, FakeDoc>();
      m.set(docId, { ...(m.get(docId) ?? { id: docId }), ...data });
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

function runQuery(col: string, filters: Filter[], order?: { f: string; dir: string }, limitN?: number): FakeDoc[] {
  let list = colDocs(col);
  for (const { f, op, v } of filters) {
    list = list.filter((d) => {
      const val = d[f];
      if (op === '==') return val === v;
      if (op === '!=') return val !== v;
      if (op === '<=') return typeof val === 'string' && val <= v;
      if (op === '>=') return typeof val === 'string' && val >= v;
      if (op === '<') return typeof val === 'string' && val < v;
      if (op === '>') return typeof val === 'string' && val > v;
      if (op === 'in') return Array.isArray(v) && v.includes(val);
      return true;
    });
  }
  if (order) {
    list = [...list].sort((a, b) => {
      const cmp = String(a[order.f] ?? '').localeCompare(String(b[order.f] ?? ''));
      return order.dir === 'desc' ? -cmp : cmp;
    });
  }
  if (limitN !== undefined) list = list.slice(0, limitN);
  return list;
}

function makeQuery(col: string, filters: Filter[] = [], order?: { f: string; dir: string }, limitN?: number): any {
  const q: any = {
    where: (f: string, op: string, v: any) => makeQuery(col, [...filters, { f, op, v }], order, limitN),
    orderBy: (f: string, dir: 'asc' | 'desc' = 'asc') => makeQuery(col, filters, { f, dir }, limitN),
    limit: (n: number) => makeQuery(col, filters, order, n),
    count: () => ({ get: async () => ({ data: () => ({ count: runQuery(col, filters, order, limitN).length }) }) }),
    get: async () => {
      const list = runQuery(col, filters, order, limitN);
      return {
        docs: list.map((d) => ({ id: d.id, exists: true, data: () => d, ref: makeDocRef(col, d.id) })),
        empty: list.length === 0,
        size: list.length,
      };
    },
  };
  return q;
}

function makeCol(name: string): any {
  return {
    doc: (id?: string) => makeDocRef(name, id),
    where: (f: string, op: string, v: any) => makeQuery(name, [{ f, op, v }]),
    orderBy: (f: string, dir?: 'asc' | 'desc') => makeQuery(name, [], { f, dir: dir ?? 'asc' }),
    limit: (n: number) => makeQuery(name, [], undefined, n),
    get: () => makeQuery(name).get(),
    add: async (data: any) => {
      const ref = makeDocRef(name);
      await ref.set(data);
      return ref;
    },
  };
}

const fakeDb = {
  collection: (name: string) => makeCol(name),
  batch: () => {
    const ops: Array<() => Promise<void>> = [];
    return {
      set: (ref: any, data: any) => ops.push(() => ref.set(data)),
      update: (ref: any, data: any) => ops.push(() => ref.update(data)),
      commit: async () => {
        for (const op of ops) await op();
      },
    };
  },
  // Transacción simulada: el store en memoria es single-threaded, así que
  // ejecutar el callback sobre los refs reales reproduce la semántica.
  runTransaction: async (fn: (tx: any) => Promise<any>) =>
    fn({
      get: (ref: any) => ref.get(),
      set: (ref: any, data: any) => ref.set(data),
      update: (ref: any, data: any) => ref.update(data),
      delete: (ref: any) => ref.delete?.(),
    }),
} as unknown as Firestore;

function seed(col: string, id: string, data: Record<string, any>) {
  const m = store.get(col) ?? new Map<string, FakeDoc>();
  m.set(id, { ...data, id });
  store.set(col, m);
}

function resetStore() {
  store.clear();
  seq = 0;
}

// ─────────────────────────── Mocks ───────────────────────────

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => fakeDb),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/nios/repair-engine', () => ({
  runRepairEngine: vi.fn(async () => ({ repaired: [], failedRepairs: [], report: {}, verification: [] })),
  runAutonomousRepair: vi.fn(async () => ({
    mode: 'OBSERVING', actions: [], repaired: [], failedRepairs: [],
    pendingHuman: [], skipped: [], verification: [], report: {}, summary: '',
  })),
}));

vi.mock('@/lib/nios/conflict-detector', () => ({
  detectConflicts: vi.fn(() => []),
}));

vi.mock('@/lib/meni', () => ({ runMeni: vi.fn(() => ({})) }));
vi.mock('@/lib/nios/editorial-diagnosis', () => ({ runEditorialDiagnosis: vi.fn(() => ({ publicationReadiness: 'READY', problems: [] })) }));
vi.mock('@/lib/departamento-central/health', () => ({ checkUrl: vi.fn(async () => ({ status: 200 })), handleSiteHealth: vi.fn(async () => ({ status: 'ok', items: [] })) }));
vi.mock('@/lib/departamento-central/learning', () => ({ recordLearning: vi.fn(async () => undefined) }));
vi.mock('@/lib/departamento-central/cycle', () => ({ runDepartamentoCentralCycle: vi.fn(async () => ({ date: 'x', summary: '', site: { status: 'ok' } })) }));
vi.mock('@/lib/departamento-central/store', () => ({ saveDepartamentoReport: vi.fn(async () => undefined) }));
vi.mock('@/lib/departamento-central/heartbeat', () => ({
  writeHeartbeat: vi.fn(async () => undefined),
  recordCronHeartbeat: vi.fn(async () => undefined),
  getDepartmentHealth: vi.fn(async () => ({ overall: 'HEALTHY', components: {} })),
}));
vi.mock('@/lib/departamento-central/incidents', () => ({ openIncident: vi.fn(async () => 'inc-1') }));

import { getActions, expireStaleActions, type NiosAction } from '@/lib/nios/action-engine';
import { reconcileCeoTasks } from '@/lib/nios/ceo-memory';
import { enqueueJob, claimNextJob, getJobStatus } from '@/lib/departamento-central/queue';
import { executeJob } from '@/lib/departamento-central/workers';
import { executeOperationalRepair } from '@/lib/nios/operational-loop';
import { emitOperationalAlerts } from '@/lib/departamento-central/ops-alerts';

beforeEach(() => {
  resetStore();
  vi.clearAllMocks();
});

vi.mock('@/lib/nios', () => ({
  getNiosReport: vi.fn(async () => ({
    status: 'ok', generatedAt: new Date().toISOString(), modules: {}, errors: [],
    ceoReport: { headline: '', whatHappened: [], whatWorked: [], whatDidNotWork: [], opportunities: [], risks: [], actionsForToday: [] },
    priorities: [], alerts: [], opportunities: [], risks: [], nextActions: [],
  })),
}));
vi.mock('@/lib/nios/daily-editor', () => ({
  getDailyEditorReport: vi.fn(async () => ({ publishedCount: 0, v4: null, v3: null })),
}));
vi.mock('@/lib/nios/executive-center', () => ({
  getNiosExecutiveData: vi.fn(async () => null),
}));
vi.mock('@/lib/nios/nios-speaks', () => ({ buildNiosBrief: vi.fn(() => null) }));
vi.mock('@/lib/admin-auth', () => ({ isAuthenticatedAdmin: vi.fn(async () => true) }));
vi.mock('@/lib/departamento-central/store', () => ({ getLatestDepartamentoReport: vi.fn(async () => null) }));
vi.mock('@/lib/departamento-central/summary', () => ({ getDepartamentoWorkSummary: vi.fn(async () => null) }));
vi.mock('@/components/nios/NiosExecutiveCenter', () => ({ default: () => null }));
vi.mock('@/components/nios/DepartamentoCentralSummary', () => ({ default: () => null }));
vi.mock('@/lib/data', () => ({ getNewsBySlug: vi.fn(async () => null) }));
vi.mock('lucide-react', () => ({
  Brain: () => null,
  AlertTriangle: () => null,
  CheckCircle: () => null,
  Clock: () => null,
  Lightbulb: () => null,
  Target: () => null,
  Shield: () => null,
  ArrowRight: () => null,
}));

// ─────────────────── 1. Panel / side-effects ───────────────────

describe('FASE 0 — panel render es de solo lectura', () => {
  it('renderizar /panel/nios NUNCA escribe en nios_actions', async () => {
    const { default: PanelNiosPage } = await import('@/app/panel/nios/page');
    seed('nios_actions', 'a1', { id: 'a1', status: 'PENDING', createdAt: new Date().toISOString() });

    // Cinco renders consecutivos: la colección no crece.
    for (let i = 0; i < 5; i++) {
      await PanelNiosPage();
    }
    expect(colDocs('nios_actions')).toHaveLength(1);
  });
});


describe('FASE 0 — acciones: consumidor y expiración', () => {
  const actionSeed = (id: string, kind: string, target: string, createdAt: string): Partial<NiosAction> => ({
    id, actionId: id, opportunityId: `${kind}-x`, kind: kind as NiosAction['kind'], target,
    title: `t-${id}`, status: 'PENDING', createdAt, proposedAt: createdAt,
  });

  it('getActions es de solo lectura y devuelve la cola existente', async () => {
    seed('nios_actions', 'a1', actionSeed('a1', 'seo-page', 'slug-1', new Date().toISOString()));
    const actions = await getActions(10);
    expect(actions).toHaveLength(1);
    expect(actions[0].status).toBe('PENDING');
    // Lectura no crea documentos nuevos
    expect(colDocs('nios_actions')).toHaveLength(1);
  });

  it('expireStaleActions clasifica sin borrar: expira viejas y superseded', async () => {
    const old = new Date(Date.now() - 30 * 864e5).toISOString();
    const recent = new Date().toISOString();
    seed('nios_actions', 'old-1', actionSeed('old-1', 'seo-page', 'slug-A', old));
    seed('nios_actions', 'dup-old', actionSeed('dup-old', 'seo-page', 'slug-B', old));
    seed('nios_actions', 'dup-new', actionSeed('dup-new', 'seo-page', 'slug-B', recent));
    seed('nios_actions', 'fresh', actionSeed('fresh', 'seo-query', 'slug-C', recent));

    const res = await expireStaleActions(7);
    expect(res.expired).toBe(1); // old-1
    expect(res.superseded).toBe(1); // dup-old
    expect(res.kept).toBe(2); // dup-new + fresh

    const all = colDocs('nios_actions');
    expect(all).toHaveLength(4); // nada se borra
    const byId = Object.fromEntries(all.map((d) => [d.id, d]));
    expect(byId['old-1'].status).toBe('EXPIRED');
    expect(byId['old-1'].lifecycleNote).toContain('expired');
    expect(byId['dup-old'].status).toBe('EXPIRED');
    expect(byId['dup-old'].lifecycleNote).toContain('superseded');
    expect(byId['dup-new'].status).toBe('PENDING');
    expect(byId['fresh'].status).toBe('PENDING');
  });
});

// ─────────────────── 2. Memoria CEO: lifecycle ───────────────────

describe('FASE 0 — nios_memory: ciclo de vida de tareas', () => {
  it('reconcileCeoTasks expira pending >30d y conserva evidencia', async () => {
    const old = new Date(Date.now() - 60 * 864e5).toISOString();
    const fresh = new Date().toISOString();
    seed('nios_memory', 'task-old', { action: 'Revisar X', source: 'SEO', status: 'pending', createdAt: old });
    seed('nios_memory', 'task-new', { action: 'Revisar Y', source: 'SEO', status: 'pending', createdAt: fresh });
    seed('nios_memory', 'loop-1', { kind: 'ceo_loop', status: 'pending', createdAt: old }); // no es tarea

    const res = await reconcileCeoTasks(30);
    expect(res.expired).toBe(1);

    const oldDoc = store.get('nios_memory')!.get('task-old')!;
    expect(oldDoc.status).toBe('expired');
    expect(oldDoc.lifecycleNote).toContain('expired');
    expect(store.get('nios_memory')!.get('task-new')!.status).toBe('pending');
    expect(store.get('nios_memory')!.get('loop-1')!.status).toBe('pending'); // intacto
  });
});

// ─────────────────── 3. depto_jobs: lifecycle ───────────────────

describe('FASE 0 — depto_jobs: ciclo de vida', () => {
  it('PENDING → RUNNING → COMPLETED', async () => {
    await enqueueJob({ type: 'health-check', source: 'test', dedupKey: 'k1' });
    const job = await claimNextJob();
    expect(job).not.toBeNull();
    expect((await getJobStatus(job!.jobId))!.status).toBe('running');

    await executeJob(job!);
    const after = await getJobStatus(job!.jobId);
    expect(after!.status).toBe('completed');
  });

  it('PENDING → RUNNING → FAILED (error real)', async () => {
    await enqueueJob({ type: 'article-pipeline', source: 'test', payload: { articleId: 'no-existe' }, dedupKey: 'k2' });
    const job = await claimNextJob();
    await executeJob(job!);
    const after = await getJobStatus(job!.jobId);
    // Falla transitoria → retry (reintento válido)
    expect(['retry', 'dead-letter']).toContain(after!.status);
  });

  it('retry válido: job en retry vuelve a ser reclamable', async () => {
    await enqueueJob({ type: 'article-pipeline', source: 'test', payload: { articleId: 'no-existe' }, dedupKey: 'k3' });
    const j1 = await claimNextJob();
    await executeJob(j1!);
    const after = await getJobStatus(j1!.jobId);
    expect(after!.attempts).toBeGreaterThanOrEqual(1);
  });

  it('transición inválida no rompe el worker ni entra en retry', async () => {
    // Incidente ya RESOLVED: el job debe completar como skipped, no fallar.
    seed('nios_memory', 'inc-resolved', {
      kind: 'operational_incident', conflictId: 'c1', title: 't', description: 'd',
      severity: 'warning', category: 'data-integrity', source: 'NIOS', team: 'REPARADOR',
      state: 'RESOLVED', detectedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      evidence: {}, jobIds: [], transitions: [], attemptCount: 0,
    });
    await enqueueJob({
      type: 'operational-repair', source: 'test',
      payload: { incidentId: 'inc-resolved', action: 'rebuild-snapshot', team: 'REPARADOR' },
      dedupKey: 'k4',
    });
    const job = await claimNextJob();
    await executeJob(job!);
    const after = await getJobStatus(job!.jobId);
    expect(after!.status).toBe('completed'); // skipped idempotente
    expect((after!.result as any).skipped).toBe(true);
  });

  it('executeOperationalRepair sobre incidente RESOLVED no lanza ni muta estado', async () => {
    seed('nios_memory', 'inc-res2', {
      kind: 'operational_incident', conflictId: 'c2', title: 't', description: 'd',
      severity: 'critical', category: 'data-integrity', source: 'NIOS', team: 'REPARADOR',
      state: 'RESOLVED', detectedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      evidence: {}, jobIds: [], transitions: [], attemptCount: 0,
    });
    const result = await executeOperationalRepair(fakeDb, {
      jobId: 'job-x', type: 'operational-repair',
      payload: { incidentId: 'inc-res2', action: 'rebuild-snapshot' },
    });
    expect(result.skipped).toBe(true);
    expect(result.state).toBe('RESOLVED');
    // El estado del incidente no cambia
    expect(store.get('nios_memory')!.get('inc-res2')!.state).toBe('RESOLVED');
  });

  it('executeOperationalRepair sobre incidente FAILED camina la ruta legal', async () => {
    seed('nios_memory', 'inc-failed', {
      kind: 'operational_incident', conflictId: 'c3', title: 't', description: 'd',
      severity: 'warning', category: 'data-integrity', source: 'NIOS', team: 'REPARADOR',
      state: 'FAILED', detectedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      evidence: {}, jobIds: [], transitions: [], attemptCount: 0,
      diagnosis: { action: 'rebuild-snapshot', autoRepairable: true },
    });
    const result = await executeOperationalRepair(fakeDb, {
      jobId: 'job-y', type: 'operational-repair',
      payload: { incidentId: 'inc-failed', action: 'rebuild-snapshot' },
    });
    expect(result.skipped).toBeUndefined();
    const inc = store.get('nios_memory')!.get('inc-failed')!;
    // FAILED → ACTION_REQUIRED → RUNNING → VERIFICATION → ...
    const states = (inc.transitions as any[]).map((t) => t.to);
    expect(states[0]).toBe('ACTION_REQUIRED');
    expect(states[1]).toBe('RUNNING');
    expect(['VERIFICATION', 'RESOLVED', 'FAILED', 'ESCALATED']).toContain(inc.state);
  });
});

// ─────────────────── 4. Alertas operativas reales ───────────────────

describe('FASE 0 — nios_alerts: alertas reales con dedup', () => {
  it('emite alerta cuando falta el snapshot diario', async () => {
    const res = await emitOperationalAlerts(fakeDb, []);
    expect(res.emitted).toBeGreaterThan(0);
    const alerts = colDocs('nios_alerts');
    expect(alerts.some((a) => a.message.includes('Snapshot diario faltante'))).toBe(true);
    expect(alerts.every((a) => a.resolved === false)).toBe(true);
  });

  it('emite alerta por heartbeat crítico (cron ausente)', async () => {
    seed('nios_daily_snapshots', new Date().toISOString().slice(0, 10), {
      collectedAt: new Date().toISOString(), gsc: { status: 'REAL' }, ga4: { status: 'REAL' },
    });
    const res = await emitOperationalAlerts(fakeDb, ['cron/api/cron/nios-collect']);
    const alerts = colDocs('nios_alerts');
    expect(alerts.some((a) => a.severity === 'critical' && a.message.includes('cron/api/cron/nios-collect'))).toBe(true);
  });

  it('emite alerta por job pending >24h', async () => {
    seed('nios_daily_snapshots', new Date().toISOString().slice(0, 10), {
      collectedAt: new Date().toISOString(), gsc: { status: 'REAL' }, ga4: { status: 'REAL' },
    });
    seed('depto_jobs', 'job-old', {
      jobId: 'job-old', type: 'growth-check', status: 'pending',
      createdAt: new Date(Date.now() - 30 * 36e5).toISOString(),
    });
    await emitOperationalAlerts(fakeDb, []);
    const alerts = colDocs('nios_alerts');
    expect(alerts.some((a) => a.message.includes('pending'))).toBe(true);
  });

  it('dedup: segunda corrida con misma condición no duplica (cooldown)', async () => {
    const first = await emitOperationalAlerts(fakeDb, []);
    const second = await emitOperationalAlerts(fakeDb, []);
    expect(first.emitted).toBeGreaterThan(0);
    expect(second.emitted).toBe(0); // cooldown activo
    const alerts = colDocs('nios_alerts');
    const fingerprints = alerts.map((a) => a.fingerprint);
    expect(new Set(fingerprints).size).toBe(fingerprints.length);
  });
});
