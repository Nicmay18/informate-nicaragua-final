import { pipelineV4 } from '@/lib/editorial';
import type { EvaluacionEditorial, NoticiaInput as EditorialNoticiaInput } from '@/lib/editorial';
import { generarMetaDescription } from '@/lib/editorial/meta';
import type { NoticiaInput, MeniResult, MeniRiesgoEditorial, MeniRecomendacion } from './types';
import { analyzeForensic } from './forensic';
import { analyzeEEAT } from './eeat';
import { analyzeSEO } from './seo';
import { analyzeDiscover } from './discover';
import { analyzeAdSense } from './adsense';
import {
  computePriority,
  scoreToGrade,
  normalizeCategory,
  MIN_APPROVED_SCORE,
} from './scoring';
import { autoCorrectNoticia, type AutoCorrection } from './autocorrect';
import { audit } from './auditor';
import { buildValorEditorial } from './editor-chief';
import { getModule } from './modules';
import { runIntelligenceEngine } from './intelligence';
import { detectarDuplicadoAdmin } from '@/lib/analizador-duplicados';
import { runQualityGate } from '@/lib/meni/quality-gate';
import {
  buildMeniDiagnostics,
  buildDuplicateBlockingIssue,
  logMeni,
  logTime,
} from './diagnostics';
import { runEditorBrain, ingestPublishedArticle, type EditorBrainResult } from '@/lib/meni/editor-brain';
import { runEditorialBrain } from '@/lib/meni/editorial-brain';
import { detectTier, TIER_THRESHOLDS, type EditorialTier } from '@/lib/meni/editorial-tiers';
import { getPerfilEditorial } from '@/lib/meni/editorial-profiles';
import { buildEditorialReason } from '@/lib/meni/editorial-reason';
import { detectContentProfile, type MeniContentProfile } from '@/lib/meni/profile-detector';
import { computeInputHash } from '@/lib/meni/hash';
import { computeContextScore } from '@/lib/meni/contextualiza';
import { filterRecommendations } from '@/lib/meni/recommendation-filter';
import type { ActiveAdjustments } from '@/lib/meni/learning-engine/learning-adapter';

export interface MeniRunOptions {
  db?: any; // Admin Firestore instance
  skipDuplicateCheck?: boolean;
  skipEditorBrain?: boolean;
  editorBrain?: EditorBrainResult;
  activeAdjustments?: ActiveAdjustments;
  editorJefe?: {
    editorPatterns?: import('@/lib/meni/editorial-brain/types').EditorPattern[];
    portadaData?: { categoria: string; fecha: string }[];
    knowledgeQuery?: import('@/lib/meni/knowledge-base/types').KnowledgeQueryResult;
  };
}

const MIN_PROFILE_CONFIDENCE = 0.25;

const PROFILE_TO_CATEGORIA: Record<MeniContentProfile, string> = {
  sucesos: 'Sucesos',
  violencia_genero: 'Sucesos',
  nacionales: 'Nacionales',
  politica: 'Política',
  economia: 'Economía',
  salud: 'Salud',
  deportes: 'Deportes',
  cultura: 'Cultura',
  tecnologia: 'Tecnología',
  internacional: 'Internacionales',
  educacion: 'Educación',
  ambiente: 'Ambiente',
  turismo: 'Turismo',
  gastronomia: 'Cultura',
};

function findInvalidScoreSource(editorialDecision: any, editorialDna: any): string {
  const checks: { path: string; value: unknown }[] = [
    { path: 'editorialDecision.score', value: editorialDecision?.score },
    { path: 'editorialDna.adnNI', value: editorialDna?.adnNI },
    { path: 'editorialDna.exclusividad.score', value: editorialDna?.exclusividad?.score },
    { path: 'editorialDna.wow.score', value: editorialDna?.wow?.score },
    { path: 'editorialDna.selloNI.contextualiza', value: editorialDna?.selloNI?.contextualiza },
    { path: 'editorialDna.selloNI.explica', value: editorialDna?.selloNI?.explica },
    { path: 'editorialDna.selloNI.servicio', value: editorialDna?.selloNI?.servicio },
    { path: 'editorialDna.selloNI.originalidad', value: editorialDna?.selloNI?.originalidad },
  ];
  for (const { path, value } of checks) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return `Score inválido detectado en ${path}`;
    }
  }
  if (Array.isArray(editorialDecision?.puntosPerdidos)) {
    for (let i = 0; i < editorialDecision.puntosPerdidos.length; i++) {
      const p = editorialDecision.puntosPerdidos[i];
      if (typeof p?.puntos !== 'number' || !Number.isFinite(p.puntos)) {
        return `Punto perdido inválido en índice ${i}: ${p?.concepto ?? '?'}`;
      }
    }
  }
  return 'Fuente desconocida';
}

