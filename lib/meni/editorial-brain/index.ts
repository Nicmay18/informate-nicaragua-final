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

import { CONTRATO_GLOBAL } from '../editorial-contract';
import type { EditorialBrainInput, EditorialDecision, LlmInstructions, RecomendacionEditorial, EstadoEditorial, EditorialRanking, VeredictoEditorJefe, PuntoPerdido, EvaluacionCategoria } from './types';
import { USE_MENI_SCORE_V2, MENI_V2_WEIGHTS, MENI_V2_BLEND } from '@/lib/meni/scoring';
import type { EvaluacionEditorial } from '@/lib/editorial';
import { INDIVIDUAL_SPORTS_KEYWORDS } from '../editorial-profiles';
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
import type { EditorialDnaResult } from '@/lib/meni/editorial-dna/types';
import { runStoryPlanner } from '@/lib/meni/story-planner';
import { runAntiClickbait } from '@/lib/meni/anti-clickbait';
import { runReaderJourney } from '@/lib/meni/reader-journey';
import { runUtilityGate } from './utility-gate';
import { buildDiagnostico } from './diagnostico';
import { analyzeUtilidad } from '@/lib/meni/utilidad';
import { analyzeProfundidad } from '@/lib/meni/profundidad';
import { analyzeEEAT } from '@/lib/meni/eeat';
import { calcularPenalizacionEditorial } from '@/lib/meni/penalizacion-editorial';
import { verifyEditorialDecisions } from './verification';
import { computeRanking, analyzeSaturation } from '@/lib/meni/editor-jefe/ranking';
import { applyPatternsToDiagnostic } from '@/lib/meni/editor-jefe/correction-tracker';
import { buildMemoriaEditorial } from '@/lib/meni/editor-jefe/editorial-memory';
import { getCategoryProfile } from './profiles';

export { verifyEditorialDecisions };
export type { EditorialVerification, EditorialVerificationItem } from './types';

