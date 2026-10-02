/**
 * MENI Learning 4.0 — invariantes del circuito de aprendizaje.
 *
 * Garantías bajo prueba:
 *  - Solo correcciones NO triviales se registran.
 *  - Solo decisiones humanas promueven patrones (el sistema no habla
 *    consigo mismo).
 *  - Solo patrones ACTIVE se cargan e incluyen traza de evidencia.
 *  - Un defecto auto-inducido se detecta Y sigue bloqueando (nunca se
 *    silencia el Quality Gate).
 *  - 'motocicleta' limpio → sin defecto; 'motocicletacicletas' → CONCAT.
 *  - Solo predicciones validadas entran al contexto; <3 → no se expone.
 *  - Los patrones NO mueven el score editorial (contexto, no multiplicador).
 *  - El registro de falsos positivos deduplica por (code, contexto).
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

const fakeDb = { collection: (name: string) => makeCol(name) } as unknown as Firestore;

function seed(col: string, id: string, data: Record<string, any>) {
  const m = store.get(col) ?? new Map<string, FakeDoc>();
  m.set(id, { ...data, id });
  store.set(col, m);
}

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  registerCorrection,
  loadEditorPatterns,
  applyPatternsToDiagnostic,
  isTrivialChange,
  inferCorrectionKind,
} from '@/lib/meni/editor-jefe/correction-tracker';
import {
  detectSelfInducedDefects,
  registerFalsePositiveEvent,
  loadFalsePositiveContext,
  invalidateFalsePositiveCache,
} from '@/lib/meni/learning-engine/false-positive-registry';
import { loadPredictionContext, invalidatePredictionContextCache } from '@/lib/meni/learning-engine/prediction-context';
import { runQualityGate } from '@/lib/meni/quality-gate';
import { runEditorialBrain } from '@/lib/meni/editorial-brain';
import type { EditorPattern } from '@/lib/meni/editorial-brain/types';

beforeEach(() => {
  store.clear();
  seq = 0;
  invalidateFalsePositiveCache();
  invalidatePredictionContextCache();
  vi.clearAllMocks();
});

// ─────────────── FASE 1: registro de experiencia ───────────────

describe('FASE 1 — registro de experiencia editorial', () => {
  it('cambio trivial (solo whitespace/HTML) NO se registra', async () => {
    await registerCorrection(fakeDb, {
      articleId: 'a1', campo: 'cuerpo',
      antes: '<p>Hola mundo</p>', despues: '<p>Hola   mundo</p>',
      categoria: 'Sucesos',
    });
    expect(colDocs('editor_corrections')).toHaveLength(0);
  });

  it('isTrivialChange distingue cambio real de cambio cosmético', () => {
    expect(isTrivialChange('<p>La motocicleta chocó</p>', ' La motocicleta chocó ')).toBe(true);
    expect(isTrivialChange('La motocicleta chocó', 'El motociclista chocó')).toBe(false);
  });

  it('inferCorrectionKind clasifica el origen de la mutación', () => {
    expect(inferCorrectionKind('admin/news PUT')).toBe('DECISION_HUMANA');
    expect(inferCorrectionKind('supervisor-autofix')).toBe('DECISION_SUPERVISOR');
    expect(inferCorrectionKind('enrich-links')).toBe('SUGERENCIA_EDITORIAL');
    expect(inferCorrectionKind('autocorrect-pipeline')).toBe('AUTO_CORREGIBLE');
  });

  it('corrección real se registra con kind por defecto DECISION_HUMANA', async () => {
    await registerCorrection(fakeDb, {
      articleId: 'a1', campo: 'titulo',
      antes: 'Este título es demasiado largo para el estándar del medio y debe recortarse bastante',
      despues: 'Título corto',
      categoria: 'Sucesos',
    });
    const rec = colDocs('editor_corrections')[0];
    expect(rec.kind).toBe('DECISION_HUMANA');
    expect(rec.diferenciaTipo).toBe('acortar');
  });
});

// ─────────────── FASE 2: solo humanos promueven patrones ───────────────

describe('FASE 2 — evidencia humana requerida para patrones', () => {
  const corrSistema = {
    articleId: 'a1', campo: 'cuerpo' as const,
    antes: 'Texto breve', despues: 'Texto muchísimo más largo con contexto adicional que fue añadido por el sistema',
    categoria: 'Sucesos', kind: 'SUGERENCIA_EDITORIAL' as const,
  };
  const corrHumana = {
    articleId: 'a2', campo: 'cuerpo' as const,
    antes: 'Texto breve', despues: 'Texto muchísimo más largo con contexto adicional añadido por el periodista',
    categoria: 'Sucesos',
  };

  it('mutaciones del sistema NO fabrican patrones', async () => {
    for (let i = 0; i < 5; i++) await registerCorrection(fakeDb, corrSistema);
    expect(colDocs('editor_corrections')).toHaveLength(5); // se registran como observación
    expect(colDocs('editor_patterns')).toHaveLength(0); // pero NO promueven patrón
  });

  it('decisiones humanas repetidas sí generan candidato gobernado', async () => {
    for (let i = 0; i < 3; i++) await registerCorrection(fakeDb, corrHumana);
    const pattern = colDocs('editor_patterns')[0];
    expect(pattern).toBeDefined();
    expect(pattern.learningState).toBe('CANDIDATE');
  });
});

// ─────────────── FASE 3: patrones como contexto explicable ───────────────

describe('FASE 3 — patrones ACTIVE como contexto explicable', () => {
  const pattern: EditorPattern = {
    id: 'titulo_Sucesos_acortar',
    campo: 'titulo',
    descripcion: 'El editor tiende a acortar titulos largos en Sucesos',
    frecuencia: 7,
    categorias: ['Sucesos'],
    ejemploAntes: 'x', ejemploDespues: 'y',
    confianzaNivel: 0.85,
    ultimaVez: '2026-10-01',
    learningState: 'ACTIVE',
    version: 2,
  };

  it('la sugerencia declara su evidencia (casos + confianza + versión)', () => {
    const { correccionesSugeridas, trazas } = applyPatternsToDiagnostic([pattern], 'Sucesos');
    expect(correccionesSugeridas[0]).toContain('aprendido de 7 correcciones');
    expect(correccionesSugeridas[0]).toContain('85%');
    expect(trazas[0]).toMatchObject({ patternId: 'titulo_Sucesos_acortar', casos: 7, confianza: 0.85, version: 2 });
  });

  it('patrón de otra categoría no se aplica (General sí)', () => {
    const { patronesAplicados } = applyPatternsToDiagnostic([pattern], 'Deportes');
    expect(patronesAplicados).toHaveLength(0);
    const general = { ...pattern, categorias: ['General'] };
    expect(applyPatternsToDiagnostic([general], 'Deportes').patronesAplicados).toHaveLength(1);
  });

  it('invariante: un patrón ACTIVE NUNCA mueve el score editorial', () => {
    const input = {
      titulo: 'Detienen a sospechoso por robo en barrio de Managua esta noche',
      contenido: '<p>La Policía Nacional informó la captura de un sospechoso durante la noche del lunes en el barrio San Judas de Managua. El hombre habría robado una motocicleta frente a una vivienda. Los vecinos alertaron a las autoridades que llegaron rápidamente al lugar.</p><p>El detenido fue trasladado a la estación policial donde se investiga el caso. Las autoridades indicaron que el vehículo fue recuperado y será entregado a su propietario.</p>',
      resumen: 'La Policía capturó a un sospechoso de robo en Managua.',
      categoria: 'Sucesos',
    } as any;
    const sin = runEditorialBrain({ ...input });
    const con = runEditorialBrain({ ...input, editorPatterns: [pattern] });

    expect(con.score).toBe(sin.score);
    expect(con.publicar).toBe(sin.publicar);
    expect(con.recomendacionEditorial).toBe(sin.recomendacionEditorial);
    // …pero el contexto aprendido sí aparece, trazable
    expect(con.aprendizaje?.patrones).toHaveLength(1);
    expect(con.aprendizaje?.memoriaUtilizada).toBe(true);
    expect(con.correccionesSugeridas.length).toBeGreaterThan(0);
    expect(sin.correccionesSugeridas).toHaveLength(0);
  });
});

// ─────────────── FASE 7: falsos positivos ───────────────

describe('FASE 7 — memoria de falsos positivos', () => {
  it('detectSelfInducedDefects: defecto solo post-autofix = auto-inducido', () => {
    const pre = 'La motocicleta era una Pulsar negra';
    const post = 'La motocicletacicleta era una Pulsar negra';
    expect(detectSelfInducedDefects(pre, post)).toContain('CONCAT_MOTOCICLETA');
    expect(detectSelfInducedDefects(pre, pre)).toHaveLength(0);
  });

  it('quality-gate: motocicleta limpio NO produce defecto ni auto-inducido', () => {
    const r = runQualityGate({
      titulo: 'Accidente en carretera',
      contenido: '<p>La motocicleta era una Pulsar negra que chocó contra un poste en Managua.</p>',
      categoria: 'Sucesos',
      stage: 'POST_LLM',
    });
    const mech = r.issues.filter(i => i.categoria === 'defecto_mecanico');
    expect(mech).toHaveLength(0);
    expect(r.selfInducedDefects ?? []).toHaveLength(0);
  });

  it('quality-gate: concatenación real sigue bloqueando (NO auto-inducida)', () => {
    const r = runQualityGate({
      titulo: 'Accidente en carretera',
      contenido: '<p>Las motocicletacicletas invadieron el carril en Managua.</p>',
      categoria: 'Sucesos',
      stage: 'POST_LLM',
    });
    expect(r.bloqueado).toBe(true);
    const codes = r.issues.filter(i => i.categoria === 'defecto_mecanico').map(i => i.evidencia);
    expect(codes).toContain('CONCAT_MOTOCICLETA');
    // El defecto estaba en el texto ORIGINAL → no es auto-inducido
    expect(r.selfInducedDefects ?? []).toHaveLength(0);
  });

  it('registro deduplica por (code, contexto) y acumula ocurrencias', async () => {
    const ev = { code: 'CONCAT_MOTOCICLETA', kind: 'SELF_INDUCED_DEFECT' as const, contexto: 'x', origen: 'test' };
    await registerFalsePositiveEvent(fakeDb, ev);
    await registerFalsePositiveEvent(fakeDb, ev);
    await registerFalsePositiveEvent(fakeDb, ev);
    const docs = colDocs('meni_false_positives');
    expect(docs).toHaveLength(1);
    expect(docs[0].ocurrencias).toBe(3);
  });

  it('loadFalsePositiveContext devuelve avisos solo de códigos registrados', async () => {
    await registerFalsePositiveEvent(fakeDb, {
      code: 'CONCAT_MOTOCICLETA', kind: 'SELF_INDUCED_DEFECT', contexto: 'x', origen: 'test',
    });
    const ctx = await loadFalsePositiveContext(fakeDb, ['CONCAT_MOTOCICLETA', 'OTRO_CODIGO']);
    expect(ctx).toHaveLength(1);
    expect(ctx[0].code).toBe('CONCAT_MOTOCICLETA');
  });
});

// ─────────────── FASE 6: predicciones validadas ───────────────

describe('FASE 6 — solo predicciones validadas entran al contexto', () => {
  const pred = (id: string, validated: boolean, correct = true) => ({
    articleId: id,
    predPublicar: 'SI', predPortada: 'Portada', predFacebook: 'Alta', predDiscover: 'Alta',
    fecha: new Date().toISOString(),
    ...(validated ? {
      validation: {
        publicar: { status: 'VALIDATED', predicted: 'SI', real: 'SI', correct, source: 'noticias' },
        portada: { status: 'VALIDATED', predicted: 'Portada', real: 'Destacada', correct, source: 'noticias' },
        summary: { validated: 2, correct: correct ? 2 : 1, mismatched: correct ? 0 : 1, insufficient: 2 },
      },
    } : {}),
  });

  it('<3 validadas → contexto no se expone (evidencia insuficiente)', async () => {
    seed('meni_predictions', 'p1', pred('a1', true));
    seed('meni_predictions', 'p2', pred('a2', true));
    seed('meni_predictions', 'p3', pred('a3', false)); // no validada
    expect(await loadPredictionContext(fakeDb)).toBeNull();
  });

  it('≥3 validadas → tasa real computada, no validadas excluidas', async () => {
    seed('meni_predictions', 'p1', pred('a1', true, true));
    seed('meni_predictions', 'p2', pred('a2', true, true));
    seed('meni_predictions', 'p3', pred('a3', true, false));
    seed('meni_predictions', 'p4', pred('a4', false)); // sin validar — ignorada
    const ctx = await loadPredictionContext(fakeDb);
    expect(ctx).not.toBeNull();
    expect(ctx!.totalValidadas).toBe(3);
    expect(ctx!.aciertos).toBe(2);
    expect(ctx!.tasa).toBeCloseTo(0.67, 1);
  });
});

// ─────────────── FASE 8: el aprendizaje no altera autoridad ───────────────

describe('FASE 8 — el aprendizaje no puede tocar gates ni scores', () => {
  it('patrón ACTIVE + predicciones no cambian score/publicar del brain', () => {
    const input = {
      titulo: 'Managua inaugura nuevo mercado municipal este fin de semana',
      contenido: '<p>La alcaldía de Managua inauguró el nuevo mercado municipal del barrio San Judas durante la mañana del sábado. Las autoridades informaron que el espacio beneficiará a más de 200 comerciantes locales. La obra costó 2 millones de córdobas según el presupuesto municipal.</p>',
      resumen: 'La alcaldía inauguró un nuevo mercado en Managua.',
      categoria: 'Nacionales',
    } as any;
    const base = runEditorialBrain({ ...input });
    const conAprendizaje = runEditorialBrain({
      ...input,
      editorPatterns: [{
        id: 'p1', campo: 'cuerpo', descripcion: 'patrón test', frecuencia: 10,
        categorias: ['Nacionales'], ejemploAntes: 'a', ejemploDespues: 'b',
        confianzaNivel: 0.9, ultimaVez: '2026-10-01', learningState: 'ACTIVE', version: 1,
      }],
      predictionContext: { totalValidadas: 50, aciertos: 40, tasa: 0.8, ejemplos: [] },
    });
    expect(conAprendizaje.score).toBe(base.score);
    expect(conAprendizaje.publicar).toBe(base.publicar);
    expect(conAprendizaje.estadoEditorial).toBe(base.estadoEditorial);
    expect(conAprendizaje.aprendizaje?.predicciones?.tasa).toBe(0.8);
  });

  it('patrón NO ACTIVE nunca llega al diagnóstico (loadEditorPatterns)', async () => {
    seed('editor_patterns', 'p1', {
      campo: 'titulo', descripcion: 'x', frecuencia: 5, categorias: ['Sucesos'],
      confianzaNivel: 0.9, learningState: 'CANDIDATE',
    });
    seed('editor_patterns', 'p2', {
      campo: 'titulo', descripcion: 'y', frecuencia: 8, categorias: ['Sucesos'],
      confianzaNivel: 0.8, learningState: 'ACTIVE', version: 3,
    });
    const loaded = await loadEditorPatterns(fakeDb);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('p2');
    expect(loaded[0].version).toBe(3);
  });
});
