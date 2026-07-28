/**
 * Utility Gate — ¿El lector termina sabiendo algo nuevo?
 * ========================================================
 * MENI v9: No bloquea. Guía.
 * Si el lector no aprende nada, el editor le dice qué falta.
 *
 * Sintetiza: ReaderJourney + PublicValue + StoryPlanner + KnowledgeContext
 * para generar recomendaciones editoriales accionables.
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
  const recomendacionesEditoriales: string[] = [];

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
    recomendacionesEditoriales.push('La nota solo informa datos. Agrega explicación, contexto o servicio al lector para que aporte valor real.');
  }

  // 4. ¿El Reader Journey detectó brecha de conocimiento pero no hay qué entenderá?
  if (readerJourney.brechaDeConocimiento.length > 0 && readerJourney.queEntendera.length === 0) {
    recomendacionesEditoriales.push(`El lector tendrá dudas: ${readerJourney.brechaDeConocimiento.slice(0, 3).join('; ')}. Responde estas preguntas en el texto.`);
  }

  // 5. ¿Es un hecho repetido sin nueva información? — desde KnowledgeContext
  if (knowledgeContext?.hasMemory) {
    const antecedentesRecientes = knowledgeContext.timeline.filter(t => {
      const days = Math.floor((Date.now() - new Date(t.date).getTime()) / 86400000);
      return days <= 7;
    });
    if (antecedentesRecientes.length >= 3 && queAprende.length <= 1) {
    recomendacionesEditoriales.push(`Este tema ya apareció ${antecedentesRecientes.length} veces en los últimos 7 días. Encuentra un ángulo nuevo o aporta datos adicionales que la cobertura anterior no tuvo.`);
    }
  }

  // 6. ¿El News Value es muy bajo?
  if (newsValue.veredicto === 'baja' && newsValue.utilidad < 20) {
    recomendacionesEditoriales.push(`La utilidad para el lector es baja (${newsValue.utilidad}/100). Considera qué servicio práctico puede ofrecer esta nota.`);
  }

  // 7. ¿El contenido es demasiado breve para aportar valor?
  const palabras = contenido.split(/\s+/).filter(Boolean).length;
  if (palabras < 30 && queAprende.length === 0) {
    recomendacionesEditoriales.push('El hecho es demasiado breve. Amplía con contexto, antecedentes o explicación para generar valor informativo.');
  }

  const aportaNuevo = queAprende.length > 0 && recomendacionesEditoriales.length === 0;
  // Backward compat: bloquear = true when there are critical recommendations
  const bloquear = recomendacionesEditoriales.length > 0 && !aportaNuevo;
  const motivoBloqueo = bloquear ? recomendacionesEditoriales.join(' | ') : null;

  // Score: basado en cuántas cosas aprenderá el lector
  const baseScore = Math.min(queAprende.length * 15, 60);
  const bonusServicio = storyPlan.explicacionesServicio.length > 0 ? 20 : 0;
  const bonusConocimiento = knowledgeContext?.hasMemory ? 10 : 0;
  const penalty = recomendacionesEditoriales.length * 15;
  const score = Math.max(0, Math.min(100, baseScore + bonusServicio + bonusConocimiento - penalty));

  return {
    aportaNuevo,
    queAprendeElLector: queAprende,
    recomendacionesEditoriales,
    bloquear,
    motivoBloqueo,
    score,
  };
}