export function runEditorialBrain(input: EditorialBrainInput): EditorialDecision {
  // 0. Detectar categoria y cargar perfil editorial
  const categoria = input.categoriaSugerida || input.categoria || 'General';
  const profile = getCategoryProfile(categoria);

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
  const tieneProblemasGraves = antiClickbait.veredicto === 'bloqueado';

  const recomendacionEditorial: RecomendacionEditorial = tieneProblemasGraves
    ? 'revisar'
    : recomendacionesCount === 0
    ? 'publicar'
    : 'mejorar';

  // Backward compat: bloquear = true solo para 'revisar'
  const bloquear = recomendacionEditorial === 'revisar';
  const motivosBloqueo: string[] = [];
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
    enfoqueDiferencial: `${profile.enfoqueDiferencial} ${editorialDifference.elementosDiferenciales.join('; ')}`,
    selloEditorial: `${profile.promptLlm} ${nicaraguaInformate.selloEditorial}`,
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

  const baseDecision: Omit<EditorialDecision, 'editorialDna' | 'estadoEditorial' | 'valeLaPenaPublicar' | 'motivoPrincipal' | 'aportaAlLector' | 'diferenciaCompetencia' | 'utilidadReal' | 'explicacion' | 'contexto' | 'servicio' | 'riesgoEditorial' | 'acciones' | 'readerLearning' | 'editorialContribution' | 'fuentesFaltan' | 'journalistChecklist' | 'patronesAplicados' | 'correccionesSugeridas' | 'ranking' | 'saturacion' | 'memoriaEditorial' | 'veredictoEjecutivo'> = {
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
    puntosPerdidos: [],
  };

  const editorialDna = computeEditorialDNA({
    decision: baseDecision,
    minDnaScore: input.tierThresholds?.minAdnNI,
    minExclusividad: input.tierThresholds?.minExclusividad,
    minWow: input.tierThresholds?.minWow,
    pesosAdnNI: profile.pesosAdnNI,
    pesosSelloNI: profile.pesosSelloNI,
    umbralesBloqueo: profile.umbralesBloqueo,
  });

  // Acciones y puntos perdidos determinan el score ejecutivo transparente.
  const acciones = diagnostico.queLeFaltaParaReferencia.length > 0
    ? diagnostico.queLeFaltaParaReferencia
    : utilityGate.recomendacionesEditoriales.length > 0
    ? utilityGate.recomendacionesEditoriales
    : ['Lista para publicar'];

  const readerLearning = computarReaderLearning(
    explanation.explicaciones,
    diagnostico.queAportaAlLector,
    diagnostico.queAportaNicaraguaInformate.respuesta,
  );
  const editorialContribution = computarEditorialContribution(
    diagnostico.queAprenderaQueNoEnOtroMedio.respuesta,
    diagnostico.queAportaAlLector,
    publicValue.queAporta,
    input.knowledgeContext?.antecedentes,
  );

  const categoriaForPatterns = input.categoriaSugerida || input.categoria || 'General';
  const textoCategoria = [input.titulo, input.contenido, input.resumen].filter(Boolean).join(' ');
  const evaluacionCategoria = calcularEvaluacionCategoria(categoriaForPatterns, textoCategoria);

  const { score, puntosPerdidos } = USE_MENI_SCORE_V2
    ? calcularScoreEjecutivoV2(
        acciones,
        evaluacionCategoria.puntosPerdidos,
        editorialDna.bloquear || tieneProblemasGraves,
        { readerLearning, editorialContribution },
        editorialDna,
        input.evaluacion,
        input,
      )
    : calcularScoreEjecutivo(
        acciones,
        evaluacionCategoria.puntosPerdidos,
        editorialDna.bloquear || tieneProblemasGraves,
        { readerLearning, editorialContribution },
        evaluacionCategoria.bonusValorEditorial,
      );
  const minScore = input.tierThresholds?.minAdnNI ?? 60;

  // Veredicto ejecutivo se deriva del score transparente, no de pesos heredados.
  const finalRecomendacion: RecomendacionEditorial =
    editorialDna.bloquear || tieneProblemasGraves || score < 75
      ? 'revisar'
      : score < 95
      ? 'mejorar'
      : 'publicar';

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

  // ─────────────────────────────────────────────────────────────
  // Fase 1: Aprendizaje del Editor
  // Aplicar patrones aprendidos del editor humano
  // ─────────────────────────────────────────────────────────────
  const { fuentesFaltan, journalistChecklist } = construirJournalistChecklist(input, diagnostico, categoriaForPatterns);

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
    puntosPerdidos,
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
    readerLearning,
    editorialContribution,
    fuentesFaltan,
    journalistChecklist,
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
  decision.veredictoEjecutivo = buildVeredictoEjecutivo(decision, evaluacionCategoria);

  return decision;
}

