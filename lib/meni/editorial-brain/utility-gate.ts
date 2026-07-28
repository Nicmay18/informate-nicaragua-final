/**
 * Utility Gate — ¿El lector termina sabiendo algo nuevo?
 * ========================================================
 * No es un motor más. Es la pregunta fundamental.
 * Si el lector no aprende nada, la nota no merece existir.
 *
 * Sintetiza: ReaderJourney + PublicValue + StoryPlanner + KnowledgeContext
 * para determinar si hay valor informativo nuevo.
 */

import type {
  UtilityGateResult,
  PublicValueDecision,
  KnowledgeContext,
  NewsValueDecision,
} from './types';
import type { ReaderJourneyResult } from '@/lib/meni/reader-journey/types';
import type { StoryPlan } from '@/lib/meni/story-planner/types';

export function runUtilityGate(params: {
  readerJourney: ReaderJourneyResult;
  publicValue: PublicValueDecision;
  storyPlan: StoryPlan;
  newsValue: NewsValueDecision;
  knowledgeContext?: KnowledgeContext;
  contenido: string;
}): UtilityGateResult {
  const { readerJourney, publicValue, storyPlan, newsValue, knowledgeContext, contenido } = params;

  const queAprende: string[] = [];
  const bloqueadores: string[] = [];

  // 1. ¿Qué aprenderá el lector? — desde ReaderJourney
  if (readerJourney.queEntendera.length > 0) {
    queAprende.push(...readerJourney.queEntendera);
  }
  if (readerJourney.queRecordara.length > 0) {
    queAprende.push(...readerJourney.queRecordara);
  }

  // 2. ¿Hay explicaciones de servicio? — desde StoryPlanner
  if (storyPlan.explicacionesServicio.length > 0) {
    queAprende.push(...storyPlan.explicacionesServicio);
  }

  // 3. ¿El Public Value dice que solo informa?
  if (publicValue.soloInforma && queAprende.length === 0) {
    bloqueadores.push('La nota solo informa datos sin aportar explicación, contexto ni servicio al lector.');
  }

  // 4. ¿El Reader Journey detectó brecha de conocimiento pero no hay qué entenderá?
  if (readerJourney.brechaDeConocimiento.length > 0 && readerJourney.queEntendera.length === 0) {
    bloqueadores.push('Se detectaron vacíos de conocimiento pero el artículo no los resolverá.');
  }

  // 5. ¿Es un hecho repetido sin nueva información? — desde KnowledgeContext
  if (knowledgeContext?.hasMemory) {
    const antecedentesRecientes = knowledgeContext.timeline.filter(t => {
      const days = Math.floor((Date.now() - new Date(t.date).getTime()) / 86400000);
      return days <= 7;
    });
    if (antecedentesRecientes.length >= 3 && queAprende.length <= 1) {
      bloqueadores.push(`Este tema ya apareció ${antecedentesRecientes.length} veces en los últimos 7 días sin que la nota aporte un ángulo nuevo.`);
    }
  }

  // 6. ¿El News Value es muy bajo?
  if (newsValue.veredicto === 'baja' && newsValue.utilidad < 20) {
    bloqueadores.push(`Utilidad muy baja (${newsValue.utilidad}/100). El lector no obtiene valor práctico.`);
  }

  // 7. ¿El contenido es demasiado breve para aportar valor?
  const palabras = contenido.split(/\s+/).filter(Boolean).length;
  if (palabras < 30 && queAprende.length === 0) {
    bloqueadores.push('El hecho es demasiado breve para generar valor informativo.');
  }

  const aportaNuevo = queAprende.length > 0 && bloqueadores.length === 0;
  const bloquear = bloqueadores.length > 0;
  const motivoBloqueo = bloquear ? bloqueadores.join(' | ') : null;

  // Score: basado en cuántas cosas aprenderá el lector
  const baseScore = Math.min(queAprende.length * 15, 60);
  const bonusServicio = storyPlan.explicacionesServicio.length > 0 ? 20 : 0;
  const bonusConocimiento = knowledgeContext?.hasMemory ? 10 : 0;
  const penalty = bloqueadores.length * 20;
  const score = Math.max(0, Math.min(100, baseScore + bonusServicio + bonusConocimiento - penalty));

  return {
    aportaNuevo,
    queAprendeElLector: queAprende,
    bloquear,
    motivoBloqueo,
    score,
  };
}
