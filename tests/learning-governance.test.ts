/**
 * Learning Governance — garantías del ciclo de aprendizaje gobernado.
 * Cubre: corrección→candidato, validación de predicciones con datos reales,
 * gate de comportamiento (solo ACTIVE aplica), rollback, honestidad
 * editorial (dudas no penalizan), QUEUED≠COMPLETED.
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
function docData(col: string, id: string): FakeDoc | undefined {
  return store.get(col)?.get(id);
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
      const val = f.split('.').reduce((o: any, k) => o?.[k], d);
      if (op === '==') return val === v;
      if (op === '<=') return typeof val === 'string' && val <= v;
      if (op === '<') return typeof val === 'string' && val < v;
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
  return {
    where: (f: string, op: string, v: any) => makeQuery(col, [...filters, { f, op, v }], order, limitN),
    orderBy: (f: string, dir: 'asc' | 'desc' = 'asc') => makeQuery(col, filters, { f, dir }, limitN),
    limit: (n: number) => makeQuery(col, filters, order, n),
    get: async () => {
      const list = runQuery(col, filters, order, limitN);
      return {
        docs: list.map(d => ({ id: d.id, exists: true, data: () => d, ref: makeDocRef(col, d.id) })),
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
      set: (ref: any, data: any, opts?: any) => ops.push(() => ref.set(data, opts)),
      update: (ref: any, data: any) => ops.push(() => ref.update(data)),
      delete: (ref: any) => ops.push(async () => { /* noop en fake */ }),
      commit: async () => { for (const op of ops) await op(); },
    };
  },
  runTransaction: async (fn: (tx: any) => Promise<any>) =>
    fn({ get: (r: any) => r.get(), set: (r: any, d: any) => r.set(d), update: (r: any, d: any) => r.update(d) }),
} as unknown as Firestore;

function seed(col: string, id: string, data: Record<string, any>) {
  const m = store.get(col) ?? new Map<string, FakeDoc>();
  m.set(id, { ...data, id });
  store.set(col, m);
}

// ─────────────────────────── Mocks ───────────────────────────

vi.mock('@/lib/firebase-admin', () => ({ getAdminDb: vi.fn(() => fakeDb) }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/data', () => ({
  getNewsBySlug: vi.fn(async (slug: string) =>
    slug === 'nota-real'
      ? { id: 'art-1', slug, titulo: 'Nota real', resumen: 'Resumen de prueba' }
      : null),
}));

import { registerCorrection, loadEditorPatterns } from '@/lib/meni/editor-jefe/correction-tracker';
import { transitionLearning, getLearningStateReport } from '@/lib/meni/learning-engine/lifecycle';
import { validateMeniPredictions } from '@/lib/meni/prediction-validator';
import { approveAndExecuteAction } from '@/lib/nios/action-engine';
import { runStoryCompletenessEngine } from '@/lib/meni/editorial-brain/story-completeness-engine';

beforeEach(() => {
  store.clear();
  seq = 0;
  vi.clearAllMocks();
});

// ─────────────── Aprendizaje gobernado ───────────────