function buildVeredictoEjecutivo(
  d: EditorialDecision,
  evaluacionCategoria: EvaluacionCategoria,
): VeredictoEditorJefe {
  const publicar: VeredictoEditorJefe['publicar'] =
    d.publicar ? 'SI' : d.recomendacionEditorial === 'revisar' ? 'NO' : 'MEJORAR';

  let confianza = d.score;
  if (d.riesgoEditorial === 'ALTO') confianza -= 20;
  if (d.riesgoEditorial === 'MEDIO') confianza -= 10;
  if (d.memoriaEditorial && d.memoriaEditorial.totalRelacionadas > 0) confianza += 3;
  if (d.patronesAplicados.length > 0) confianza += 2;
  confianza = Math.max(0, Math.min(100, Math.round(confianza)));

  const queFalta = d.acciones.slice(0, 3);

  const respuestaEjecutiva = publicar === 'SI'
    ? `📢 Veredicto del Editor Jefe: ${d.editorialContribution} Además, ${d.readerLearning}`
    : publicar === 'NO'
    ? `📢 Veredicto del Editor Jefe: No publicar. ${d.motivoPrincipal}. No aporta razón suficiente para leerse en Nicaragua Informate.`
    : `📢 Veredicto del Editor Jefe: Mejorar antes de publicar. ${d.acciones[0] || d.motivoPrincipal}. Aún no justifica por qué leerla aquí y no en otro medio.`;

  const portadaMap: Record<EditorialRanking['valorPortada'], VeredictoEditorJefe['recomendacionPortada']> = {
    principal: 'Hero principal',
    portada: 'Portada principal',
    destacada: 'Portada',
    secundaria: 'Secundaria',
    no_portada: 'No va a portada',
  };

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

  const antecedentesUsados = d.memoriaEditorial
    ? d.memoriaEditorial.cronologia.slice(0, 5).map(c => `${c.fecha}: ${c.titulo}`)
    : [];
  const patronesAplicados = d.patronesAplicados.map(p => p.descripcion);
  const correccionesEditor = d.correccionesSugeridas;

  const worthReading = d.editorialContribution === 'Nada'
    ? 'No encuentro una razón.'
    : d.editorialContribution;
  const loQueOtrosNoContaran = d.acciones.filter(a => a !== 'Lista para publicar');
  const wowIdea = extraerIdeaWow(d.diferenciaCompetencia, d.aportaAlLector, d.utilidadReal, d.explicacion);

  return {
    publicar,
    confianza,
    respuestaEjecutiva,
    readerLearning: d.readerLearning,
    editorialContribution: d.editorialContribution,
    worthReading,
    loQueOtrosNoContaran,
    wowIdea,
    evaluacionCategoria,
    fuentesFaltan: d.fuentesFaltan,
    journalistChecklist: d.journalistChecklist,
    valorParaLector: d.aportaAlLector,
    valorFrenteCompetencia: d.diferenciaCompetencia,
    riesgoEditorial: d.riesgoEditorial,
    queFalta,
    recomendacionPortada: portadaMap[d.ranking.valorPortada],
    probabilidadFacebook: facebookMap[d.ranking.valorFacebook],
    probabilidadDiscover: discoverMap[d.ranking.valorDiscover],
    antecedentesUsados,
    patronesAplicados,
    correccionesEditor,
  };
}

interface CriterioCategoria {
  concepto: string;
  terminos: string[];
}



function buildMatricesCategoria(): Record<string, { contexto: CriterioCategoria[]; explicacion: CriterioCategoria[]; servicio: CriterioCategoria[] }> {
  const matrices: Record<string, { contexto: CriterioCategoria[]; explicacion: CriterioCategoria[]; servicio: CriterioCategoria[] }> = {};
  for (const key of Object.keys(CONTRATO_GLOBAL.categorias)) {
    const contrato = CONTRATO_GLOBAL.categorias[key];
    matrices[key] = {
      contexto: contrato.contexto.map((i) => ({ concepto: i.concepto, terminos: i.sinonimos })),
      explicacion: contrato.explicacion.map((i) => ({ concepto: i.concepto, terminos: i.sinonimos })),
      servicio: contrato.servicio.map((i) => ({ concepto: i.concepto, terminos: i.sinonimos })),
    };
  }
  return matrices;
}

const MATRICES_CATEGORIA = buildMatricesCategoria();

function detectarMultiEventosSucesos(base: string): number {
  const lugares = [
    'sabana grande', 'rubenia', 'winston', 'carretera', 'km ', 'kilometro',
    'barrio', 'reparto', 'sector', 'distrito', 'zona', 'comunidad',
    'avenida', 'calle', 'interseccion', 'tramo', 'puente', 'rotonda',
  ];
  const incidentes = [
    'fallecio', 'accidente', 'colision', 'choque', 'volco',
    'estrello', 'atropello', 'incidente', 'caso', 'evento',
    'se registro', 'se produjo', 'se reporto', 'ocurrio',
  ];
  const lugaresEncontrados = lugares.filter(l => base.includes(l));
  const incidentesEncontrados = incidentes.filter(i => base.includes(i));
  if (incidentesEncontrados.length >= 3 && lugaresEncontrados.length >= 3) return 30;
  if (incidentesEncontrados.length >= 2 && lugaresEncontrados.length >= 2) return 20;
  return 0;
}

