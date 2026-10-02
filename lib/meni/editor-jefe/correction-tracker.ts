/**
 * Editor Jefe — Fase 1: Aprendizaje del Editor
 * ============================================
 * Registra correcciones manuales del editor humano,
 * detecta patrones repetitivos, y los aplica automáticamente
 * en futuras evaluaciones.
 *
 * No guarda diferencias de texto: guarda CONOCIMIENTO EDITORIAL.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { EditorPattern, CorreccionRegistrada, CampoCorreccion, CorreccionKind, PatronAplicadoTraza } from '@/lib/meni/editorial-brain/types';
import { transitionLearning, isCandidateEligible } from '@/lib/meni/learning-engine/lifecycle';

const COLLECTION = 'editor_corrections';
const PATTERNS_COLLECTION = 'editor_patterns';
const MIN_CORRECTIONS_FOR_PATTERN = 3;
const MIN_CONFIDENCE = 0.6;

/**
 * Kinds que cuentan como evidencia editorial para promover patrones.
 * Las mutaciones del sistema (SUGERENCIA_EDITORIAL de limpiezas masivas,
 * AUTO_CORREGIBLE) se guardan como observación pero NO fabrican patrones:
 * un patrón requiere decisiones humanas repetidas.
 * `undefined` = corrección humana registrada por el panel (legado).
 */
const HUMAN_EVIDENCE_KINDS = new Set<CorreccionKind>(['DECISION_HUMANA']);

/**
 * Normaliza un campo para comparación trivial: una corrección que solo
 * cambia whitespace/etiquetas HTML no es decisión editorial.
 */
