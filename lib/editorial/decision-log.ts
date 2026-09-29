import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import type { MeniResult } from '@/lib/meni';
import type { SupervisorDecision } from '@/lib/supervisor/types';
import type { FactualitySignal } from './factuality-signals';
import { sanitizeForFirestore } from './guardar-con-meni';

/**
 * BITÁCORA PERSISTENTE DE DECISIONES EDITORIALES (P1-1, Fase B)
 *
 * Cada evaluación de MENI + Supervisor deja un registro en
 * `meni_decision_log` INCLUSO cuando la nota nunca llega a `noticias`
 * (rechazos, bloqueos, errores de guardado).
 *
 * Diseño:
 * - writeDecisionLog: lo llama guardarConMeni siempre (fire-and-forget).
 *   Nunca lanza excepción — la observabilidad no puede romper publicación.
 * - updateDecisionLog: lo llama la ruta con el resultado final
 *   (SAVED / REJECTED + etapa que bloqueó).
 * - No guarda contenido completo, secretos ni PII: solo metadatos,
 *   scores, códigos de gate y motivos truncados.
 */

const COLLECTION = 'meni_decision_log';
const truncate = (s: unknown, n = 240) =>
  typeof s === 'string' ? (s.length > n ? s.slice(0, n) + '…' : s) : s;

export function newAttemptId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface DecisionLogInput {
  attemptId: string;
  input: { titulo?: string; resumen?: string; contenido?: string; categoria?: string; slug?: string };
  meni: MeniResult;
  supervisor: SupervisorDecision;
  factualitySignals: FactualitySignal[];
  aiArtifactsRemoved: boolean;
}

/** Escribe el registro de decisión. Nunca lanza. */
export async function writeDecisionLog(
  db: Firestore,
  e: DecisionLogInput,
): Promise<void> {
  try {
    const qg = e.meni.qualityGate;
    const supervisorIssues = (e.supervisor.issues ?? []).map((i) => ({
      severity: i.severity,
      domain: i.domain,
      problem: truncate(i.problem, 160),
    }));
    const doc = sanitizeForFirestore({
      attemptId: e.attemptId,
      at: FieldValue.serverTimestamp(),
      input: {
        titulo: truncate(e.input.titulo, 140),
        categoria: e.input.categoria ?? null,
        slug: e.input.slug ?? null,
        contenidoLen: (e.input.contenido || '').length,
      },
      meni: {
        score: e.meni.scoreFinal ?? null,
        aprobado: e.meni.aprobado ?? null,
        calificacion: e.meni.calificacion ?? null,
        recomendacion: e.meni.recomendacionEditorial ?? null,
        version: e.meni.meniVersion ?? null,
        articleHash: e.meni.articleHash ?? null,
        adnNI: e.meni.editorialDna?.adnNI ?? null,
      },
      qualityGate: qg
        ? {
            bloqueado: qg.bloqueado ?? null,
            motivosBloqueo: (qg.motivosBloqueo ?? []).slice(0, 8),
            blockingIssues: (qg.issues ?? [])
              .filter((i) => i.severidad === 'blocking')
              .map((i) => truncate(`${i.categoria}: ${i.mensaje}`, 120))
              .slice(0, 8),
            transcripcionPct: qg.explanationIndex?.porcentajeTranscripcion ?? null,
            duplicado: (qg.issues ?? []).some(
              (i) => /duplic/i.test(JSON.stringify(i)),
            ) || null,
          }
        : null,
      factuality: e.factualitySignals.map((s) => ({
        code: s.code,
        severity: s.severity,
        evidence: truncate(s.evidence, 160),
      })),
      aiArtifactsRemoved: e.aiArtifactsRemoved,
      supervisor: {
        verdict: e.supervisor.verdict,
        resultingState: e.supervisor.resultingState ?? null,
        reason: truncate(e.supervisor.reason, 300),
        confidence: e.supervisor.confidence ?? null,
        decisionId: e.supervisor.decisionId ?? null,
        issues: supervisorIssues.slice(0, 10),
      },
      // La ruta actualiza estos campos con el resultado final.
      result: 'EVALUATED',
      savedArticleId: null,
      blockingStage: null,
      blockingReason: null,
    }) as Record<string, unknown> | undefined;
    if (doc) await db.collection(COLLECTION).doc(e.attemptId).set(doc);
  } catch (err) {
    logger.warn('[decision-log] no se pudo escribir la bitácora', { attemptId: e.attemptId, error: String(err) });
  }
}

/** Actualiza el registro con el resultado final del intento. Nunca lanza. */
export async function updateDecisionLog(
  db: Firestore,
  attemptId: string,
  patch: {
    result: 'SAVED' | 'REJECTED' | 'EVALUATED';
    savedArticleId?: string | null;
    blockingStage?: 'CONTENT_INTEGRITY' | 'MENI' | 'SUPERVISOR' | 'SAVE_ERROR' | null;
    blockingReason?: string | null;
  },
): Promise<void> {
  try {
    const data = sanitizeForFirestore({ ...patch, resultAt: FieldValue.serverTimestamp() }) as Record<string, unknown> | undefined;
    if (data) await db.collection(COLLECTION).doc(attemptId).set(data, { merge: true });
  } catch (err) {
    logger.warn('[decision-log] no se pudo actualizar la bitácora', { attemptId, error: String(err) });
  }
}