function calcularEvaluacionCategoria(
  categoria: string,
  texto: string,
): EvaluacionCategoria & { puntosPerdidos: PuntoPerdido[]; bonusValorEditorial: number } {
  const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const base = normalizar(texto);
  const categoriaNormalizada = (categoria || 'General')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  let matrizKey = categoriaNormalizada;
  if (!MATRICES_CATEGORIA[matrizKey]) {
    const match = Object.keys(MATRICES_CATEGORIA).find((k) => k === matrizKey);
    matrizKey = match || 'general';
  }
  if (matrizKey === 'deportes' && INDIVIDUAL_SPORTS_KEYWORDS.test(texto)) {
    matrizKey = 'deportesindividuales';
  }
  const categoriaFinal = matrizKey;
  const matriz = MATRICES_CATEGORIA[matrizKey] || MATRICES_CATEGORIA['general'];

  const puntuar = (criterios: CriterioCategoria[], puntosPorItem: number): { score: number; faltantes: string[]; cumplidos: string[]; perdidos: PuntoPerdido[] } => {
    const faltantes: string[] = [];
    const cumplidos: string[] = [];
    const perdidos: PuntoPerdido[] = [];
    for (const c of criterios) {
      const found = c.terminos.some(t => base.includes(normalizar(t)));
      if (found) {
        cumplidos.push(c.concepto);
      } else {
        faltantes.push(c.concepto);
        perdidos.push({ concepto: c.concepto, puntos: puntosPorItem });
      }
    }
    const score = Math.max(0, Math.round(100 - (perdidos.length / criterios.length) * 100));
    return { score, faltantes, cumplidos, perdidos };
  };

  const ctx = puntuar(matriz.contexto, 2);
  const exp = puntuar(matriz.explicacion, 2);
  const srv = puntuar(matriz.servicio, 2);

  let ctxScore = ctx.score;
  let srvScore = srv.score;
  let srvFaltantes = srv.faltantes;
  let srvCumplidos = srv.cumplidos;
  let srvPerdidos = srv.perdidos;
  let bonusValorEditorial = 0;

  if (matrizKey === 'sucesos') {
    if (ctx.cumplidos.length === matriz.contexto.length) {
      ctxScore = 100;
    }

    const tieneContinuacion = base.includes('continua') || base.includes('continuaran') || base.includes('continuara') || base.includes('sigue');
    const tienePrudencia = base.includes('prudencia') || base.includes('precaucion') || base.includes('cuidado') || base.includes('conducir');
    if (tieneContinuacion && tienePrudencia) {
      srvScore = 100;
      srvFaltantes = [];
      srvCumplidos = matriz.servicio.map(s => s.concepto);
      srvPerdidos = [];
    }

    bonusValorEditorial = detectarMultiEventosSucesos(base);
  }

  const faltantes = [...ctx.faltantes, ...exp.faltantes, ...srvFaltantes];
  const cumplidos = [...ctx.cumplidos, ...exp.cumplidos, ...srvCumplidos];
  const puntosPerdidos = [...ctx.perdidos, ...exp.perdidos, ...srvPerdidos];

  if (bonusValorEditorial > 0) {
    cumplidos.push(`Nota consolidada con múltiples sucesos (+${bonusValorEditorial} valor editorial)`);
  }

  return {
    categoria: categoriaFinal,
    contexto: ctxScore,
    explicacion: exp.score,
    servicio: srvScore,
    faltantes,
    cumplidos,
    puntosPerdidos,
    bonusValorEditorial,
  };
}

export type { EditorialDecision, EditorialBrainInput, EvaluacionCategoria, LlmInstructions, PuntoPerdido } from './types';

