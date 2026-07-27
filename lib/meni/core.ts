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
import { computePriority, scoreToGrade, approved, normalizeCategory } from './scoring';
import { audit, buildRecomendaciones } from './auditor';
import { buildValorEditorial, buildDiagnostico } from './editor-chief';
import { getModule } from './modules';
import { runIntelligenceEngine } from './intelligence';
import { detectarDuplicadoAdmin } from '@/lib/analizador-duplicados';
import { runQualityGate } from '@/lib/meni/quality-gate';
import { runEditorBrain, ingestPublishedArticle, type EditorBrainResult } from '@/lib/meni/editor-brain';

export interface MeniRunOptions {
  db?: any; // Admin Firestore instance
  skipDuplicateCheck?: boolean;
  skipEditorBrain?: boolean;
  editorBrain?: EditorBrainResult;
}

export function runMeni(input: NoticiaInput): MeniResult {
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
  const aprobado = approved(evaluacion.veredicto, scoreFinal);
  const calificacion = scoreToGrade(scoreFinal);
  const prioridad = computePriority(evaluacion.veredicto);
  const diagnostico = buildDiagnostico(evaluacion);

  const textoPlano = evaluacion.evidence.textoPlano ?? (input.contenido || '');
  const resumenOptimizado = generarMetaDescription(textoPlano, input.resumen);

  const intelligence = runIntelligenceEngine({
    ...input,
    fuente: input.contenido,
  });

  // Quality Gate — corre siempre dentro de runMeni (único punto de entrada).
  // No se ejecuta un "Analizador" separado: esta es la revisión final MENI.
  const qualityGate = runQualityGate({
    titulo: input.titulo,
    contenido: input.contenido,
    categoria,
    stage: 'POST_LLM',
  });

  const aprobadoFinal = aprobado && !qualityGate.bloqueado;
  const recomendacionesFinal = qualityGate.bloqueado
    ? [
        ...qualityGate.motivosBloqueo.map((m) => ({
          area: 'quality-gate',
          severidad: 'alta' as const,
          mensaje: m,
        })),
        ...recomendaciones,
      ]
    : recomendaciones;

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
    articulo: {
      titulo: seo.tituloSEO,
      resumen: resumenOptimizado,
      contenido: qualityGate.textoCorregido,
      slug: seo.slug,
    },
    qualityGate,
    intelligence,
  };
}

export async function runMeniAsync(
  input: NoticiaInput,
  options: MeniRunOptions = {}
): Promise<MeniResult> {
  const base = runMeni(input);

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

  const duplicado = await detectarDuplicadoAdmin(
    options.db,
    input.contenido,
    input.titulo,
    0.35,
    input.id
  );

  const aprobado = base.aprobado && !duplicado.esDuplicado;
  let diagnostico = base.diagnostico;
  let recomendaciones = base.recomendaciones;

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
  }

  return {
    ...base,
    aprobado,
    diagnostico,
    recomendaciones,
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
