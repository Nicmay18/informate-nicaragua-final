import type { MeniResult, RevisionEditorJefe } from './types';
import { MIN_APPROVED_SCORE, scoreToGrade } from './scoring';

/** Sin recalcular calidad: sincroniza aliases heredados con el riesgo final. */
export function reconcileMeniResult(result: MeniResult): MeniResult {
  const verdict = result.editorialVerdict;
  if (!verdict) return result;
  const blocked = verdict.decision === 'BLOQUEAR';
  const review = verdict.decision === 'REVISAR';
  const valid = result.score_status !== 'INVALID' && result.scoreFinal !== null;
  const approved = valid && !blocked && !review && result.scoreFinal! >= MIN_APPROVED_SCORE;
  const toRevision = (h: typeof verdict.hallazgos[number]): RevisionEditorJefe => ({
    code: h.code, module: h.module, severity: h.severity === 'BLOCKER' ? 'BLOCKER' : 'WARNING',
    title: h.title, description: h.description, evidence: h.location?.cita,
    field: h.field || 'contenido', howToFix: h.howToFix,
    currentValue: h.location?.cita || h.title, expectedValue: 'Resolver o documentar la observación',
  });
  const blockingIssues = verdict.hallazgos.filter(h => h.severity === 'BLOCKER').map(toRevision);
  const warnings = [
    ...verdict.hallazgos.filter(h => h.severity === 'WARNING').map(toRevision),
    ...(result.warnings || []).filter(w => w.severity === 'INFO'),
  ];
  const estadoFinal = !valid ? 'EVALUATION_ERROR' : blocked ? 'NO_PUBLICAR' : approved ? 'APROBADO' : 'MEJORAR';
  const risk = blocked ? 'ALTO' : review ? 'MEDIO' : 'BAJO';
  return {
    ...result, aprobado: approved, estadoFinal, verdict: estadoFinal,
    publication_decision: !valid ? 'NOT_EVALUATED' : approved ? 'APROBADO' : 'NO_PUBLICAR',
    blockingIssues, warnings,
    calificacion: !valid ? 'ERROR DE EVALUACIÓN'
      : blocked ? 'NO PUBLICAR — BLOQUEANTE'
      : review ? 'REVISAR — requiere comprobación'
      : scoreToGrade(result.scoreFinal!),
    riesgo: {
      nivel: blocked ? 'ROJO' : review ? 'AMARILLO' : 'VERDE',
      motivo: verdict.resumen,
      advertencias: verdict.hallazgos.filter(h => h.severity === 'BLOCKER' || h.severity === 'WARNING').map(h => h.title),
    },
    recomendacionEditorial: blocked || review ? 'revisar' : approved ? 'publicar' : 'mejorar',
    ...(result.editorialDecision ? {
      editorialDecision: {
        ...result.editorialDecision, riesgoEditorial: risk, motivoPrincipal: verdict.resumen,
        veredictoEjecutivo: {
          ...result.editorialDecision.veredictoEjecutivo,
          publicar: blocked ? 'NO' : review || !approved ? 'MEJORAR' : 'SI',
          riesgoEditorial: risk, respuestaEjecutiva: verdict.resumen,
        },
      } as MeniResult['editorialDecision'],
    } : {}),
  };
}