function calcularScoreEjecutivoV2(
  acciones: string[],
  puntosCategoria: PuntoPerdido[],
  bloquear: boolean,
  respuestas: { readerLearning: string; editorialContribution: string },
  editorialDna: EditorialDnaResult,
  evaluacion: EvaluacionEditorial | undefined,
  input: EditorialBrainInput,
): { score: number; puntosPerdidos: PuntoPerdido[] } {
  // 1. Base con penalizaciones V1. No se vuelven a duplicar.
  const base = calcularScoreEjecutivo(acciones, puntosCategoria, bloquear, respuestas);

  // 2. Dimensiones editoriales con analizadores V3 para utilidad, profundidad y EEAT.
  const utilidad = analyzeUtilidad(input, evaluacion);
  const profundidad = analyzeProfundidad(input, evaluacion);
  const originalidad = editorialDna.selloNI.originalidad;
  const eeat = evaluacion ? analyzeEEAT(evaluacion).score : 0;
  const aportePropio = evaluacion?.evidence?.originality?.tieneAportePropio ? 100 : 0;
  const adnNI = editorialDna.adnNI;

  // 3. Pesos centralizados en lib/meni/scoring.ts. Los puntos perdidos ya están en base.score.
  const w = MENI_V2_WEIGHTS;
  const totalDim = w.utilidad + w.profundidad + w.originalidad + w.eeat + w.aportePropio + w.adnNI;

  const valorEditorial =
    (utilidad * w.utilidad +
      profundidad * w.profundidad +
      originalidad * w.originalidad +
      eeat * w.eeat +
      aportePropio * w.aportePropio +
      adnNI * w.adnNI) /
    totalDim;

  // 4. Penalización editorial V3.2 (capa aditiva por dimensiones críticas bajas).
  const penalizacionEditorial = calcularPenalizacionEditorial({ utilidad, profundidad, eeat });

  // 5. Blend base/valor centralizado.
  let score = Math.round(
    base.score * MENI_V2_BLEND.base + valorEditorial * MENI_V2_BLEND.valor - penalizacionEditorial,
  );
  if (bloquear) score = Math.min(score, 74);
  score = Math.max(0, Math.min(100, score));

  return { score, puntosPerdidos: base.puntosPerdidos };
}

function calcularScoreEjecutivo(
  acciones: string[],
  puntosCategoria: PuntoPerdido[],
  bloquear: boolean,
  respuestas: { readerLearning: string; editorialContribution: string },
  bonusValorEditorial: number = 0,
): { score: number; puntosPerdidos: PuntoPerdido[] } {
  const puntosPerdidos: PuntoPerdido[] = [...puntosCategoria];
  for (const accion of acciones) {
    if (accion === 'Lista para publicar') continue;
    const baja = accion.toLowerCase();
    // Sólo se castigan con peso los problemas éticos o estructurales graves.
    // Contexto, explicación y servicio se evalúan con la matriz específica de categoría.
    if (baja.includes('transcrib') || baja.includes('copia') || baja.includes('plagiar') || baja.includes('boletín')) {
      puntosPerdidos.push({ concepto: accion, puntos: 10 });
    } else if (baja.includes('sensacionalismo') || baja.includes('clickbait') || baja.includes('prohibida')) {
      puntosPerdidos.push({ concepto: accion, puntos: 8 });
    } else if (baja.includes('dato') || baja.includes('cifra') || baja.includes('nombre') || baja.includes('fuente')) {
      puntosPerdidos.push({ concepto: accion, puntos: 4 });
    } else if (baja.includes('longitud') || baja.includes('extensión') || baja.includes('relleno') || baja.includes('redacción')) {
      puntosPerdidos.push({ concepto: accion, puntos: 3 });
    }
  }

  // Filosofía editorial: sin respuesta sólida, no merece publicarse.
  if (respuestas.readerLearning === 'Nada' || !respuestas.readerLearning || respuestas.readerLearning.trim().length < 10) {
    puntosPerdidos.push({ concepto: 'No enseña nada nuevo al lector', puntos: 25 });
  }
  if (respuestas.editorialContribution === 'Nada' || !respuestas.editorialContribution || respuestas.editorialContribution.trim().length < 10) {
    puntosPerdidos.push({ concepto: 'No aporta razón para leerla en Nicaragua Informate', puntos: 25 });
  } else if (
    respuestas.editorialContribution.toLowerCase().includes('seo') ||
    respuestas.editorialContribution.toLowerCase().includes('bien escrita')
  ) {
    puntosPerdidos.push({ concepto: 'Aporte editorial inválido: SEO o redacción no son valor', puntos: 15 });
  }

  let score = 100 - puntosPerdidos.reduce((s, p) => s + p.puntos, 0);
  // Bonus por valor editorial: notas consolidadas con múltiples sucesos
  score += bonusValorEditorial;
  // Si el DNA o problemas graves bloquean, el score no puede fingir aprobación.
  if (bloquear) score = Math.min(score, 74);
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, puntosPerdidos };
}