describe('Aprendizaje gobernado — corrección → candidato → activo', () => {
  const correccion = {
    articleId: 'a1',
    campo: 'titulo' as const,
    antes: 'Este es un titulo editorial muy largo que el editor suele recortar para ajustarlo al estilo del medio',
    despues: 'Titulo corto',
    categoria: 'Sucesos',
  };

  it('3 correcciones reales del mismo tipo generan un candidato (nunca ACTIVE directo)', async () => {
    await registerCorrection(fakeDb, correccion);
    await registerCorrection(fakeDb, correccion);
    await registerCorrection(fakeDb, correccion);

    const pattern = colDocs('editor_patterns')[0];
    expect(pattern).toBeDefined();
    expect(pattern.learningState).toBe('CANDIDATE');
    expect(pattern.evidence.correctionsCount).toBe(3);
    // La transición quedó auditada en learning_cycles
    expect(colDocs('learning_cycles').some(c => c.to === 'CANDIDATE')).toBe(true);
  });

  it('un patrón no aprobado NO puede cambiar comportamiento productivo', async () => {
    for (let i = 0; i < 3; i++) await registerCorrection(fakeDb, correccion);
    // CANDIDATE no se carga en el diagnóstico
    expect(await loadEditorPatterns(fakeDb)).toHaveLength(0);
  });

  it('transición inválida OBSERVED→ACTIVE es rechazada por la máquina de estados', async () => {
    seed('editor_patterns', 'p1', { learningState: 'OBSERVED', descripcion: 'x' });
    const ok = await transitionLearning(fakeDb, 'p1', 'ACTIVE', { by: 'test' });
    expect(ok).toBe(false);
    expect(docData('editor_patterns', 'p1')?.learningState).toBe('OBSERVED');
  });

  it('solo ACTIVE aplica; ACTIVE→ROLLED_BACK lo desactiva sin borrar evidencia', async () => {
    for (let i = 0; i < 3; i++) await registerCorrection(fakeDb, correccion);
    const patternId = colDocs('editor_patterns')[0].id;

    // Ciclo gobernado completo
    expect(await transitionLearning(fakeDb, patternId, 'VALIDATING', { by: 'test', evidence: { regressionResult: 'ok' } })).toBe(true);
    expect(await loadEditorPatterns(fakeDb)).toHaveLength(0); // VALIDATING aún no aplica
    expect(await transitionLearning(fakeDb, patternId, 'APPROVED', { by: 'editor' })).toBe(true);
    expect(await loadEditorPatterns(fakeDb)).toHaveLength(0); // APPROVED aún no aplica
    expect(await transitionLearning(fakeDb, patternId, 'ACTIVE', { by: 'editor' })).toBe(true);

    const active = await loadEditorPatterns(fakeDb);
    expect(active).toHaveLength(1);
    expect(docData('editor_patterns', patternId)?.version).toBe(1);

    // Rollback: reversible, con evidencia conservada
    expect(await transitionLearning(fakeDb, patternId, 'ROLLED_BACK', { by: 'editor', note: 'empeoró diagnósticos' })).toBe(true);
    expect(await loadEditorPatterns(fakeDb)).toHaveLength(0);
    expect(docData('editor_patterns', 'p1' in {} ? 'x' : patternId)?.frecuencia).toBe(3); // evidencia intacta
    expect(docData('editor_patterns', patternId)?.rollbackReason).toBe('empeoró diagnósticos');
  });

  it('el reporte de estado distingue memoria de aprendizaje activo', async () => {
    for (let i = 0; i < 3; i++) await registerCorrection(fakeDb, correccion);
    const report = await getLearningStateReport(fakeDb);
    expect(report.byState.CANDIDATE).toBe(1);
    expect(report.byState.ACTIVE).toBeUndefined();
  });
});

// ─────────────── Validación de predicciones ───────────────