function normalizeForTrivialCheck(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function isTrivialChange(antes: string, despues: string): boolean {
  return normalizeForTrivialCheck(antes) === normalizeForTrivialCheck(despues);
}

/** Infere el kind de una mutación según el actor que la originó. */
export function inferCorrectionKind(actor: string): CorreccionKind {
  const a = actor.toLowerCase();
  if (a.includes('supervisor')) return 'DECISION_SUPERVISOR';
  if (a.includes('admin') || a.includes('editor') || a.includes('panel') || a.includes('periodista')) {
    return 'DECISION_HUMANA';
  }
  if (a.includes('autofix') || a.includes('autocorrect')) return 'AUTO_CORREGIBLE';
  return 'SUGERENCIA_EDITORIAL';
}

/**
 * Registra una corrección manual del editor.
 * Compara el texto antes/después y clasifica el tipo de cambio.
 * No registra cambios triviales (whitespace/etiquetas) — no son decisiones.
 */
export async function registerCorrection(
  db: Firestore,
  correction: Omit<CorreccionRegistrada, 'fecha' | 'diferenciaTipo'> & { fecha?: string },
): Promise<void> {
  if (isTrivialChange(correction.antes, correction.despues)) return;

  const diferenciaTipo = classifyCorrection(correction.antes, correction.despues, correction.campo);
  const record: CorreccionRegistrada = {
    kind: correction.kind ?? 'DECISION_HUMANA',
    ...correction,
    fecha: correction.fecha || new Date().toISOString(),
    diferenciaTipo,
  };

  await db.collection(COLLECTION).add(record);

  // Intentar detectar patrón después de cada corrección
  await detectAndPersistPattern(db, correction.campo, correction.categoria);
}

/**
 * Clasifica el tipo de corrección basándose en el diff antes/después.
 */
function classifyCorrection(antes: string, despues: string, campo: CampoCorreccion): CorreccionRegistrada['diferenciaTipo'] {
  const lenAntes = antes.trim().length;
  const lenDespues = despues.trim().length;

  if (lenDespues < lenAntes * 0.7) return 'acortar';
  if (lenDespues > lenAntes * 1.3) {
    // Si el campo es contexto o entrada, es agregar contexto
    if (campo === 'contexto' || campo === 'entrada') return 'agregar_contexto';
    if (campo === 'servicio') return 'agregar_servicio';
    return 'ampliar';
  }
  if (campo === 'orden') return 'reordenar';
  if (campo === 'frases') return 'eliminar_relleno';

  // Heurística: si añade palabras clave de contexto
  const contextoKeywords = ['anteriormente', 'en 2024', 'en 2025', 'en 2026', 'según', 'historia', 'antecedente', 'contexto'];
  if (contextoKeywords.some(k => despues.toLowerCase().includes(k) && !antes.toLowerCase().includes(k))) {
    return 'agregar_contexto';
  }

  return 'otro';
}

/**
 * Detecta patrones en un campo específico después de suficientes correcciones.
 * Si encuentra un patrón repetido (>= MIN_CORRECTIONS_FOR_PATTERN), lo persiste.
 */
export async function detectAndPersistPattern(
  db: Firestore,
  campo: CampoCorreccion,
  categoria: string,
): Promise<EditorPattern | null> {
  const snap = await db.collection(COLLECTION)
    .where('campo', '==', campo)
    .where('categoria', '==', categoria)
    .orderBy('fecha', 'desc')
    .limit(50)
    .get();

  if (snap.size < MIN_CORRECTIONS_FOR_PATTERN) return null;

  // Solo decisiones humanas promueven patrones. Las correcciones iniciadas
  // por el sistema (limpiezas masivas, autofix) son observaciones — si
  // contaran, 50 aplicaciones idénticas de una regla fabricarían un
  // "patrón" que en realidad es el propio sistema hablando consigo mismo.
  const corrections = snap.docs
    .map(d => d.data() as CorreccionRegistrada)
    .filter(c => c.kind === undefined || HUMAN_EVIDENCE_KINDS.has(c.kind));

  if (corrections.length < MIN_CORRECTIONS_FOR_PATTERN) return null;

  // Agrupar por tipo de diferencia
  const byType = new Map<string, CorreccionRegistrada[]>();
  for (const c of corrections) {
    const list = byType.get(c.diferenciaTipo) || [];
    list.push(c);
    byType.set(c.diferenciaTipo, list);
  }

  // Encontrar el tipo más frecuente
  let maxType = 'otro';
  let maxCount = 0;
  for (const [type, list] of byType) {
    if (list.length > maxCount) {
      maxCount = list.length;
      maxType = type;
    }
  }

  if (maxCount < MIN_CORRECTIONS_FOR_PATTERN) return null;

  const confidence = Math.min(1, maxCount / corrections.length);
  if (confidence < MIN_CONFIDENCE) return null;

  const descripciones: Record<string, string> = {
    acortar: `El editor tiende a acortar ${campo}s largos en ${categoria}`,
    ampliar: `El editor tiende a ampliar ${campo}s cortos en ${categoria}`,
    agregar_contexto: `El editor siempre agrega contexto histórico en ${categoria}`,
    eliminar_relleno: `El editor elimina frases de relleno en ${categoria}`,
    agregar_servicio: `El editor añade servicio al lector en ${categoria}`,
    reordenar: `El editor reordena el contenido en ${categoria}`,
    otro: `El editor hace ajustes en ${campo} de ${categoria}`,
  };

  const pattern: EditorPattern = {
    campo,
    descripcion: descripciones[maxType] || `Patrón detectado en ${campo} de ${categoria}`,
    frecuencia: maxCount,
    categorias: [categoria],
    ejemploAntes: corrections[0].antes.slice(0, 200),
    ejemploDespues: corrections[0].despues.slice(0, 200),
    confianzaNivel: confidence,
    ultimaVez: corrections[0].fecha,
  };

  const patternId = `${campo}_${categoria}_${maxType}`;
  const ref = db.collection(PATTERNS_COLLECTION).doc(patternId);
  const existing = await ref.get();

  // Aprendizaje gobernado: un patrón nuevo nace OBSERVED. Con evidencia
  // suficiente (>=3 correcciones del mismo tipo, confianza >=0.6) se promueve
  // a CANDIDATE — pero NO afecta diagnósticos hasta pasar VALIDATING →
  // APPROVED → ACTIVE. La fuente de verdad del estado es este documento.
  await ref.set({
    ...pattern,
    learningState: existing.exists ? (existing.data()?.learningState ?? 'OBSERVED') : 'OBSERVED',
    version: existing.exists ? (existing.data()?.version ?? 0) : 0,
    stateHistory: existing.exists ? (existing.data()?.stateHistory ?? []) : [],
    evidence: { correctionsCount: maxCount, confidence, campo, categoria, tipo: maxType },
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  const currentState: string = existing.exists ? (existing.data()?.learningState ?? 'OBSERVED') : 'OBSERVED';
  if (currentState === 'OBSERVED' && isCandidateEligible(maxCount, confidence)) {
    await transitionLearning(db, patternId, 'CANDIDATE', {
      by: 'correction-tracker',
      note: `${maxCount} correcciones tipo ${maxType} en ${campo}/${categoria}`,
      evidence: { correctionsCount: maxCount, confidence },
    });
  }

  return pattern;
}

/**
 * Carga SOLO los patrones en estado ACTIVE desde Firestore.
 * Un patrón OBSERVED/CANDIDATE/VALIDATING/APPROVED nunca modifica el
 * diagnóstico: la activación requiere aprobación explícita tras regresión.
 * Se llama al inicio de runEditorialBrain para aplicarlos.
 */
export async function loadEditorPatterns(db: Firestore): Promise<EditorPattern[]> {
  try {
    const snap = await db.collection(PATTERNS_COLLECTION)
      .where('learningState', '==', 'ACTIVE')
      .get();
    if (snap.empty) return [];
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as unknown as EditorPattern),
    }));
  } catch {
    return [];
  }
}

