/**
 * MENI 4 Final — Veredicto Editorial Unificado (regresiones A–L).
 *
 * A. Nota correcta → PUBLICAR / PUBLICAR_CON_CAMBIOS (nunca BLOQUEAR).
 * B. Nota con recomendaciones → no bloquear.
 * C. Error factual/atribución crítico → REVISAR/BLOQUEAR.
 * D. EVIDENCIA_REQUERIDA → RECOMMENDATION, nunca bloquea.
 * E. 'motocicleta/motociclista/motocicletas' → sin falso positivo.
 * F. 'motocicletacicletas' → detectar y bloquear correctamente.
 * G. Duplicado real → detectar y bloquear.
 * H. Nota original → no marcar duplicado.
 * I. Auto-corrección que introduce defecto → revertir, nunca bloquear por defecto propio.
 * J. Learning 4.0 → no altera silenciosamente reglas críticas.
 * K. Editor Jefe → una sola decisión final coherente con los hallazgos.
 * L. Sin BLOQUEANTES reales → la nota puede publicarse.
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
      if (op === '!=') return val !== v;
      if (op === '<=') return typeof val === 'string' && val <= v;
      if (op === '<') return typeof val === 'string' && val < v;
      if (op === '>=') return val >= v;
      if (op === '>') return val > v;
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
    select: () => q, // el fake devuelve el doc completo; suficiente para la criba
    get: async () => {
      const list = runQuery(col, filters, order, limitN);
      return {
        docs: list.map(d => ({ id: d.id, exists: true, data: () => d, ref: makeDocRef(col, d.id) })),
        empty: list.length === 0,
        size: list.length,
      };
    },
  };
  return q;
}

function makeCol(name: string): any {
  const base = {
    doc: (id?: string) => makeDocRef(name, id),
    where: (f: string, op: string, v: any) => makeQuery(name, [{ f, op, v }]),
    orderBy: (f: string, dir?: 'asc' | 'desc') => makeQuery(name, [], { f, dir: dir ?? 'asc' }),
    limit: (n: number) => makeQuery(name, [], undefined, n),
    select: () => makeQuery(name),
    get: () => makeQuery(name).get(),
    add: async (data: any) => {
      const ref = makeDocRef(name);
      await ref.set(data);
      return ref;
    },
  };
  return base;
}

const fakeDb = {
  collection: (name: string) => makeCol(name),
  getAll: async (...refs: any[]) => Promise.all(refs.map((r) => r.get())),
} as unknown as Firestore;

function seed(col: string, id: string, data: Record<string, any>) {
  const m = store.get(col) ?? new Map<string, FakeDoc>();
  m.set(id, { ...data, id });
  store.set(col, m);
}

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { runMeni, runMeniAsync } from '@/lib/meni';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import {
  buildEditorialVerdict,
  decideFromFindings,
  locateEvidence,
  type EditorialFinding,
} from '@/lib/meni/editorial-verdict';

beforeEach(() => {
  store.clear();
  seq = 0;
});

// ─────────────────────────── Fixtures ───────────────────────────

const NOTA_LARGA_OK = [
  'El Ministerio de Educación confirmó que las inscripciones escolares iniciarán el 15 de enero de 2026 en todos los centros públicos del país, según informó la directora de Educación, María Hernández, en conferencia de prensa en Managua.',
  'La funcionaria indicó que unos 1.2 millones de estudiantes se beneficiarán del nuevo calendario, que incluye 185 días de clases y la entrega de 2.5 millones de libros de texto gratuitos distribuidos en 9,500 escuelas públicas de todo el territorio nacional.',
  'Según datos oficiales del ministerio, el presupuesto asignado es de 45 millones de córdobas, lo que representa un aumento del 8 por ciento respecto al año anterior. Las familias deberán presentar cédula del menor y constancia de nacimiento.',
  'El director de Planificación, Carlos Ortega, explicó que las clases comenzarán el primer lunes de febrero y que los docentes recibirán capacitación durante enero en los 153 municipios.',
].join('\n\n');

const inputBase = (contenido: string, extra: Record<string, any> = {}) => ({
  titulo: 'Ministerio de Educación anuncia inicio de inscripciones escolares 2026',
  resumen: 'Las inscripciones inician el 15 de enero en centros públicos.',
  contenido,
  categoria: 'Nacionales',
  autor: 'Redacción',
  ...extra,
});

// ─────────────────────────── Tests ───────────────────────────

describe('A/B/L — nota correcta y recomendaciones nunca bloquean', () => {
  it('A: nota larga y documentada → veredicto no es BLOQUEAR', () => {
    const r = runMeni(inputBase(NOTA_LARGA_OK));
    expect(r.editorialVerdict).toBeDefined();
    expect(r.editorialVerdict!.decision).not.toBe('BLOQUEAR');
    expect(r.editorialVerdict!.counts.blockers).toBe(0);
  });

  it('B: deducciones del scorer son RECOMMENDATION con bloquea=false', () => {
    const r = runMeni(inputBase(NOTA_LARGA_OK));
    const recs = r.editorialVerdict!.hallazgos.filter((h) => h.severity === 'RECOMMENDATION');
    for (const h of recs) expect(h.bloquea).toBe(false);
    // Ninguna recomendación puede producir BLOQUEAR por sí sola
    if (recs.length > 0 && r.editorialVerdict!.counts.blockers === 0) {
      expect(['PUBLICAR', 'PUBLICAR_CON_CAMBIOS', 'REVISAR']).toContain(r.editorialVerdict!.decision);
    }
  });

  it('L: sin blockers, decisión ∈ {PUBLICAR, PUBLICAR_CON_CAMBIOS, REVISAR} — jamás BLOQUEAR', () => {
    const v = buildEditorialVerdict({
      contenido: 'texto', scoreFinal: 92, aprobado: true,
      recomendaciones: [{ area: 'editorial', mensaje: 'Agregar contexto' }],
      supervisor: {
        decisionId: 't', timestamp: '', verdict: 'PUBLICAR_CON_CAMBIOS', reason: '', confidence: 1,
        scoreOverride: false, issues: [], actions: [], resultingState: 'PUBLICADO', modelVersion: 't',
      } as any,
    });
    expect(v.decision).toBe('PUBLICAR_CON_CAMBIOS');
  });

  it('L2: sin hallazgos y aprobado → PUBLICAR', () => {
    const v = decideFromFindings([], { scoreFinal: 95, aprobado: true, supervisorVerdict: 'PUBLICAR' });
    expect(v.decision).toBe('PUBLICAR');
  });
});

describe('D — EVIDENCIA_REQUERIDA es recomendación, jamás bloqueo', () => {
  // Reportaje (≥700 palabras, ≥2 fuentes, trabajo de campo) sin cifras
  // materiales → dispara EVIDENCIA_REQUERIDA del perfil Nacionales.
  const REPORTAJE = [
    'El Ministerio de Educación confirmó este miércoles que las inscripciones escolares para el próximo ciclo lectivo iniciarán la segunda semana de enero en todos los centros públicos del país, según señaló la directora general de Educación, María Hernández, durante una conferencia de prensa ofrecida en Managua.',
    'De acuerdo con el informe oficial presentado por la institución, la matrícula se realizará de forma presencial en cada escuela y colegio, con horarios extendidos durante toda la semana para facilitar el proceso a las familias de Managua, León, Chinandega, Granada, Masaya, Carazo, Rivas, Matagalpa, Jinotega y las demás cabeceras departamentales.',
    'Testigos consultados por este medio indicaron que en los centros educativos ya se observan filas de madres y padres que buscan información sobre los requisitos, entre ellos la partida de nacimiento del menor y la cédula de identidad de los tutores responsables.',
    'Según pudo constatar este medio durante un recorrido por barrios del distrito siete de la capital, los docentes ya realizan visitas casa por casa para orientar a las familias sobre el proceso de matrícula y el calendario de actividades previsto.',
    'La viceministra de Educación, Ana María López, explicó que el período de inscripción contempla jornadas especiales en comunidades rurales de difícil acceso, donde brigadas itinerantes atenderán a los estudiantes que viven lejos de las cabeceras municipales.',
    'Por su parte, el director de Planificación Educativa, Carlos Ortega, señaló que el calendario escolar contempla la entrega gratuita de útiles y libros de texto, además del programa de alimentación escolar que opera en los centros públicos durante todo el año lectivo.',
    'Familiares de estudiantes de la zona rural de Matagalpa manifestaron a este medio que esperan que el proceso fluya sin contratiempos, luego de que en años anteriores se reportaran retrasos en la entrega de materiales y en la apertura de algunas aulas en las comunidades más alejadas.',
    'El sindicato de maestros, a través de su secretario general José Ramírez, pidió que la jornada de inscripción venga acompañada de la reparación de techos y sanitarios en aquellos centros que presentan daños, señalando que las condiciones de infraestructura influyen en la asistencia de los alumnos durante el año.',
    'Analistas consultados señalaron que el proceso de matrícula es un termómetro de la confianza de las familias en la educación pública, y recordaron que el sector ha atravesado desafíos de cobertura, deserción y formación docente durante la última década en el país.',
    'Las autoridades indicaron que durante la próxima semana se publicará el instructivo con los requisitos definitivos, mientras que los directores de centro recibirán la capacitación correspondiente antes de que arranque la jornada oficial de matrícula en cada municipio.',
    'Docentes del departamento de Chinandega comentaron que preparan sesiones informativas para orientar a los padres sobre las modalidades de estudio, los turnos disponibles y los horarios que regirán durante el primer trimestre lectivo.',
    'En la zona norte, pobladores de las comunidades de Somoto y Ocotal dijeron esperar que las brigadas móviles lleguen puntuales, pues en ciclos anteriores algunas familias tuvieron que trasladarse largas distancias para completar el trámite.',
    'Expertos en política educativa consideraron que la continuidad del programa de alimentación escolar es determinante para la permanencia de los estudiantes en las aulas, particularmente en los municipios con mayores índices de vulnerabilidad.',
    'La Policía Nacional informó que desplegará agentes de tránsito en los alrededores de los centros educativos durante los primeros días de matrícula para garantizar la seguridad vial de estudiantes y acompañantes en las horas de mayor afluencia.',
    'El Ministerio de Salud, por su parte, anunció jornadas de vacunación paralelas en los centros educativos durante la temporada de inscripción, conforme al calendario nacional de inmunización para menores de edad escolar.',
    'En tanto, la Cruz Roja Nicaragüense indicó que instalará puestos de primeros auxilios en las zonas de mayor concentración durante la jornada de matrícula, en coordinación con los centros de salud municipales y las brigadas comunitarias.',
    'Representantes de la Asamblea Nacional señalaron que la comisión de educación dará seguimiento al proceso de matrícula a través de los diputados de cada circunscripción, con énfasis en la cobertura de las comunidades rurales.',
    'La institución recordó que el proceso es gratuito y que ningún centro educativo puede exigir pagos ni aportes obligatorios como condición para inscribir a los menores, de acuerdo con la normativa vigente del sector educativo.',
  ].join('\n\n');

  it('D1: el reportaje real dispara EVIDENCIA_REQUERIDA como RECOMMENDATION que no bloquea', () => {
    const r = runMeni(inputBase(REPORTAJE));
    const ev = r.editorialVerdict!;
    const evidencias = ev.hallazgos.filter((h) => h.code.startsWith('EVIDENCIA_REQUERIDA'));
    expect(evidencias.length).toBeGreaterThan(0);
    for (const e of evidencias) {
      expect(e.severity).toBe('RECOMMENDATION');
      expect(e.bloquea).toBe(false);
      expect(e.description).toContain('no impide publicar');
    }
    if (ev.counts.blockers === 0) expect(ev.decision).not.toBe('BLOQUEAR');
  });

  it('D2: mapper determinista — las tres alertas como explainability → RECOMMENDATION', () => {
    const v = buildEditorialVerdict({
      contenido: 'texto', scoreFinal: 94, aprobado: true,
      explainability: [
        { modulo: 'valorEditorial', regla: 'EVIDENCIA_REQUERIDA:cifras', parrafo: '', motivo: 'No se encontró evidencia requerida: cifras', solucion: 'Incluir cifras', puntosPerdidos: 3 },
        { modulo: 'valorEditorial', regla: 'EVIDENCIA_REQUERIDA:quién lo dijo', parrafo: '', motivo: 'No se encontró evidencia requerida: quién lo dijo', solucion: 'Indicar fuente', puntosPerdidos: 3 },
        { modulo: 'valorEditorial', regla: 'EVIDENCIA_REQUERIDA:qué cambia', parrafo: '', motivo: 'No se encontró evidencia requerida: qué cambia', solucion: 'Indicar cambios', puntosPerdidos: 3 },
      ],
    });
    const ev = v.hallazgos.filter((h) => h.code.startsWith('EVIDENCIA_REQUERIDA'));
    expect(ev).toHaveLength(3);
    for (const e of ev) {
      expect(e.severity).toBe('RECOMMENDATION');
      expect(e.bloquea).toBe(false);
    }
    // Solo recomendaciones → PUBLICAR_CON_CAMBIOS, jamás BLOQUEAR
    expect(v.decision).toBe('PUBLICAR_CON_CAMBIOS');
  });
});

describe('C — error factual crítico sí bloquea', () => {
  it('señal CRITICAL de factualidad → BLOQUEAR', () => {
    const v = buildEditorialVerdict({
      contenido: 'texto', scoreFinal: 95, aprobado: true,
      factualitySignals: [{
        code: 'EXTRAORDINARY_UNSOURCED_CLAIM', severity: 'CRITICAL',
        evidence: 'por primera vez en la historia', desc: 'afirmación extraordinaria sin fuente',
      }],
    });
    expect(v.decision).toBe('BLOQUEAR');
    expect(v.hallazgos[0].severity).toBe('BLOCKER');
    expect(v.hallazgos[0].bloquea).toBe(true);
  });

  it('señal IMPORTANT (cifras sin fuente) → WARNING → REVISAR, no bloqueo duro', () => {
    const v = buildEditorialVerdict({
      contenido: 'texto', scoreFinal: 95, aprobado: true,
      factualitySignals: [{
        code: 'UNSOURCED_MATERIAL_FIGURES', severity: 'IMPORTANT',
        evidence: '2,503 viviendas', desc: 'cifra material sin atribución',
      }],
      supervisor: {
        decisionId: 't', timestamp: '', verdict: 'REVISION_HUMANA', reason: '', confidence: 1,
        scoreOverride: false, issues: [], actions: [], resultingState: 'REVISION', modelVersion: 't',
      } as any,
    });
    expect(v.decision).toBe('REVISAR');
    expect(v.hallazgos[0].bloquea).toBe(false);
  });

  it('veto del Supervisor: NO_PUBLICAR → BLOQUEAR aunque no haya blockers', () => {
    const v = decideFromFindings([], {
      scoreFinal: 92, aprobado: true, supervisorVerdict: 'NO_PUBLICAR',
    });
    expect(v.decision).toBe('BLOQUEAR');
  });
});

describe('E/F — motocicleta: falsos positivos y bloqueo real', () => {
  const notaMoto = [
    'Un motociclista murió la tarde del miércoles tras colisionar con un camión en el kilómetro 45 de la carretera Panamericana, en el departamento de Managua, informó el inspector de la Policía Nacional, Juan Pérez.',
    'La víctima fue identificada como Carlos Mejía, de 34 años, quien conducía una motocicleta color roja cuando perdió el control del vehículo en una curva, según el reporte preliminar de las autoridades de tránsito.',
    'Paramédicos del Ministerio de Salud trasladaron el cuerpo a la morgue judicial. El conductor del camión, Pedro Álvarez de 50 años, quedó detenido mientras se investigan las causas del accidente de tránsito ocurrido cerca del empalme.',
    'Según estadísticas oficiales, los accidentes de tránsito dejan más de 500 muertos al año en Nicaragua. Los motociclistas representan el 40 por ciento de las víctimas fatales en las carreteras del país, indicó la institución.',
  ].join('\n\n');

  it('E: motocicleta/motociclista en texto correcto → sin CONCAT ni bloqueo por defecto mecánico', () => {
    const r = runMeni(inputBase(notaMoto, { titulo: 'Motociclista muere tras colisión en carretera Panamericana' }));
    const mech = (r.qualityGate?.issues || []).filter((i) => i.categoria === 'defecto_mecanico');
    expect(mech.length).toBe(0);
    const mechFindings = r.editorialVerdict!.hallazgos.filter((h) => h.code === 'QG_DEFECTO_MECANICO');
    expect(mechFindings.length).toBe(0);
  });

  it('F: motocicletacicletas → defecto mecánico BLOCKER → decisión BLOQUEAR', () => {
    const r = runMeni(inputBase('<p>Las motocicletacicletas invadieron la zona este viernes.</p>'));
    const blocker = r.editorialVerdict!.hallazgos.find(
      (h) => h.severity === 'BLOCKER' && /motociclet/i.test(`${h.title} ${h.description}`),
    );
    expect(blocker).toBeDefined();
    expect(blocker!.bloquea).toBe(true);
    expect(r.editorialVerdict!.decision).toBe('BLOQUEAR');
  });
});

describe('I — auto-corrección defectuosa se revierte', () => {
  it('si el autofix introduce un defecto mecánico nuevo, se descarta', async () => {
    const { runMeni: runMeniBase } = await import('@/lib/meni');
    // Mock de autoCorrectNoticia que "corrompe" el texto
    vi.doMock('@/lib/meni/autocorrect', async (importOriginal) => {
      const mod = await importOriginal<any>();
      return {
        ...mod,
        autoCorrectNoticia: (input: any) => ({
          input: { ...input, contenido: `${input.contenido} motocicletacicletas` },
          corrections: [{ campo: 'contenido', antes: 'x', despues: 'y', descripcion: 'mock' }],
        }),
      };
    });
    vi.resetModules();
    const { runMeni: runMeniMocked } = await import('@/lib/meni');
    const notaBaja = Array(4).fill('Texto breve sin datos suficientes para aprobación.').join(' ');
    const r = runMeniMocked(inputBase(notaBaja));
    vi.unmock('@/lib/meni/autocorrect');
    vi.resetModules();
    // La corrección que introduce el defecto fue revertida
    expect(r.autoCorrected).toBe(false);
    const selfBlocker = r.editorialVerdict!.hallazgos.find(
      (h) => h.severity === 'BLOCKER' && /motocicletacicletas/i.test(`${h.title} ${h.description}`),
    );
    expect(selfBlocker).toBeUndefined();
    void runMeniBase;
  });
});

describe('G/H — duplicados', () => {
  it('G: nota casi idéntica a una publicada → DUPLICATE_CONTENT BLOCKER', async () => {
    seed('noticias', 'pub-1', {
      titulo: 'Ministerio de Educación anuncia inicio de inscripciones escolares 2026',
      resumen: 'Las inscripciones inician el 15 de enero en centros públicos.',
      contenido: NOTA_LARGA_OK,
      slug: 'edu-inscripciones', estado: 'publicado', publicado: true, fecha: '2026-09-30',
    });
    const r = await runMeniAsync(inputBase(NOTA_LARGA_OK), { db: fakeDb, skipEditorBrain: true });
    const dup = r.editorialVerdict!.hallazgos.find((h) => h.code === 'DUPLICATE_CONTENT');
    expect(dup).toBeDefined();
    expect(dup!.severity).toBe('BLOCKER');
    expect(r.editorialVerdict!.decision).toBe('BLOQUEAR');
    expect(r.aprobado).toBe(false);
  });

  it('H: nota original → sin hallazgo de duplicado', async () => {
    seed('noticias', 'pub-1', {
      titulo: 'Tormenta tropical afecta la costa del Caribe nicaragüense',
      resumen: 'Lluvias fuertes en Bluefields y Corn Island.',
      contenido: 'La tormenta dejó inundaciones en comunidades de la RAAS según autoridades locales.',
      slug: 'tormenta-caribe', estado: 'publicado', publicado: true, fecha: '2026-09-30',
    });
    const r = await runMeniAsync(inputBase(NOTA_LARGA_OK), { db: fakeDb, skipEditorBrain: true });
    expect(r.editorialVerdict!.hallazgos.find((h) => h.code === 'DUPLICATE_CONTENT')).toBeUndefined();
    expect(r.editorialVerdict!.decision).not.toBe('BLOQUEAR');
  });
});

describe('J — aprendizaje no altera reglas críticas', () => {
  it('Learning 4.0: memoria añade contexto pero nunca cambia un BLOCKER', async () => {
    // Aunque existan falsos positivos en memoria, el defecto real sigue bloqueando
    seed('meni_false_positives', 'fp-1', {
      code: 'CONCAT_MOTOCICLETA', kind: 'FALSE_POSITIVE', ocurrencias: 3,
      nota: 'registrado por error', at: '2026-01-01',
    });
    const r = await runMeniAsync(
      inputBase('<p>Las motocicletacicletas invadieron la zona.</p>'),
      { db: fakeDb, skipEditorBrain: true },
    );
    expect(r.editorialVerdict!.decision).toBe('BLOQUEAR');
    // La memoria se anota como WARNING contextual — no silencia el gate
    const fpWarn = r.editorialVerdict!.hallazgos.filter((h) => h.code.startsWith('FP_'));
    for (const w of fpWarn) expect(w.bloquea).toBe(false);
  });
});

describe('K — una sola decisión coherente con los hallazgos', () => {
  const finding = (severity: EditorialFinding['severity'], n = ''): EditorialFinding => ({
    code: `X${n}`, severity, module: 't', title: `t${n}`, description: '', howToFix: '', bloquea: severity === 'BLOCKER',
  });

  it('matriz de decisión', () => {
    expect(decideFromFindings([finding('BLOCKER')], { scoreFinal: 90, aprobado: true }).decision).toBe('BLOQUEAR');
    expect(decideFromFindings([finding('WARNING')], { scoreFinal: 95, aprobado: true }).decision).toBe('REVISAR');
    expect(decideFromFindings([finding('RECOMMENDATION')], { scoreFinal: 95, aprobado: true }).decision).toBe('PUBLICAR_CON_CAMBIOS');
    expect(decideFromFindings([finding('INFO')], { scoreFinal: 95, aprobado: true }).decision).toBe('PUBLICAR');
    expect(decideFromFindings([], { scoreFinal: 80, aprobado: false }).decision).toBe('REVISAR');
    // Un RECOMMENDATION + BLOCKER → BLOQUEAR (el bloqueante manda)
    expect(
      decideFromFindings([finding('BLOCKER', 'a'), finding('RECOMMENDATION', 'b'), finding('WARNING', 'c')], { scoreFinal: 95, aprobado: true }).decision,
    ).toBe('BLOQUEAR');
  });

  it('hallazgos ordenados por severidad', () => {
    const v = decideFromFindings(
      [finding('INFO', 'a'), finding('RECOMMENDATION', 'b'), finding('BLOCKER', 'c'), finding('WARNING', 'd')],
      { scoreFinal: 90, aprobado: true },
    );
    expect(v.hallazgos.map((h) => h.severity)).toEqual(['BLOCKER', 'WARNING', 'RECOMMENDATION', 'INFO']);
  });
});

describe('Localización de evidencia en el texto', () => {
  it('ubica el párrafo donde aparece el fragmento', () => {
    const contenido = '<p>Primer párrafo sobre Managua.</p><p>La cifra de 2,503 viviendas fue confirmada.</p><p>Tercer párrafo final.</p>';
    const loc = locateEvidence(contenido, '2,503 viviendas');
    expect(loc?.parrafo).toBe(2);
    expect(loc?.cita).toContain('2,503');
  });

  it('devuelve undefined cuando la evidencia no está en el texto', () => {
    expect(locateEvidence('<p>texto corto</p>', 'fragmento inexistente por completo')).toBeUndefined();
  });
});

describe('Integración guardarConMeni — cadena completa con Supervisor', () => {
  it('afirmación extraordinaria sin fuente → veredicto final BLOQUEAR + persistido', async () => {
    const r = await guardarConMeni(
      inputBase(
        '<p>Nicaragua construyó el primer avión de la historia completamente fabricado en el país, según anunció el gobierno este lunes.</p>',
        {},
      ),
      fakeDb as any,
      { skipEditorBrain: true },
    );
    expect(r.meni.editorialVerdict).toBeDefined();
    expect(r.meni.editorialVerdict!.supervisorVerdict).toBeDefined();
    // La decisión final integra factualidad + Supervisor: no puede ser PUBLICAR
    expect(['REVISAR', 'BLOQUEAR']).toContain(r.meni.editorialVerdict!.decision);
    // El veredicto se persiste con la nota (una sola fuente de verdad)
    const update = r.updateData as any;
    expect(update.editorVerdict.decision).toBe(r.meni.editorialVerdict!.decision);
    expect(update.editorVerdict.counts).toEqual(r.meni.editorialVerdict!.counts);
  });
});

// ─────────────────────────── §13-14 — Título: hallazgo visible + sugerencia accionable ──

const CONTENIDO_OPERATIVO = [
  'La Policía Nacional informó que ocupó 50 kilos de cocaína en un operativo realizado en Managua, según confirmó el comisionado Juan Pérez en conferencia de prensa realizada este martes.',
  'El operativo se realizó en el barrio Villa Reconciliación de Managua y resultó en la captura de tres personas, quienes fueron presentadas a las autoridades competentes para el proceso judicial correspondiente.',
  'Según las autoridades, la droga tenía un valor estimado de 1.5 millones de dólares en el mercado ilícito. La investigación continúa para determinar la procedencia del cargamento y sus posibles vínculos con redes internacionales.',
  'El comisionado Pérez explicó que el operativo fue resultado de tres meses de investigación con apoyo de inteligencia policial. Las autoridades anunciaron que darán más detalles en los próximos días.',
].join('\n\n');

describe('M — anti-clickbait: el problema del título es un hallazgo visible y accionable', () => {
  it('título clickbait → hallazgo WARNING con field=titulo, bloquea=false y sugerencia', () => {
    const r = runMeni(inputBase(CONTENIDO_OPERATIVO, {
      titulo: 'Lo que encontró la Policía en Managua sorprendió a todos',
    }));
    const h = (r.editorialVerdict?.hallazgos || []).find(x => x.code === 'ANTI_CLICKBAIT_TITULO');
    expect(h).toBeDefined();
    // Severidad honesta: el título clickbait es un defecto editorial real que
    // exige revisión humana — no un bloqueo técnico ni una sugerencia trivial.
    expect(h!.severity).toBe('WARNING');
    expect(h!.field).toBe('titulo');
    expect(h!.bloquea).toBe(false);
    // Jamás puede ser BLOCKER: un título se corrige editándolo.
    expect((r.editorialVerdict?.hallazgos || []).some(x => x.code === 'ANTI_CLICKBAIT_TITULO' && x.severity === 'BLOCKER')).toBe(false);
    // La sugerencia del Editor Jefe llega al resultado para que el panel la ofrezca.
    expect(r.tituloSugerido).toBeDefined();
    expect(r.tituloSugerido!.length).toBeGreaterThan(10);
  });

  it('recomendación aceptada → re-evaluar → el hallazgo desaparece (no queda bloqueo artificial)', () => {
    const bad = runMeni(inputBase(CONTENIDO_OPERATIVO, {
      titulo: 'Lo que encontró la Policía en Managua sorprendió a todos',
    }));
    expect(bad.tituloSugerido).toBeDefined();
    // El editor acepta la sugerencia y se RE-EVALÚA la nota completa:
    const fixed = runMeni(inputBase(CONTENIDO_OPERATIVO, { titulo: bad.tituloSugerido! }));
    expect((fixed.editorialVerdict?.hallazgos || []).some(x => x.code === 'ANTI_CLICKBAIT_TITULO')).toBe(false);
    expect(fixed.tituloSugerido).toBeUndefined();
    // Y la decisión del Editor Jefe ya no puede estar marcada por el título.
    expect(fixed.editorialVerdict!.decision).not.toBe('BLOQUEAR');
  });

  it('título con advertencia media → RECOMMENDATION, nunca bloquea', () => {
    // 'advertencia' (signals medias, p.ej. sin verbo informativo) → sugerencia, no revisión dura.
    const r = runMeni(inputBase(CONTENIDO_OPERATIVO, {
      titulo: 'Nueva situación en el país genera reacciones diversas entre la población nicaragüense',
    }));
    const h = (r.editorialVerdict?.hallazgos || []).find(x => x.code === 'ANTI_CLICKBAIT_TITULO');
    if (h) {
      expect(h.severity).toBe('RECOMMENDATION');
      expect(h.bloquea).toBe(false);
    }
  });
});
