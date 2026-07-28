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
import { computeEditorialDNA } from '@/lib/meni/editorial-dna/engine';
import { runStoryPlanner } from '@/lib/meni/story-planner';
import { runAntiClickbait } from '@/lib/meni/anti-clickbait';
import { runReaderJourney } from '@/lib/meni/reader-journey';

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
  // MENI v7: Nuevos módulos — deciden ANTES de que el LLM escriba
  // ═══════════════════════════════════════════════════════════

  // 10. Story Planner — El plan editorial completo
  const storyPlan = runStoryPlanner({
    titulo: input.titulo,
    contenido: input.contenido,
    fuente: input.fuente,
    categoria: input.categoriaSugerida || input.categoria,
  });

  // 11. Anti Clickbait Engine — Valida el título PRE-LLM
  const antiClickbait = runAntiClickbait({
    titulo: input.titulo,
    contenido: input.contenido,
  });

  // 12. Reader Journey — ¿Qué sabe → qué necesita → qué entenderá → qué recordará?
  const readerJourney = runReaderJourney({
    titulo: input.titulo,
    contenido: input.contenido,
    fuente: input.fuente,
    categoria: input.categoriaSugerida || input.categoria,
  });

  // ═══════════════════════════════════════════════════════════
  // Decisión final: ¿publicar o bloquear?
  // ═══════════════════════════════════════════════════════════
  const bloquear =
    nicaraguaInformate.bloquear ||
    editorialDifference.bloquear ||
    (newsValue.veredicto === 'baja' && newsValue.score < 30) ||
    antiClickbait.veredicto === 'bloqueado';

  const motivosBloqueo: string[] = [];
  if (nicaraguaInformate.bloquear && nicaraguaInformate.motivoBloqueo) motivosBloqueo.push(nicaraguaInformate.motivoBloqueo);
  if (editorialDifference.bloquear && editorialDifference.motivoBloqueo) motivosBloqueo.push(editorialDifference.motivoBloqueo);
  if (newsValue.veredicto === 'baja' && newsValue.score < 30) motivosBloqueo.push(`Valor noticioso muy bajo (${newsValue.score}/100). No justifica publicación.`);
  if (antiClickbait.veredicto === 'bloqueado') motivosBloqueo.push(`Anti Clickbait: ${antiClickbait.razon}`);
  const motivoBloqueo = motivosBloqueo.length > 0 ? motivosBloqueo.join(' | ') : null;

  // El score final se calculará a partir del ADN NI (computeEditorialDNA) abajo.

  // ═══════════════════════════════════════════════════════════
  // LLM Instructions — lo que el LLM recibe
  // ═══════════════════════════════════════════════════════════
  // MENI v7: La estructura ahora viene del Story Planner, no del Intelligence Engine
  const estructuraFromPlanner = storyPlan.ordenNarrativo.map(
    b => `${b.orden}. ${b.tipo}: ${b.descripcion} — Incluir: ${b.queIncluir.join(', ')}`
  );

  const llmInstructions: LlmInstructions = {
    angulo: storyPlan.anguloNI,
    estructura: estructuraFromPlanner,
    contextoNecesario: [
      ...intelligence.context.contextoRequerido,
      ...intelligence.background.antecedentes.map(a => a.hecho),
      ...readerJourney.brechaDeConocimiento,
    ],
    explicacionesObligatorias: [
      ...explanation.explicaciones.map(e => `${e.pregunta} → ${e.respuesta}`),
      ...intelligence.clarity.siglasDetectadas.map(s => `${s.sigla}: ${s.significado}`),
      ...intelligence.clarity.institucionesMencionadas.map(i => `${i.nombre}: ${i.descripcion}`),
      ...storyPlan.explicacionesServicio,
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
    // MENI v7
    storyPlan,
    readerJourney,
    frasesProhibidas: storyPlan.frasesProhibidas,
    queNoHacer: storyPlan.queNoHacer,
    objetivoPedagogico: readerJourney.objetivoPedagogico,
  };

  const baseDecision: Omit<EditorialDecision, 'editorialDna'> = {
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
    // MENI v7
    storyPlan,
    antiClickbait,
    readerJourney,
    score: 0,
    publicar: false,
    bloquear,
    motivoBloqueo,
    llmInstructions,
  };

  const editorialDna = computeEditorialDNA({
    decision: baseDecision,
    minDnaScore: input.tierThresholds?.minAdnNI,
    minExclusividad: input.tierThresholds?.minExclusividad,
    minWow: input.tierThresholds?.minWow,
  });
  const score = editorialDna.adnNI;
  const minScore = input.tierThresholds?.minAdnNI ?? 60;
  const publicar = !bloquear && !editorialDna.bloquear && score >= minScore;
  const finalMotivoBloqueo = [motivoBloqueo, editorialDna.motivoBloqueo].filter(Boolean).join(' | ') || null;

  const decision: EditorialDecision = {
    ...baseDecision,
    score,
    publicar,
    bloquear: bloquear || editorialDna.bloquear,
    motivoBloqueo: finalMotivoBloqueo,
    editorialDna,
  };

  return decision;
}

export type { EditorialDecision, EditorialBrainInput, LlmInstructions } from './types';
