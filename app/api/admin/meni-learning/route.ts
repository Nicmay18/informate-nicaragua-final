/**
 * Gobierno del ciclo de aprendizaje MENI.
 *
 * GET  → estado actual: patrones por estado + detalle (qué sabe el sistema).
 * POST → transiciones gobernadas:
 *   { patternId, action: 'validate'|'approve'|'reject'|'rollback'|'activate' }
 *
 * Reglas:
 *   - 'validate' mueve CANDIDATE→VALIDATING registrando la evidencia de
 *     regresión que el operador adjunta (o que corre .audit/regression-465.ts).
 *   - 'approve' VALIDATING→APPROVED, 'activate' APPROVED→ACTIVE.
 *   - 'reject' descarta desde cualquier estado previo.
 *   - 'rollback' ACTIVE→ROLLED_BACK: el patrón deja de aplicarse sin borrar
 *     la evidencia (reversible, auditable).
 * Nada aquí toca scores ni publicación: los patrones activos solo añaden
 * correccionesSugeridas informativas al diagnóstico.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { transitionLearning, getLearningStateReport, type LearningState } from '@/lib/meni/learning-engine/lifecycle';
import { logger } from '@/lib/logger';

export const maxDuration = 30;

const ACTION_TARGET: Record<string, LearningState> = {
  validate: 'VALIDATING',
  approve: 'APPROVED',
  activate: 'ACTIVE',
  reject: 'REJECTED',
  rollback: 'ROLLED_BACK',
};

export async function GET(request: NextRequest) {
  if (!verifyAdminOrCleanupToken(request.headers.get('x-admin-token'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const db = getAdminDb();
  const report = await getLearningStateReport(db);
  const cyclesSnap = await db.collection('learning_cycles')
    .orderBy('at', 'desc').limit(20).get()
    .catch(() => null);
  const recentTransitions = cyclesSnap?.docs.map(d => d.data()) ?? [];
  return NextResponse.json({ ...report, recentTransitions });
}

export async function POST(request: NextRequest) {
  if (!verifyAdminOrCleanupToken(request.headers.get('x-admin-token'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { patternId, action, note, evidence } = body ?? {};
  const target = ACTION_TARGET[action];

  if (!patternId || !target) {
    return NextResponse.json(
      { error: 'patternId y action requeridos (validate|approve|activate|reject|rollback)' },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const ok = await transitionLearning(db, patternId, target, {
    by: 'admin-operator',
    note: typeof note === 'string' ? note : undefined,
    evidence,
  });

  if (!ok) {
    return NextResponse.json(
      { error: 'Transición inválida para el estado actual del patrón' },
      { status: 409 },
    );
  }

  logger.info('[meni-learning] Transición aplicada', { patternId, to: target });
  return NextResponse.json({ ok: true, patternId, state: target });
}
