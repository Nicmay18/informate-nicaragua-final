/**
 * Editorial Brain — Orquestador
 * =============================
 *
 * Editorial Brain → Intelligence Engine → LLM → Resultado
 *
 * El Editorial Brain analiza el HECHO, no el texto.
 * Decide si vale la pena publicar, qué ángulo tomar,
 * qué preguntas responder, y qué hace diferente a Nicaragua Informate.
 *
 * Solo después el LLM escribe siguiendo las decisiones.
 */

import type { EditorialBrainInput, EditorialDecision, LlmInstructions, RecomendacionEditorial, EstadoEditorial, EditorialRanking, VeredictoEditorJefe } from './types';
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
import { runUtilityGate } from './utility-gate';
import { buildDiagnostico } from './diagnostico';
import { verifyEditorialDecisions } from './verification';
import { computeRanking, analyzeSaturation } from '@/lib/meni/editor-jefe/ranking';
import { applyPatternsToDiagnostic } from '@/lib/meni/editor-jefe/correction-tracker';
import { buildMemoriaEditorial } from '@/lib/meni/editor-jefe/editorial-memory';

export { verifyEditorialDecisions };
export type { EditorialVerification, EditorialVerificationItem } from './types';

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

  // Story Planner — El plan editorial completo
  const storyPlan = runStoryPlanner({
    titulo: input.titulo,
    contenido: input.contenido,
    fuente: input.fuente,
    categoria: input.categoriaSugerida || input.categoria,
  });

  // Anti Clickbait — Valida el título PRE-LLM
  const antiClickbait = runAntiClickbait({
    titulo: input.titulo,
    contenido: input.contenido,
  });

  // Reader Journey — ¿Qué sabe → qué necesita → qué entenderá → qué recordará?
  const readerJourney = runReaderJourney({
    titulo: input.titulo,
    contenido: input.contenido,
    fuente: input.fuente,
    categoria: input.categoriaSugerida || input.categoria,
  });

  // Utility Gate — ¿El lector termina sabiendo algo nuevo?
  const utilityGate = runUtilityGate({
    readerJourney,
    publicValue,
    storyPlan,
    newsValue,
    knowledgeContext: input.knowledgeContext,
    contenido: input.contenido,
  });

  // Diagnóstico Editorial — síntesis de todos los motores
  const diagnostico = buildDiagnostico({
    newsValue,
    competition,
    nicaraguaInformate,
    publicValue,
    editorialDifference,
    storyCompleteness,
    readerJourney,
    storyPlan,
    utilityGate,
    knowledgeContext: input.knowledgeContext,
    contenido: input.contenido,
  });

  // Recomendación editorial — el editor guía, no bloquea
  const recomendacionesCount = utilityGate.recomendacionesEditoriales.length + diagnostico.queLeFaltaParaReferencia.length;
  const tieneProblemasGraves =
    (newsValue.veredicto === 'baja' && newsValue.score < 30) ||
    antiClickbait.veredicto === 'bloqueado';

  const recomendacionEditorial: RecomendacionEditorial = tieneProblemasGraves
    ? 'revisar'
    : recomendacionesCount === 0
    ? 'publicar'
    : 'mejorar';

  // Backward compat: bloquear = true solo para 'revisar'
  const bloquear = recomendacionEditorial === 'revisar';
  const motivosBloqueo: string[] = [];
  if (newsValue.veredicto === 'baja' && newsValue.score < 30) motivosBloqueo.push(`Valor noticioso muy bajo (${newsValue.score}/100). Revisar ángulo editorial.`);
  if (antiClickbait.veredicto === 'bloqueado') motivosBloqueo.push(`Anti Clickbait: ${antiClickbait.razon}`);
  if (utilityGate.recomendacionesEditoriales.length > 0) {
    motivosBloqueo.push(...utilityGate.recomendacionesEditoriales);
  }
  const motivoBloqueo = motivosBloqueo.length > 0 ? motivosBloqueo.join(' | ') : null;

  // El score final se calculará a partir del ADN NI (computeEditorialDNA) abajo.

  // LLM Instructions — lo que el LLM recibe
  // La estructura viene del Story Planner, no del Intelligence Engine
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
      ...(input.knowledgeContext?.antecedentes || []),
      ...(input.knowledgeContext?.contextoParaLlm ? [input.knowledgeContext.contextoParaLlm] : []),
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
    storyPlan,
    readerJourney,
    frasesProhibidas: storyPlan.frasesProhibidas,
    queNoHacer: storyPlan.queNoHacer,
    objetivoPedagogico: readerJourney.objetivoPedagogico,
  };

  const baseDecision: Omit<EditorialDecision, 'editorialDna' | 'estadoEditorial' | 'valeLaPenaPublicar' | 'motivoPrincipal' | 'aportaAlLector' | 'diferenciaCompetencia' | 'utilidadReal' | 'explicacion' | 'contexto' | 'servicio' | 'riesgoEditorial' | 'acciones' | 'patronesAplicados' | 'correccionesSugeridas' | 'ranking' | 'saturacion' | 'memoriaEditorial' | 'veredictoEjecutivo'> = {
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
    storyPlan,
    antiClickbait,
    readerJourney,
    utilityGate,
    diagnostico,
    recomendacionEditorial,
    mensajeEditor: diagnostico.mensajeEditor,
    razonamiento: diagnostico.razonamiento,
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

  // If DNA blocks, upgrade recommendation to 'revisar'
  const finalRecomendacion: RecomendacionEditorial =
    editorialDna.bloquear ? 'revisar' : recomendacionEditorial;

  // Estado Editorial — veredicto periodístico, no número
  const estadoEditorial: EstadoEditorial =
    finalRecomendacion === 'revisar'
      ? 'no_aporta'
      : finalRecomendacion === 'mejorar'
      ? 'necesita_explicacion'
      : editorialDifference.porcentajeDiferencia < 30
      ? 'demasiado_parecida'
      : score >= 85
      ? 'excelente'
      : 'muy_buena';

  // Backward compat: publicar = 'publicar' recommendation AND score meets threshold
  const publicar = finalRecomendacion === 'publicar' && score >= minScore;
  const bloquearFinal = finalRecomendacion === 'revisar';
  const finalMotivoBloqueo = [motivoBloqueo, editorialDna.motivoBloqueo].filter(Boolean).join(' | ') || null;

  // ─────────────────────────────────────────────────────────────
  // Campos planos — única fuente de verdad para UI y engine.ts
  // Todo se deriva de aquí, no de los sub-motores.
  // ─────────────────────────────────────────────────────────────
  const valeLaPenaPublicar = diagnostico.valeLaPenaPublicar.respuesta;
  const motivoPrincipal = finalMotivoBloqueo ?? diagnostico.mensajeEditor;
  const aportaAlLector = diagnostico.queAportaAlLector;
  const diferenciaCompetencia = diagnostico.queAprenderaQueNoEnOtroMedio.respuesta;
  const utilidadReal = publicValue.queAporta || diagnostico.queAportaNicaraguaInformate.respuesta;
  const explicacion = explanation.explicaciones.map(e => `${e.pregunta}: ${e.respuesta}`).join('; ');
  const contexto = [
    ...(input.knowledgeContext?.antecedentes || []),
    ...diagnostico.contextoFalta,
  ].join('; ');
  const servicio = storyPlan.explicacionesServicio.join('; ');
  const riesgoEditorial: 'BAJO' | 'MEDIO' | 'ALTO' =
    estadoEditorial === 'excelente' || estadoEditorial === 'muy_buena'
      ? 'BAJO'
      : estadoEditorial === 'necesita_explicacion'
      ? 'MEDIO'
      : 'ALTO';
  const acciones = diagnostico.queLeFaltaParaReferencia.length > 0
    ? diagnostico.queLeFaltaParaReferencia
    : utilityGate.recomendacionesEditoriales.length > 0
    ? utilityGate.recomendacionesEditoriales
    : ['Lista para publicar'];

  // ─────────────────────────────────────────────────────────────
  // Fase 1: Aprendizaje del Editor
  // Aplicar patrones aprendidos del editor humano
  // ─────────────────────────────────────────────────────────────
  const categoriaForPatterns = input.categoriaSugerida || input.categoria || 'General';
  const { patronesAplicados, correccionesSugeridas } = applyPatternsToDiagnostic(
    input.editorPatterns || [],
    categoriaForPatterns,
  );

  // ─────────────────────────────────────────────────────────────
  // Fase 2: Ranking Editorial + Saturación de Portada
  // ─────────────────────────────────────────────────────────────
  // El ranking necesita el decision completo pero sin los campos nuevos.
  // Lo computamos después de tener score y estadoEditorial.
  const saturacion = input.portadaData && input.portadaData.length > 0
    ? analyzeSaturation(input.portadaData)
    : undefined;

  // ─────────────────────────────────────────────────────────────
  // Fase 3: Memoria Editorial Inteligente
  // ─────────────────────────────────────────────────────────────
  const memoriaEditorial = buildMemoriaEditorial(input.knowledgeQuery, categoriaForPatterns);

  const decision: EditorialDecision = {
    ...baseDecision,
    recomendacionEditorial: finalRecomendacion,
    estadoEditorial,
    score,
    publicar,
    bloquear: bloquearFinal,
    motivoBloqueo: finalMotivoBloqueo,
    editorialDna,
    valeLaPenaPublicar,
    motivoPrincipal,
    aportaAlLector,
    diferenciaCompetencia,
    utilidadReal,
    explicacion,
    contexto,
    servicio,
    riesgoEditorial,
    acciones,
    patronesAplicados,
    correccionesSugeridas,
    ranking: {} as EditorialRanking, // placeholder, computed below
    veredictoEjecutivo: {} as VeredictoEditorJefe, // placeholder, computed below
    ...(saturacion ? { saturacion } : {}),
    ...(memoriaEditorial ? { memoriaEditorial } : {}),
  };

  // Ranking se computa al final porque necesita el decision completo
  decision.ranking = computeRanking(decision);

  // Veredicto ejecutivo único: la única respuesta del Editor Jefe
  decision.veredictoEjecutivo = buildVeredictoEjecutivo(decision);

  return decision;
}