/**
 * Aplica patrones aprendidos al diagnóstico editorial.
 * Genera correcciones sugeridas basadas en lo que el editor suele cambiar.
 */
export function applyPatternsToDiagnostic(
  patterns: EditorPattern[],
  categoria: string,
): { patronesAplicados: EditorPattern[]; correccionesSugeridas: string[]; trazas: PatronAplicadoTraza[] } {
  const relevant = patterns.filter(
    p => p.categorias.includes(categoria) || p.categorias.includes('General'),
  );

  // Cada sugerencia declara su evidencia: N casos reales del medio y la
  // confianza del patrón (FASE 15 — el aprendizaje debe ser explicable).
  const evidencia = (p: EditorPattern) =>
    `[aprendido de ${p.frecuencia} correcciones del editor · confianza ${Math.round(p.confianzaNivel * 100)}%${p.version ? ` · v${p.version}` : ''}]`;

  const correccionesSugeridas = relevant.map(p => {
    const verbMap: Record<string, string> = {
      acortar: `Acortar ${p.campo} — el editor suele reducirlo ${evidencia(p)}`,
      ampliar: `Ampliar ${p.campo} — el editor suele expandirlo ${evidencia(p)}`,
      agregar_contexto: `Agregar contexto histórico — el editor lo añade en esta categoría ${evidencia(p)}`,
      eliminar_relleno: `Eliminar frases de relleno — el editor las quita sistemáticamente ${evidencia(p)}`,
      agregar_servicio: `Agregar servicio al lector — el editor lo incluye habitualmente ${evidencia(p)}`,
      reordenar: `Reordenar contenido — el editor cambia el orden habitualmente ${evidencia(p)}`,
      otro: `Revisar ${p.campo} — el editor suele ajustarlo ${evidencia(p)}`,
    };
    return verbMap[p.campo] || `${p.descripcion} ${evidencia(p)}`;
  });

  const trazas: PatronAplicadoTraza[] = relevant.map(p => ({
    patternId: p.id || `${p.campo}_${categoria}_unknown`,
    descripcion: p.descripcion,
    casos: p.frecuencia,
    confianza: p.confianzaNivel,
    version: p.version ?? 0,
    categorias: p.categorias,
  }));

  return {
    patronesAplicados: relevant,
    correccionesSugeridas,
    trazas,
  };
}