function computarReaderLearning(
  explicaciones: { pregunta: string; respuesta: string }[],
  aportaAlLector: string,
  aportaNI: string,
): string {
  const bullets = explicaciones
    .filter(e => e.respuesta && e.respuesta.trim().length > 5)
    .slice(0, 4)
    .map(e => `• ${e.respuesta.trim()}`);
  if (bullets.length === 0) {
    if (aportaAlLector && aportaAlLector.trim().length > 10) return `Después de leer esta nota el lector entenderá: ${aportaAlLector.trim()}`;
    if (aportaNI && aportaNI.trim().length > 10) return `Después de leer esta nota el lector entenderá: ${aportaNI.trim()}`;
    return 'Nada';
  }
  return `Después de leer esta nota el lector entenderá:\n${bullets.join('\n')}`;
}

function computarEditorialContribution(
  diferenciaCompetencia: string,
  aportaAlLector: string,
  utilidadReal: string,
  antecedentes: string[] | undefined,
): string {
  const partes = [
    diferenciaCompetencia,
    aportaAlLector,
    utilidadReal,
    ...(antecedentes || []).slice(0, 2),
  ].filter(Boolean).filter(s => s.trim().length > 5);
  if (partes.length === 0) return 'Nada';
  const limpios = partes.slice(0, 3).map(s => s.trim().replace(/^[A-ZÁÉÍÓÚÑ]/, c => c.toLowerCase()));
  return `Porque ${limpios.join(', porque ')}.`;
}

function extraerIdeaWow(...fuentes: string[]): string {
  const texto = fuentes.filter(Boolean).join('. ').replace(/\s+/g, ' ').trim();
  if (!texto) return 'Nada';
  const frases = texto.split(/(?<=[.!?])\s+/).filter(f => f.length > 10 && f.length < 180);
  if (frases.length === 0) return texto.length <= 180 ? texto : texto.slice(0, 177) + '…';

  const wowWords = ['miles', 'millones', 'mayor', 'mayores', 'primera', 'primero', 'único', 'nunca', 'siempre', 'todos', 'todas', 'nadie', 'cifra', 'registró', 'alcanzó', 'superó', 'renovación', 'emergencia', 'abandonar', 'histórico'];
  const puntuar = (f: string) => {
    let s = 0;
    const nums = f.match(/\d[\d.,]*/g);
    if (nums) s += Math.min(nums.length * 3, 12);
    const lower = f.toLowerCase();
    for (const w of wowWords) if (lower.includes(w)) s += 2;
    if (/\b\d+\s+(?:personas|familias|niños|camiones|dólares|kilos|metros|viviendas|hogares)\b/.test(f)) s += 5;
    if (f.length > 25 && f.length < 120) s += 1;
    return s;
  };

  const mejor = frases.sort((a, b) => puntuar(b) - puntuar(a))[0];
  return mejor.replace(/\.*$/, '') + '.';
}