function evaluateMeni(input: NoticiaInput, activeAdjustments?: ActiveAdjustments, editorJefe?: MeniRunOptions['editorJefe'], now = new Date()): MeniResult {
  const t0 = Date.now();
  logMeni('=== runMeni start ===', input.titulo);

  // ── FASE 2 + 3: perfil y trazabilidad ─────────────────────────────
  const articleHash = computeInputHash(input);
  const contentProfile = detectContentProfile(input.titulo, input.contenido, input.resumen);
  const perfilIdentificado = contentProfile.profile_confidence >= MIN_PROFILE_CONFIDENCE;
  const profileCategoria = perfilIdentificado
    ? normalizeCategory(PROFILE_TO_CATEGORIA[contentProfile.profile_detected])
    : normalizeCategory(input.categoria || 'General');
  logMeni('Content profile detected', {
    profile: contentProfile.profile_detected,
    confidence: contentProfile.profile_confidence,
    perfilIdentificado,
    profileCategoria,
  });

  // Detectar tier editorial (FLASH, NOTICIA, REPORTAJE, INVESTIGACION)
  const tier: EditorialTier = detectTier({
    titulo: input.titulo,
    contenido: input.contenido,
    categoria: input.categoria,
  });
  let thresholds = { ...TIER_THRESHOLDS[tier] };

  // Aplicar criterios del perfil editorial según tipo_noticia_detectada
  const perfil = getPerfilEditorial(profileCategoria, input.contenido);
  thresholds = {
    ...thresholds,
    exigeServiceValue: perfil.bloqueaPorServicio,
    exigeContexto: perfil.exigeContexto,
    exigeDifferentialValue: perfil.exigeDiferencial,
    minPalabras: Math.max(thresholds.minPalabras, perfil.minPalabras),
  };

  // Aplicar overrides del Learning Engine si existen
  if (activeAdjustments?.tierOverrides?.[tier]) {
    const override = activeAdjustments.tierOverrides[tier]!;
    if (override.minAdnNI != null) thresholds = { ...thresholds, minAdnNI: override.minAdnNI };
    if (override.minQualityGateScore != null) thresholds = { ...thresholds, minQualityGateScore: override.minQualityGateScore };
    if (override.minExclusividad != null) thresholds = { ...thresholds, minExclusividad: override.minExclusividad };
    if (override.minWow != null) thresholds = { ...thresholds, minWow: override.minWow };
    logMeni('Learning Engine tier overrides applied', { tier, override });
  }

  logMeni('Editorial tier detected', { tier, descripcion: thresholds.descripcion });

  // ═══════════════════════════════════════════════════════════
  // 2. ANÁLISIS TÉCNICO — previo al Editorial Brain para alimentar MENI Score V2
  // SEO, EEAT, Discover, AdSense, Forense = datos de respaldo
  // ═══════════════════════════════════════════════════════════
  const evaluacion: EvaluacionEditorial = pipelineV4(input as EditorialNoticiaInput);
  const rawCategory = evaluacion.evidence.category || profileCategoria || 'general';
  const categoria = profileCategoria;
  const modulo = getModule(rawCategory);

  // ═══════════════════════════════════════════════════════════
  // 1. EDITORIAL BRAIN — la única fuente de verdad
  // Todo deriva de aquí: score, aprobado, estado, diagnostico, riesgo
  // ═══════════════════════════════════════════════════════════
  const editorialDecision = runEditorialBrain({
    ...input,
    categoria: profileCategoria,
    categoriaSugerida: profileCategoria,
    fuente: input.contenido,
    tierThresholds: thresholds,
    evaluacion,
    ...(editorJefe?.editorPatterns ? { editorPatterns: editorJefe.editorPatterns } : {}),
    ...(editorJefe?.portadaData ? { portadaData: editorJefe.portadaData } : {}),
    ...(editorJefe?.knowledgeQuery ? { knowledgeQuery: editorJefe.knowledgeQuery } : {}),
  });
  const editorialDna = editorialDecision.editorialDna;

  const seo = analyzeSEO(evaluacion, input);
  const forense = analyzeForensic(evaluacion);
  const eeat = analyzeEEAT(evaluacion);
  const discover = analyzeDiscover(evaluacion);
  const adsense = analyzeAdSense(evaluacion);
  const valorEditorial = buildValorEditorial(evaluacion);
  const auditoria = audit(evaluacion);

  const textoPlano = evaluacion.evidence.textoPlano ?? (input.contenido || '');
  const resumenOptimizado = generarMetaDescription(textoPlano, input.resumen);

  const intelligence = runIntelligenceEngine({
    ...input,
    fuente: input.contenido,
  });

  // ═══════════════════════════════════════════════════════════
  // 3. QUALITY GATE — verificación técnica, puede reportar issues
  // Ahora recibe la decisión editorial como fuente de verdad para
  // evitar recalcular originalidad, servicio o score.
  // ═══════════════════════════════════════════════════════════
  const qualityGate = runQualityGate({
    titulo: input.titulo,
    contenido: input.contenido,
    categoria,
    stage: 'POST_LLM',
    sourceOfTruth: {
      score: editorialDecision.score,
      originalidad: editorialDecision.editorialDna.selloNI.originalidad,
      servicio: editorialDecision.editorialDna.selloNI.servicio,
      bloqueado: editorialDecision.bloquear,
      explanationIndex: {
        porcentajeContexto: editorialDecision.editorialDna.selloNI.contextualiza,
        porcentajeExplicacion: editorialDecision.editorialDna.selloNI.explica,
        porcentajeServicio: editorialDecision.editorialDna.selloNI.servicio,
      },
    },
  });

  // Deterministic timestamp: same input must produce same evaluationTimestamp
  qualityGate.timestamp = now.toISOString();

  const palabrasTexto = textoPlano.split(/\s+/).filter(Boolean).length;

  // Quality Gate: solo bloquear por issues técnicos/factuales que el
  // Editorial Brain no evalúa (contradicciones, cronología, duplicados).
  const tierBlockingIssues = qualityGate.issues.filter((i) => i.severidad === 'blocking');

  const tierQualityGateBloqueado = tierBlockingIssues.some((i) => i.severidad === 'blocking');

  const adnTranscripcionBloquear =
    (qualityGate.explanationIndex?.porcentajeTranscripcion ?? 0) > thresholds.maxTranscripcion;

  // ═══════════════════════════════════════════════════════════
  // 4. DERIVAR TODO DE EDITORIAL DECISION
  // No hay scores paralelos. El ADN NI es el score final.
  // ═══════════════════════════════════════════════════════════
  const rawScore = editorialDecision.score;
  const scoreIsValid = typeof rawScore === 'number' && Number.isFinite(rawScore);
  const scoreFinal: number | null = scoreIsValid ? Math.max(0, Math.min(100, rawScore)) : null;
  const finalEditorialScore: number | null = scoreFinal;
  const invalidScoreSource = scoreIsValid ? undefined : findInvalidScoreSource(editorialDecision, editorialDna);
  const score_status: MeniResult['score_status'] = scoreIsValid ? 'VALID' : 'INVALID';
  const score: number | null = scoreFinal;

  const aprobadoFinal = scoreIsValid
    && scoreFinal! >= MIN_APPROVED_SCORE
    && !editorialDecision.bloquear
    && !tierQualityGateBloqueado
    && !adnTranscripcionBloquear;

  const calificacion = scoreIsValid ? scoreToGrade(scoreFinal!) : 'ERROR DE EVALUACIÓN';
  const prioridad = computePriority(evaluacion.veredicto);
  const diagnostico = scoreIsValid ? editorialDecision.mensajeEditor : 'MENI no pudo calcular el score correctamente.';

  // Riesgo derivado del EditorialDecision, no de pipelineV4
  const riesgoEditorial: MeniRiesgoEditorial = scoreIsValid
    ? {
        nivel: editorialDecision.riesgoEditorial === 'BAJO' ? 'VERDE'
          : editorialDecision.riesgoEditorial === 'MEDIO' ? 'AMARILLO' : 'ROJO',
        motivo: editorialDecision.motivoPrincipal,
        advertencias: editorialDecision.acciones,
      }
    : {
        nivel: 'ROJO',
        motivo: 'Score no calculable',
        advertencias: ['MENI no pudo calcular el score correctamente.'],
      };

  // ── FASE 4 + 5: Explicabilidad y veredicto único ──
  const contextScore = computeContextScore(input.titulo, input.contenido, input.resumen, contentProfile.profile_detected);
  const estadoFinal: MeniResult['estadoFinal'] = scoreIsValid
    ? (aprobadoFinal ? 'APROBADO' : calificacion === 'MEJORAR' ? 'MEJORAR' : 'NO_PUBLICAR')
    : 'EVALUATION_ERROR';
  const verdict: MeniResult['verdict'] = scoreIsValid
    ? (aprobadoFinal ? 'APROBADO' : calificacion === 'MEJORAR' ? 'MEJORAR' : 'NO_PUBLICAR')
    : 'EVALUATION_ERROR';
  const publication_decision: MeniResult['publication_decision'] = scoreIsValid
    ? (aprobadoFinal ? 'APROBADO' : 'NO_PUBLICAR')
    : 'NOT_EVALUATED';

  // Recomendaciones derivadas de EditorialDecision.acciones
  const recomendacionesFinal: MeniRecomendacion[] = !aprobadoFinal
    ? editorialDecision.acciones.map((a) => ({
        area: 'editorial' as const,
        severidad: 'alta' as const,
        mensaje: a,
      }))
    : [];

  // ── FASE 6: Recomendaciones dinámicas por perfil ──
  const recomendacionesContextuales = filterRecommendations(
    recomendacionesFinal,
    contentProfile.profile_detected,
    input.titulo,
    input.contenido,
    input.resumen,
  );

  // Construir razón editorial explicativa
  const editorialReason = buildEditorialReason({
    aprobado: aprobadoFinal,
    tier,
    thresholds,
    editorialDna,
    qualityGate,
    palabras: palabrasTexto,
    categoria,
  });

  const { blockingIssues, warnings } = buildMeniDiagnostics({ qualityGate, scoreFinal, aprobado: aprobadoFinal, editorialDna });
  logMeni('Quality gate result', {
    bloqueado: qualityGate.bloqueado,
    issuesCount: qualityGate.issues.length,
    originalidad: qualityGate.originalidadPorcentaje,
    editorScore: qualityGate.editorScore,
    motivosBloqueo: qualityGate.motivosBloqueo,
  });
  logMeni('ADN NI result', {
    adnNI: editorialDna.adnNI,
    exclusividad: editorialDna.exclusividad.score,
    wow: editorialDna.wow.score,
    selloNI: editorialDna.selloNI,
    bloquear: editorialDna.bloquear,
  });
  logMeni('=== runMeni end ===', {
    scoreFinal,
    adnNI: editorialDna.adnNI,
    aprobado: aprobadoFinal,
    blockingIssues: blockingIssues.length,
    warnings: warnings.length,
  });
  logTime('runMeni', t0);

  return {
    version: '2.0',
    meniVersion: '2.1.1-prod',
    estado: 'Activo',
    categoria,
    modulo: modulo.nombre,
    prioridad,
    riesgo: riesgoEditorial,
    seo,
    eeat,
    discover,
    adsense,
    forense,
    valorEditorial,
    auditoria,
    diagnostico,
    scoreFinal,
    finalEditorialScore,
    estadoFinal,
    aprobado: aprobadoFinal,
    calificacion,
    score_status,
    score,
    verdict,
    publication_decision,
    invalidScoreSource,
    puntosPerdidos: editorialDecision.puntosPerdidos,
    recomendaciones: recomendacionesContextuales,
    recomendacionesContextuales,
    // Estado Editorial — veredicto periodístico del editor
    estadoEditorial: editorialDecision.estadoEditorial,
    recomendacionEditorial: editorialDecision.recomendacionEditorial,
    diagnosticoEditorial: editorialDecision.diagnostico,
    mensajeEditor: editorialDecision.mensajeEditor,
    razonamientoEditorial: editorialDecision.razonamiento,
    // Campos planos del EditorialDecision
    editorialDecision: {
      valeLaPenaPublicar: editorialDecision.valeLaPenaPublicar,
      motivoPrincipal: editorialDecision.motivoPrincipal,
      aportaAlLector: editorialDecision.aportaAlLector,
      diferenciaCompetencia: editorialDecision.diferenciaCompetencia,
      utilidadReal: editorialDecision.utilidadReal,
      explicacion: editorialDecision.explicacion,
      contexto: editorialDecision.contexto,
      servicio: editorialDecision.servicio,
      riesgoEditorial: editorialDecision.riesgoEditorial,
      acciones: editorialDecision.acciones,
      puntosPerdidos: editorialDecision.puntosPerdidos,
      patronesAplicados: editorialDecision.patronesAplicados.map(p => ({ campo: p.campo, descripcion: p.descripcion, frecuencia: p.frecuencia })),
      correccionesSugeridas: editorialDecision.correccionesSugeridas,
      ranking: editorialDecision.ranking,
      veredictoEjecutivo: editorialDecision.veredictoEjecutivo,
      ...(editorialDecision.saturacion ? { saturacion: editorialDecision.saturacion } : {}),
      ...(editorialDecision.memoriaEditorial ? { memoriaEditorial: editorialDecision.memoriaEditorial } : {}),
    },
    blockingIssues,
    warnings,
    articulo: {
      titulo: seo.tituloSEO,
      resumen: resumenOptimizado,
      contenido: qualityGate.textoCorregido,
      slug: seo.slug,
    },
    qualityGate,
    intelligence,
    editorialDna,
    editorialTier: tier,
    editorialReason,
    articleHash,
    evaluationTimestamp: now.toISOString(),
    profile_used: contentProfile.profile_detected,
    profile_confidence: contentProfile.profile_confidence,
    matched_keywords: contentProfile.matched_keywords,
    matched_entities: contentProfile.matched_entities,
    contextScore,
  };
}