describe('Predicciones MENI — validación solo con datos reales', () => {
  const old = new Date(Date.now() - 10 * 86400000).toISOString();
  const fresh = new Date().toISOString();

  it('predicción antigua + artículo publicado/destacado → VALIDATED con fuentes reales', async () => {
    seed('noticias', 'a1', { publicado: true, estado: 'publicado', destacada: true });
    seed('meni_predictions', 'p1', {
      articleId: 'a1', predPublicar: 'SI', predPortada: 'Portada',
      predFacebook: 'Alta', predDiscover: 'Alta', confianza: 90, fecha: old,
      realFacebook: null, realDiscover: null, realPortada: null,
    });

    const res = await validateMeniPredictions(fakeDb, { minAgeDays: 7 });
    expect(res.validated).toBe(1);

    const p = docData('meni_predictions', 'p1')!;
    expect(p.realPublicar).toBe('SI');
    expect(p.realPortada).toBe('Destacada');
    expect(p.validation.publicar.status).toBe('VALIDATED');
    expect(p.validation.publicar.correct).toBe(true);
    // Facebook/Discover no tienen fuente real → INSUFFICIENT_DATA, nunca inventado
    expect(p.validation.facebook.status).toBe('INSUFFICIENT_DATA');
    expect(p.validation.discover.status).toBe('INSUFFICIENT_DATA');
    expect(p.realFacebook).toBeNull();
  });

  it('predicción que falló (publicó pero sin portada) → MISMATCH honesto', async () => {
    seed('noticias', 'a2', { publicado: true, estado: 'publicado', destacada: false });
    seed('meni_predictions', 'p2', {
      articleId: 'a2', predPublicar: 'SI', predPortada: 'Hero principal',
      predFacebook: 'Media', predDiscover: 'Media', confianza: 80, fecha: old,
    });
    await validateMeniPredictions(fakeDb, { minAgeDays: 7 });
    const p = docData('meni_predictions', 'p2')!;
    expect(p.validation.portada.correct).toBe(false);
    expect(p.realPortada).toBe('No va a portada');
  });

  it('predicción reciente (< ventana) NO se valida', async () => {
    seed('noticias', 'a3', { publicado: true, estado: 'publicado', destacada: true });
    seed('meni_predictions', 'p3', { articleId: 'a3', predPublicar: 'SI', fecha: fresh });
    const res = await validateMeniPredictions(fakeDb, { minAgeDays: 7 });
    expect(res.validated).toBe(0);
    expect(docData('meni_predictions', 'p3')?.validation).toBeUndefined();
  });

  it('artículo eliminado → marca honesta, no datos inventados', async () => {
    seed('meni_predictions', 'p4', { articleId: 'no-existe', predPublicar: 'SI', fecha: old });
    await validateMeniPredictions(fakeDb, { minAgeDays: 7 });
    const p = docData('meni_predictions', 'p4')!;
    expect(p.validation.note).toBe('article_deleted: el artículo ya no existe en noticias');
    expect(p.realPublicar).toBeUndefined();
  });
});

// ─────────────── QUEUED ≠ COMPLETED ───────────────

describe('Operaciones — QUEUED no puede aparecer como COMPLETED', () => {
  it('acción de contenido preparada queda QUEUED y encola material PREPARED', async () => {
    seed('nios_actions', 'act-1', {
      id: 'act-1', actionId: 'act-1', opportunityId: 'op-1', kind: 'content-recirculation',
      target: 'nota-real', title: 'Recircular nota', status: 'PENDING',
      createdAt: new Date().toISOString(), proposedAt: new Date().toISOString(),
      before: {}, after: {}, source: 'nios-growth-radar',
    });

    const action = await approveAndExecuteAction('act-1', 'tester');
    expect(action.status).toBe('QUEUED');
    expect(action.status).not.toBe('COMPLETED');

    const queueItem = colDocs('nios_distribution_queue')[0];
    expect(queueItem.status).toBe('PREPARED');
    expect(queueItem.channel).toBe('telegram');
  });
});

// ─────────────── Honestidad editorial ───────────────

describe('MENI — información no disponible no penaliza', () => {
  const base = {
    titulo: 'Investigan incendio en vivienda de Managua',
    contenido: '',
    resumen: 'Bomberos investigan.',
    categoria: 'Sucesos',
  } as any;

  it('"Las autoridades investigan el caso" se registra pero no reduce el score', () => {
    const sinDuda = runStoryCompletenessEngine({ ...base, contenido: 'Bomberos controlaron un incendio en una vivienda del barrio San Judas en Managua durante la noche del lunes.' });
    const conDuda = runStoryCompletenessEngine({ ...base, contenido: 'Bomberos controlaron un incendio en una vivienda del barrio San Judas en Managua durante la noche del lunes. Las causas del incendio se investiga por parte de las autoridades.' });

    expect(conDuda.dudasPendientes.length).toBeGreaterThan(0); // se detecta
    expect(conDuda.score).toBe(sinDuda.score); // pero NO penaliza
    expect(conDuda.cerrada).toBe(sinDuda.cerrada);
  });
});