function construirJournalistChecklist(
  input: EditorialBrainInput,
  diagnostico: { contextoFalta: string[]; queLeFaltaParaReferencia: string[] },
  categoria: string,
): { fuentesFaltan: string[]; journalistChecklist: string[] } {
  const raw = `${input.titulo || ''} ${input.contenido || ''} ${input.resumen || ''}`;
  const lower = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const checklist: string[] = [];
  const fuentesFaltan: string[] = [];

  const add = (dato: string, pregunta: string, ...terms: string[]) => {
    const found = terms.some(t => lower.includes(t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
    if (!found) {
      checklist.push(dato);
      fuentesFaltan.push(`La fuente no responde: ${pregunta}`);
    }
  };

  // Datos universales que toda nota debería poder responder
  add('edad confirmada', '¿Qué edad tenía?', 'años', 'año', 'de edad');
  add('identidad confirmada', '¿Quién era?', 'identificado', 'identificada', 'se trata de', 'nombre es', 'llamado', 'llamada');
  add('versión oficial', '¿Qué dicen las autoridades?', 'policia', 'policía', 'ministerio publico', 'autoridades', 'fiscalía', 'fiscalia', 'comisionado', 'comisionada');
  add('detenidos', '¿Hay detenidos?', 'detenido', 'detenidos', 'arrestado', 'arrestados', 'capturado', 'capturados');
  add('móvil del hecho', '¿Qué motivó el hecho?', 'motivo', 'móvil', 'provocó', 'ocasionó', 'razón');
  add('antecedentes', '¿Hay antecedentes?', 'antecedente', 'antecedentes', 'historial', 'registro', 'pasado');
  add('consecuencias', '¿Qué consecuencias tiene?', 'consecuencia', 'impacto', 'afectó', 'provocó', 'resultó', 'dejó');
  add('siguiente paso', '¿Qué sigue?', 'investigación', 'próximo', 'proximo', 'siguiente', 'continúa', 'continua', 'se investiga');

  const cat = categoria.toLowerCase();
  if (cat.includes('suceso')) {
    add('lugar confirmado', '¿Dónde ocurrió exactamente?', 'barrio', 'colonia', 'km', 'kilómetro', 'dirección');
    add('hora del hecho', '¿A qué hora ocurrió?', 'hora', 'de la madrugada', 'de la tarde', 'de la noche');
    add('testigo o versión familiar', '¿Qué dicen testigos o familiares?', 'testigo', 'testigos', 'familiar', 'familiares', 'versión');
  } else if (cat.includes('nacional')) {
    add('institución responsable', '¿Qué institución interviene?', 'institución', 'ministerio', 'alcaldía', 'gobierno', 'municipio');
    add('alcance de la medida', '¿A quiénes afecta?', 'beneficiarios', 'afectados', 'alcance', 'población');
  } else if (cat.includes('internacional')) {
    add('impacto para Nicaragua', '¿Afecta a Nicaragua?', 'nicaragua', 'impacto nicaragua', 'relación', 'vínculo');
    add('datos oficiales del otro país', '¿Qué dicen autoridades del otro país?', 'gobierno', 'país', 'oficial');
  } else if (cat.includes('deporte')) {
    add('tabla o clasificación', '¿Cómo quedó la clasificación?', 'tabla', 'clasificación', 'puntos', 'posición');
    add('siguiente partido', '¿Cuál es el siguiente partido?', 'próximo', 'siguiente partido', 'siguiente encuentro');
  } else if (cat.includes('econom')) {
    add('cifra concreta', '¿Cuál es la cifra exacta?', 'córdoba', 'dólar', 'millones', 'miles', 'cantidad', 'monto');
    add('fuente oficial económica', '¿Quién confirmó la cifra?', 'banco', 'ministerio de hacienda', 'banco central', 'ine');
  } else if (cat.includes('tecnolog')) {
    add('cómo funciona', '¿Cómo funciona?', 'funciona', 'operación', 'cómo se usa', 'características');
    add('disponibilidad en Nicaragua', '¿Llega a Nicaragua?', 'nicaragua', 'disponible', 'precio', 'lanzamiento');
  } else if (cat.includes('espectáculo')) {
    add('horarios', '¿Cuándo y a qué hora?', 'horario', 'hora', 'fecha', 'día');
    add('precio y cómo asistir', '¿Cuánto cuesta y cómo asistir?', 'precio', 'entrada', 'boleto', 'cómo asistir', 'lugar');
  }

  // Si los sub-motores detectaron carencias concretas, las añadimos sin repetir
  const extra = [
    ...diagnostico.contextoFalta,
    ...diagnostico.queLeFaltaParaReferencia,
  ].filter(Boolean).filter(c =>
    !checklist.some(item => c.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(c.toLowerCase()))
  );
  if (extra.length > 0) {
    checklist.push(...extra.slice(0, 4).map(c => c.trim()));
    fuentesFaltan.push(...extra.slice(0, 4).map(c => `La fuente no aclara: ${c}`));
  }

  return {
    fuentesFaltan: fuentesFaltan.slice(0, 9),
    journalistChecklist: checklist.slice(0, 9),
  };
}
