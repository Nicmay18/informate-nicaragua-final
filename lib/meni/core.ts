import { pipelineV4 } from '@/lib/editorial';
import type { EvaluacionEditorial, NoticiaInput as EditorialNoticiaInput } from '@/lib/editorial';
import { generarMetaDescription } from '@/lib/editorial/meta';
import type { NoticiaInput, MeniResult } from './types';
import { analyzeForensic } from './forensic';
import { analyzeRisk } from './risk';
import { analyzeEEAT } from './eeat';
import { analyzeSEO } from './seo';
import { analyzeDiscover } from './discover';
import { analyzeAdSense } from './adsense';
import {
  computePriority,
  scoreToGrade,
  approved,
  normalizeCategory,
  MIN_APPROVED_SCORE,
} from './scoring';
import { autoCorrectNoticia, type AutoCorrection } from './autocorrect';
import { audit, buildRecomendaciones } from './auditor';
import { buildValorEditorial, buildDiagnostico } from './editor-chief';
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
import { buildEditorialReason } from '@/lib/meni/editorial-reason';
import type { ActiveAdjustments } from '@/lib/meni/learning-engine/learning-adapter';

export interface MeniRunOptions {
  db?: any; // Admin Firestore instance
  skipDuplicateCheck?: boolean;
  skipEditorBrain?: boolean;
  editorBrain?: EditorBrainResult;
  activeAdjustments?: ActiveAdjustments;
}

function evaluateMeni(input: NoticiaInput, activeAdjustments?: ActiveAdjustments): MeniResult {
  const t0 = Date.now();
  logMeni('=== runMeni start ===', input.titulo);

  // Detectar tier editorial (FLASH, NOTICIA, REPORTAJE, INVESTIGACION)
  const tier: EditorialTier = detectTier({
    titulo: input.titulo,
    contenido: input.contenido,
    categoria: input.categoria,
  });
  let thresholds = { ...TIER_THRESHOLDS[tier] };

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

  const evaluacion: EvaluacionEditorial = pipelineV4(input as EditorialNoticiaInput);
  const rawCategory = evaluacion.evidence.category || input.categoria || 'general';
  const categoria = normalizeCategory(rawCategory);
  const modulo = getModule(rawCategory);

  const seo = analyzeSEO(evaluacion, input);
  const forense = analyzeForensic(evaluacion);
  const riesgo = analyzeRisk(evaluacion);
  const eeat = analyzeEEAT(evaluacion);
  const discover = analyzeDiscover(evaluacion);
  const adsense = analyzeAdSense(evaluacion);
  const valorEditorial = buildValorEditorial(evaluacion);
  const auditoria = audit(evaluacion);
  const recomendaciones = [
    ...buildRecomendaciones(evaluacion),
    ...modulo.recomendaciones(evaluacion),
  ];

  const scoreFinal = Math.round(evaluacion.scoreFinal);
  const minScore = activeAdjustments?.minApprovedScore ?? MIN_APPROVED_SCORE;
  const aprobado = approved(evaluacion.veredicto, scoreFinal) && scoreFinal >= minScore;
  const calificacion = scoreToGrade(scoreFinal);
  const prioridad = computePriority(evaluacion.veredicto);
  const diagnostico = buildDiagnostico(evaluacion);

  const textoPlano = evaluacion.evidence.textoPlano ?? (input.contenido || '');
  const resumenOptimizado = generarMetaDescription(textoPlano, input.resumen);

  const intelligence = runIntelligenceEngine({
    ...input,
    fuente: input.contenido,
  });

  // Editorial Brain + ADN NI: evalúa exclusividad, WOW y sello Nicaragua Informate
  const editorialDecision = runEditorialBrain({
    ...input,
    fuente: input.contenido,
    categoriaSugerida: input.categoria,
    tierThresholds: thresholds,
  });
  const editorialDna = editorialDecision.editorialDna;

  // Quality Gate — corre siempre dentro de runMeni (único punto de entrada).
  // No se ejecuta un "Analizador" separado: esta es la revisión final MENI.
  const qualityGate = runQualityGate({
    titulo: input.titulo,
    contenido: input.contenido,
    categoria,
    stage: 'POST_LLM',
  });

  // ─────────────────────────────────────────────────────────────
  // Aprobación graduada por tier editorial
  // Un FLASH no necesita cumplir los mismos requisitos que un REPORTAJE.
  // ─────────────────────────────────────────────────────────────
  const palabrasTexto = textoPlano.split(/\s+/).filter(Boolean).length;

  // Quality Gate: solo bloquear por service value si el tier lo exige
  const tierBlockingIssues = qualityGate.issues.filter((i) => {
    if (i.severidad !== 'blocking') return true; // warnings e info siempre pasan
    // Service value solo bloquea si el tier lo exige
    if (i.categoria === 'servicio' && !thresholds.exigeServiceValue) return false;
    // Differential value solo bloquea si el tier lo exige
    if (i.categoria === 'valor_diferencial' && !thresholds.exigeDifferentialValue) return false;
    return true;
  });

  const tierQualityGateBloqueado = tierBlockingIssues.some((i) => i.severidad === 'blocking')
    || qualityGate.motivosBloqueo.length > 0 && tierBlockingIssues.some((i) => i.severidad === 'blocking');

  // ADN NI: usar umbrales del tier en lugar de umbrales fijos
  const adnBloquear =
    (editorialDna.exclusividad.score < thresholds.minExclusividad && thresholds.exigeDifferentialValue) ||
    (editorialDna.wow.score < thresholds.minWow && thresholds.exigeContexto) ||
    editorialDna.adnNI < thresholds.minAdnNI;

  const adnTranscripcionBloquear =
    (qualityGate.explanationIndex?.porcentajeTranscripcion ?? 0) > thresholds.maxTranscripcion;

  const aprobadoFinal = aprobado
    && !tierQualityGateBloqueado
    && !adnBloquear
    && !adnTranscripcionBloquear
    && qualityGate.editorScore >= thresholds.minQualityGateScore;

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

  const recomendacionesFinal = !aprobadoFinal
    ? [
        ...editorialReason.bloqueadores.map((m) => ({
          area: 'editorial-tier' as const,
          severidad: 'alta' as const,
          mensaje: m,
        })),
        ...editorialReason.puntosMejora.map((m) => ({
          area: 'editorial-tier' as const,
          severidad: 'media' as const,
          mensaje: m,
        })),
        ...recomendaciones,
      ]
    : recomendaciones;

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
    estado: 'Activo',
    categoria,
    modulo: modulo.nombre,
    prioridad,
    riesgo,
    seo,
    eeat,
    discover,
    adsense,
    forense,
    valorEditorial,
    auditoria,
    diagnostico,
    scoreFinal,
    aprobado: aprobadoFinal,
    calificacion,
    recomendaciones: recomendacionesFinal,
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
  };
}

export function runMeni(input: NoticiaInput, options?: MeniRunOptions): MeniResult {
  let currentInput = input;
  logMeni('=== runMeni (auto-correct wrapper) start ===', input.titulo);
  let result = evaluateMeni(currentInput, options?.activeAdjustments);
  let autoCorrections: AutoCorrection[] = [];
  if (!result.aprobado) {
    const corrected = autoCorrectNoticia(currentInput, result);
    if (corrected.corrections.length > 0) {
      autoCorrections = corrected.corrections;
      currentInput = corrected.input;
      result = evaluateMeni(currentInput, options?.activeAdjustments);
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

  const base = runMeni(input, { ...options, activeAdjustments });

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
