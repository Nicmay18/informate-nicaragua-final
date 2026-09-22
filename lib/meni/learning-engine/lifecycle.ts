/**
 * Aprendizaje gobernado — ciclo de vida de aprendizajes.
 *
 * Garantías del sistema:
 * - Un patrón OBSERVED/CANDIDATE nunca modifica comportamiento productivo.
 * - Solo learningState === 'ACTIVE' es cargado por loadEditorPatterns.
 * - Toda transición es válida, registrada en stateHistory y auditada en
 *   learning_cycles (qué, cuándo, quién/por qué).
 * - Rollback: ACTIVE → ROLLED_BACK desactiva sin borrar evidencia.
 *
 * Ciclo: corrección editor → patrón OBSERVED → evidencia suficiente →
 * CANDIDATE → VALIDATING (regresión) → APPROVED (humano) → ACTIVE (consumo
 * real en diagnóstico) → ROLLED_BACK si empeora.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

export type LearningState =
  | 'OBSERVED'
  | 'CANDIDATE'
  | 'VALIDATING'
  | 'APPROVED'
  | 'ACTIVE'
  | 'REJECTED'
  | 'ROLLED_BACK';

const ALLOWED_TRANSITIONS: Record<LearningState, LearningState[]> = {
  OBSERVED: ['CANDIDATE', 'REJECTED'],
  CANDIDATE: ['VALIDATING', 'REJECTED'],
  VALIDATING: ['APPROVED', 'REJECTED'],
  APPROVED: ['ACTIVE', 'REJECTED'],
  ACTIVE: ['ROLLED_BACK', 'REJECTED'],
  REJECTED: ['OBSERVED'],
  ROLLED_BACK: ['VALIDATING'],
};

const PATTERNS = 'editor_patterns';
const CYCLES = 'learning_cycles';

export interface LearningTransitionMeta {
  by: string;
  note?: string;
  evidence?: { correctionsCount?: number; confidence?: number; sampleSize?: number; regressionResult?: string };
}

export function canTransition(from: LearningState | undefined, to: LearningState): boolean {
  const fromState = from ?? 'OBSERVED';
  return (ALLOWED_TRANSITIONS[fromState] ?? []).includes(to);
}

/**
 * Ejecuta una transición válida sobre un patrón de aprendizaje.
 * Devuelve false si la transición es inválida (máquina de estados cerrada).
 */
export async function transitionLearning(
  db: Firestore,
  patternId: string,
  to: LearningState,
  meta: LearningTransitionMeta,
): Promise<boolean> {
  const ref = db.collection(PATTERNS).doc(patternId);
  const doc = await ref.get();
  if (!doc.exists) return false;

  const data = doc.data()!;
  const from: LearningState = data.learningState ?? 'OBSERVED';
  if (!canTransition(from, to)) {
    logger.warn('[learning-lifecycle] Transición inválida', { patternId, from, to });
    return false;
  }

  const now = new Date().toISOString();
  const history = Array.isArray(data.stateHistory) ? data.stateHistory : [];
  history.push({ from, to, at: now, by: meta.by, note: meta.note ?? '' });

  const update: Record<string, unknown> = {
    learningState: to,
    stateHistory: history,
    updatedAt: now,
  };
  if (to === 'ACTIVE') {
    update.version = (data.version ?? 0) + 1;
    update.activatedAt = now;
    update.activatedBy = meta.by;
  }
  if (to === 'ROLLED_BACK') {
    update.rolledBackAt = now;
    update.rolledBackBy = meta.by;
    update.rollbackReason = meta.note ?? '';
  }
  if (to === 'VALIDATING' && meta.evidence) {
    update.validationEvidence = meta.evidence;
  }

  await ref.update(update);

  // Auditoría de la transición — la colección existía vacía y sin propósito.
  await db.collection(CYCLES).add({
    kind: 'learning_transition',
    patternId,
    from,
    to,
    at: now,
    by: meta.by,
    note: meta.note ?? '',
    evidence: meta.evidence ?? null,
  });

  return true;
}

/**
 * Regla de promoción automática OBSERVED → CANDIDATE:
 * suficiente evidencia (≥3 correcciones del mismo tipo) con confianza ≥0.6.
 * CANDIDATE sigue sin afectar comportamiento — requiere regresión + aprobación.
 */
export function isCandidateEligible(correctionsCount: number, confidence: number): boolean {
  return correctionsCount >= 3 && confidence >= 0.6;
}

/**
 * Lista el estado del ciclo de aprendizaje para el panel.
 */
export async function getLearningStateReport(db: Firestore): Promise<{
  byState: Record<string, number>;
  patterns: { id: string; learningState: LearningState; version: number; frecuencia: number; confianzaNivel: number; descripcion: string }[];
}> {
  const snap = await db.collection(PATTERNS).get();
  const byState: Record<string, number> = {};
  const patterns = snap.docs.map(d => {
    const p = d.data();
    const state: LearningState = p.learningState ?? 'OBSERVED';
    byState[state] = (byState[state] ?? 0) + 1;
    return {
      id: d.id,
      learningState: state,
      version: p.version ?? 0,
      frecuencia: p.frecuencia ?? 0,
      confianzaNivel: p.confianzaNivel ?? 0,
      descripcion: p.descripcion ?? '',
    };
  });
  return { byState, patterns };
}