export function runMeni(input: NoticiaInput, options?: MeniRunOptions): MeniResult {
  let currentInput = input;
  logMeni('=== runMeni (auto-correct wrapper) start ===', input.titulo);
  const now = new Date();
  let result = evaluateMeni(currentInput, options?.activeAdjustments, options?.editorJefe, now);
  let autoCorrections: AutoCorrection[] = [];
  if (!result.aprobado && result.score_status !== 'INVALID') {
    const corrected = autoCorrectNoticia(currentInput, result);
    if (corrected.corrections.length > 0) {
      autoCorrections = corrected.corrections;
      currentInput = corrected.input;
      result = evaluateMeni(currentInput, options?.activeAdjustments, options?.editorJefe, now);
    }
  }
  logMeni('=== runMeni (auto-correct wrapper) end ===', {
    scoreFinal: result.scoreFinal,
    aprobado: result.aprobado,
    autoCorrected: autoCorrections.length > 0,
    correctionsCount: autoCorrections.length,
    minScore: MIN_APPROVED_SCORE,
  });
  return { ...result, autoCorrected: autoCorrections.length > 0, autoCorrections };
}

export async function runMeniAsync(
  input: NoticiaInput,
  options: MeniRunOptions = {}
): Promise<MeniResult> {
  // Cargar ajustes del Learning Engine si hay DB y no se pasaron explícitamente
  let activeAdjustments = options.activeAdjustments;
  if (!activeAdjustments && options.db) {
    try {
      const { loadActiveAdjustments } = await import('@/lib/meni/learning-engine/learning-adapter');
      activeAdjustments = await loadActiveAdjustments(options.db);
      logMeni('Learning Engine adjustments loaded', { source: activeAdjustments.source });
    } catch {
      activeAdjustments = undefined;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Editor Jefe — cargar datos asíncronos desde Firestore
  // ─────────────────────────────────────────────────────────────
  let editorJefe = options.editorJefe;
  if (!editorJefe && options.db) {
    const tasks: Promise<void>[] = [];

    // Fase 1: patrones del editor
    if (!editorJefe) editorJefe = {};
    const patternsTask = import('@/lib/meni/editor-jefe/correction-tracker')
      .then(({ loadEditorPatterns }) => loadEditorPatterns(options.db))
      .then(patterns => { if (patterns.length > 0) editorJefe!.editorPatterns = patterns; })
      .catch(() => {});
    tasks.push(patternsTask);

    // Fase 2: datos de portada para saturación
    const portadaTask = options.db.collection('noticias')
      .where('publicado', '!=', false)
      .orderBy('fecha', 'desc')
      .limit(20)
      .get()
      .then((snap: any) => {
        const portadaData = snap.docs.map((d: any) => ({
          categoria: d.get('categoria') || 'General',
          fecha: d.get('fecha') || new Date().toISOString(),
        }));
        if (portadaData.length > 0) editorJefe!.portadaData = portadaData;
      })
      .catch(() => {});
    tasks.push(portadaTask);

    // Fase 3: query de Knowledge Base
    const kbTask = import('@/lib/meni/knowledge-base')
      .then(({ queryKnowledgeForArticle }) => queryKnowledgeForArticle(
        options.db, input.titulo, input.contenido, input.categoria || 'General',
      ))
      .then(query => { if (query.totalArticles > 0) editorJefe!.knowledgeQuery = query; })
      .catch(() => {});
    tasks.push(kbTask);

    await Promise.all(tasks);
    logMeni('Editor Jefe data loaded', {
      patterns: editorJefe.editorPatterns?.length || 0,
      portada: editorJefe.portadaData?.length || 0,
      knowledge: editorJefe.knowledgeQuery?.totalArticles || 0,
    });
  }

  const base = runMeni(input, { ...options, activeAdjustments, editorJefe });

  if (!options.db) {
    return base;
  }

  let editorBrain = options.editorBrain;
  if (!editorBrain && !options.skipEditorBrain) {
    try {
      editorBrain = await runEditorBrain(options.db, {
        titulo: input.titulo,
        contenido: input.contenido,
        categoria: base.categoria,
      });
    } catch {
      editorBrain = undefined;
    }
  }

  if (options.skipDuplicateCheck) {
    return { ...base, editorBrain };
  }

  const t1 = Date.now();
  logMeni('=== runMeniAsync start ===', input.titulo);

  const duplicado = await detectarDuplicadoAdmin(
    options.db,
    input.contenido,
    input.titulo,
    0.35,
    input.id
  );

  logMeni('Duplicate check', { esDuplicado: duplicado.esDuplicado, similitud: duplicado.similitud, id: input.id });

  const aprobado = base.aprobado && !duplicado.esDuplicado;
  let diagnostico = base.diagnostico;
  let recomendaciones = base.recomendaciones;
  let blockingIssues = base.blockingIssues || [];
  const warnings = base.warnings || [];

  if (duplicado.esDuplicado) {
    diagnostico = `Duplicado detectado (${duplicado.similitud}% de similitud). ${diagnostico}`;
    recomendaciones = [
      {
        area: 'duplicado',
        severidad: 'alta' as const,
        mensaje: `El artículo coincide ${duplicado.similitud}% con una noticia ya publicada. Verifica antes de continuar.`,
      },
      ...recomendaciones,
    ];
    blockingIssues = [...blockingIssues, buildDuplicateBlockingIssue(duplicado.similitud)];
  }

  logMeni('=== runMeniAsync end ===', { aprobado, similitud: duplicado.similitud, blockingIssues: blockingIssues.length, warnings: warnings.length, tMs: Date.now() - t1 });
  logTime('runMeniAsync', t1);

  return {
    ...base,
    aprobado,
    diagnostico,
    recomendaciones,
    blockingIssues,
    warnings,
    duplicado,
    editorBrain,
  };
}

/**
 * Ingerir un artículo publicado en la Editorial Memory (Knowledge Base).
 * Debe llamarse después de guardar/publicar exitosamente.
 */
export async function ingestArticleToMemory(
  db: any,
  article: {
    articleId: string;
    titulo: string;
    contenido: string;
    slug: string;
    categoria: string;
    departamento?: string;
    fecha: string;
    autor?: string;
  }
): Promise<void> {
  await ingestPublishedArticle(db, {
    articleId: article.articleId,
    title: article.titulo,
    content: article.contenido,
    slug: article.slug,
    category: article.categoria,
    departamento: article.departamento,
    date: article.fecha,
    author: article.autor,
  });
}
