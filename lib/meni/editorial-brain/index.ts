/**
 * Editorial Brain — Orquestador
 * =============================
 * MENI OS v5.0
 *
 * MENI OS → Editorial Brain → Intelligence Engine → LLM → Resultado
 *
 * El Editorial Brain analiza el HECHO, no el texto.
 * Decide si vale la pena publicar, qué ángulo tomar,
 * qué preguntas responder, y qué hace diferente a Nicaragua Informate.
 *
 * Solo después el LLM escribe siguiendo las decisiones.
 */

import type { EditorialBrainInput, EditorialDecision, LlmInstructions } from './types';
import { runNewsValueEngine } from './news-value-engine';
import { runCompetitionEngine } from './competition-engine';
import { runNicaraguaInformateEngine } from './nicaragua-informate-engine';
import { runReaderQuestionsEngine } from './reader-questions-engine';
import { runExplanationEngine } from './explanation-engine';
import { runEditorialDifferenceEngine } from './editorial-difference-engine';
import { runPublicValueEngine } from './public-value-engine';
import { runReaderRetentionEngine } from './reader-retention-engine';
import { runStoryCompletenessEngine } from './story-completeness-engine';
import { runIntelligenceEngine } from '@/lib/meni/intelligence';

export function runEditorialBrain(input: EditorialBrainInput): EditorialDecision {
  // 1. News Value — ¿Vale la pena publicarla?
  const newsValue = runNewsValueEngine(input);

  // 2. Competition — ¿Qué harían TN8, Canal 4, La Prensa?
  const competition = runCompetitionEngine(input);

  // 3. Nicaragua Informate — ¿Por qué leer aquí?
  const nicaraguaInformate = runNicaraguaInformateEngine(input);

  // 4. Reader Questions — ¿Qué preguntas tendrá el lector?
  const readerQuestions = runReaderQuestionsEngine(input);

  // 5. Explanation 2.0 — ¿Por qué, qué significa, qué cambia, cómo afecta?
  const explanation = runExplanationEngine(input);

  // 6. Editorial Difference — ¿Qué hacemos diferente? ¿>30%?
  const editorialDifference = runEditorialDifferenceEngine(input, competition);

  // 7. Public Value — ¿Ayuda o solo informa?
  const publicValue = runPublicValueEngine(input);

  // 8. Reader Retention — ¿Dónde abandona el lector?
  const readerRetention = runReaderRetentionEngine(input);

  // 9. Story Completeness — ¿La historia quedó cerrada?
  const storyCompleteness = runStoryCompletenessEngine(input, readerQuestions);

  // Intelligence Engine (capa inferior: SEO, Facebook, estructura, claridad)
  const intelligence = runIntelligenceEngine({
    ...input,
    fuente: input.fuente || input.contenido,
  });

  // ═══════════════════════════════════════════════════════════
  // Decisión final: ¿publicar o bloquear?
  // ═══════════════════════════════════════════════════════════
  const bloquear =
    nicaraguaInformate.bloquear ||
    editorialDifference.bloquear ||
    newsValue.veredicto === 'baja' && newsValue.score < 30;

  const motivosBloqueo: string[] = [];
  if (nicaraguaInformate.bloquear && nicaraguaInformate.motivoBloqueo) motivosBloqueo.push(nicaraguaInformate.motivoBloqueo);
  if (editorialDifference.bloquear && editorialDifference.motivoBloqueo) motivosBloqueo.push(editorialDifference.motivoBloqueo);
  if (newsValue.veredicto === 'baja' && newsValue.score < 30) motivosBloqueo.push(`Valor noticioso muy bajo (${newsValue.score}/100). No justifica publicación.`);
  const motivoBloqueo = motivosBloqueo.length > 0 ? motivosBloqueo.join(' | ') : null;

  // Score global del Editorial Brain
  const scores = [
    newsValue.score,
    competition.score,
    nicaraguaInformate.score,
    readerQuestions.score,
    explanation.score,
    editorialDifference.score,
    publicValue.score,
    readerRetention.score,
    storyCompleteness.score,
  ];
  const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const publicar = !bloquear && score >= 60;

  // ═══════════════════════════════════════════════════════════
  // LLM Instructions — lo que el LLM recibe
  // ═══════════════════════════════════════════════════════════
  const llmInstructions: LlmInstructions = {
    angulo: competition.enfoqueNicaraguaInformate,
    estructura: intelligence.structure.bloques
      .sort((a, b) => a.prioridad - b.prioridad)
      .map(b => `${b.prioridad}. ${b.tipo}: ${b.contenido}`),
    contextoNecesario: [
      ...intelligence.context.contextoRequerido,
      ...intelligence.background.antecedentes.map(a => a.hecho),
    ],
    explicacionesObligatorias: [
      ...explanation.explicaciones.map(e => `${e.pregunta} → ${e.respuesta}`),
      ...intelligence.clarity.siglasDetectadas.map(s => `${s.sigla}: ${s.significado}`),
      ...intelligence.clarity.institucionesMencionadas.map(i => `${i.nombre}: ${i.descripcion}`),
    ],
    preguntasAResponder: readerQuestions.preguntasObligatorias,
    enfoqueDiferencial: editorialDifference.elementosDiferenciales.join('; '),
    selloEditorial: nicaraguaInformate.selloEditorial,
    tituloSEO: intelligence.google.tituloSEO,
    metaDescripcion: intelligence.google.metaDescripcion,
    slug: intelligence.google.slug,
    keywords: intelligence.google.keywords,
    copyFacebook: intelligence.facebook.copy,
    pieFoto: 'Foto cortesía de RR.SS / Redacción Keyling Rivera M. / INFORMATE NICARAGUA',
  };

  return {
    newsValue,
    competition,
    nicaraguaInformate,
    readerQuestions,
    explanation,
    editorialDifference,
    publicValue,
    readerRetention,
    storyCompleteness,
    intelligence,
    score,
    publicar,
    bloquear,
    motivoBloqueo,
    llmInstructions,
  };
}

export type { EditorialDecision, EditorialBrainInput, LlmInstructions } from './types';