function buildVeredictoEjecutivo(d: EditorialDecision): VeredictoEditorJefe {
  // Publicar
  const publicar: VeredictoEditorJefe['publicar'] =
    d.publicar ? 'SI' : d.recomendacionEditorial === 'revisar' ? 'NO' : 'MEJORAR';

  // Confianza: principalmente ADN NI, ajustada por riesgo
  let confianza = d.score;
  if (d.riesgoEditorial === 'ALTO') confianza -= 20;
  if (d.riesgoEditorial === 'MEDIO') confianza -= 10;
  if (d.memoriaEditorial && d.memoriaEditorial.totalRelacionadas > 0) confianza += 3;
  if (d.patronesAplicados.length > 0) confianza += 2;
  confianza = Math.max(0, Math.min(100, Math.round(confianza)));

  const respuestaEjecutiva = publicar === 'SI'
    ? `Publicar. ${d.aportaAlLector}. ${d.diferenciaCompetencia}.`
    : publicar === 'NO'
    ? `No publicar. ${d.motivoPrincipal}`
    : `Mejorar antes de publicar. ${d.acciones[0] || d.motivoPrincipal}`;

  // Recomendación de portada desde ranking
  const portadaMap: Record<EditorialRanking['valorPortada'], VeredictoEditorJefe['recomendacionPortada']> = {
    principal: 'Hero principal',
    portada: 'Portada principal',
    destacada: 'Portada',
    secundaria: 'Secundaria',
    no_portada: 'No va a portada',
  };

  // Probabilidades desde ranking (Alta/Media/Baja -> Muy alta/Alta/Media/Baja/Muy baja)
  const discoverMap: Record<EditorialRanking['valorDiscover'], VeredictoEditorJefe['probabilidadDiscover']> = {
    Alta: 'Alta',
    Media: 'Media',
    Baja: 'Baja',
  };
  const facebookMap: Record<EditorialRanking['valorFacebook'], VeredictoEditorJefe['probabilidadFacebook']> = {
    Alta: 'Alta',
    Media: 'Media',
    Baja: 'Baja',
  };

  // Antecedentes y patrones como strings legibles
  const antecedentesUsados = d.memoriaEditorial
    ? d.memoriaEditorial.cronologia.slice(0, 5).map(c => `${c.fecha}: ${c.titulo}`)
    : [];
  const patronesAplicados = d.patronesAplicados.map(p => p.descripcion);
  const correccionesEditor = d.correccionesSugeridas;

  return {
    publicar,
    confianza,
    respuestaEjecutiva,
    valorParaLector: d.aportaAlLector,
    valorFrenteCompetencia: d.diferenciaCompetencia,
    riesgoEditorial: d.riesgoEditorial,
    queFalta: d.acciones,
    recomendacionPortada: portadaMap[d.ranking.valorPortada],
    probabilidadFacebook: facebookMap[d.ranking.valorFacebook],
    probabilidadDiscover: discoverMap[d.ranking.valorDiscover],
    antecedentesUsados,
    patronesAplicados,
    correccionesEditor,
  };
}

export type { EditorialDecision, EditorialBrainInput, LlmInstructions } from './types';
