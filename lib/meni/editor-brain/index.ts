/**
 * MENI Editor Brain — Orquestador de los 4 cerebros
 * ====================================================
 * Punto único de entrada para:
 * 1. Editorial Memory  — consulta el grafo de conocimiento antes de analizar
 * 2. Editorial Context — construye contexto para el LLM desde la memoria
 * 3. Editorial Learning — obtiene insights del ciclo de aprendizaje
 * 4. Editorial Planner  — analiza equilibrio de portada
 *
 * Reutiliza los módulos existentes (knowledge-base, learning-engine, portada-intel)
 * sin duplicar lógica. Es una capa delgada de integración.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { queryKnowledgeForArticle, ingestArticle } from '@/lib/meni/knowledge-base';
import { getLatestInsights } from '@/lib/meni/learning-engine';
import { analyzePortada } from '@/lib/meni/portada-intel';
import type { Noticia } from '@/lib/types';
import type {
  EditorBrainInput,
  EditorBrainResult,
  EditorialMemoryResult,
  EditorialContextResult,
  EditorialLearningResult,
  EditorialPlannerResult,
  IngestArticleInput,
} from './types';

export type { EditorBrainInput, EditorBrainResult, IngestArticleInput } from './types';

// ─────────────────────────────────────────────────────────────
// 1. Editorial Memory
// ─────────────────────────────────────────────────────────────

export async function queryEditorialMemory(
  db: Firestore,
  input: EditorBrainInput,
): Promise<EditorialMemoryResult> {
  try {
    const kr = await queryKnowledgeForArticle(db, input.titulo, input.contenido, input.categoria);

    return {
      hasMemory: kr.totalArticles > 0,
      totalArticles: kr.totalArticles,
      antecedentes: kr.antecedentes,
      temasFrecuentes: kr.temasFrecuentes,
      institucionesRelevantes: kr.institucionesRelevantes,
      lugaresRelacionados: kr.lugaresRelacionados,
      timeline: kr.timeline.map((t) => ({
        title: t.articleTitle,
        date: t.date,
        category: t.category,
        slug: t.articleSlug,
      })),
      relatedEntities: kr.entities.map((e) => e.entity.name),
    };
  } catch {
    return {
      hasMemory: false,
      totalArticles: 0,
      antecedentes: [],
      temasFrecuentes: [],
      institucionesRelevantes: [],
      lugaresRelacionados: [],
      timeline: [],
      relatedEntities: [],
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 2. Editorial Context
// ─────────────────────────────────────────────────────────────

export function buildEditorialContext(memory: EditorialMemoryResult): EditorialContextResult {
  const contexto: string[] = [];
  const preguntasFrecuentes: string[] = [];

  if (memory.antecedentes.length > 0) {
    contexto.push(`Antecedentes: ${memory.antecedentes.join('. ')}`);
  }
  if (memory.institucionesRelevantes.length > 0) {
    contexto.push(`Instituciones relevantes: ${memory.institucionesRelevantes.join(', ')}`);
  }
  if (memory.lugaresRelacionados.length > 0) {
    contexto.push(`Lugares relacionados: ${memory.lugaresRelacionados.join(', ')}`);
  }
  if (memory.temasFrecuentes.length > 0) {
    contexto.push(`Temas frecuentes: ${memory.temasFrecuentes.join(', ')}`);
  }
  if (memory.timeline.length > 0) {
    const ultimas = memory.timeline.slice(0, 3);
    contexto.push(
      `Últimas noticias relacionadas: ${ultimas.map((t) => `"${t.title}" (${t.date.slice(0, 10)})`).join('; ')}`,
    );
  }

  // Generar preguntas del lector basadas en la memoria
  for (const tema of memory.temasFrecuentes) {
    if (tema.includes('accident')) {
      preguntasFrecuentes.push('¿Cuántos accidentes han ocurrido en esta zona?');
      preguntasFrecuentes.push('¿Cuál es el estado de la vía?');
    }
    if (tema.includes('volc')) {
      preguntasFrecuentes.push('¿Está activo el volcán actualmente?');
      preguntasFrecuentes.push('¿Qué nivel de alerta tiene?');
    }
    if (tema.includes('homicid') || tema.includes('delincu')) {
      preguntasFrecuentes.push('¿Hay personas detenidas?');
      preguntasFrecuentes.push('¿La Policía se ha pronunciado?');
    }
    if (tema.includes('salud')) {
      preguntasFrecuentes.push('¿Cuántos casos confirmados hay?');
      preguntasFrecuentes.push('¿El MINSA ha emitido alerta?');
    }
  }

  // Resumen de memoria editorial: evita que el LLM repita y le indica cómo conectar con el historial
  const recientes = memory.timeline.slice(0, 5);
  const resumenMemoria =
    memory.totalArticles > 0
      ? `MEMORIA EDITORIAL: Ya publicamos ${memory.totalArticles} noticia(s) relacionada(s).${recientes.length > 0 ? ` Últimas: ${recientes.map((t) => `"${t.title}" (${t.date.slice(0, 10)})`).join('; ')}.` : ''} Antecedentes clave: ${memory.antecedentes.slice(0, 5).join('. ')}. REGLA: no repetir lo que ya publicamos. Solo añadir lo nuevo del caso y, si aplica, conectar brevemente con el historial (ej. "Este es el tercer decomiso superior a 100 kilos este año").`
      : '';

  const contextoParaLlm = contexto.length > 0 || resumenMemoria
    ? `CONTEXTO EDITORIAL (usar para enriquecer, no copiar):\n${resumenMemoria}\n${contexto.map((c) => `- ${c}`).join('\n')}`
    : '';

  return {
    contexto,
    preguntasFrecuentes: [...new Set(preguntasFrecuentes)].slice(0, 8),
    contextoParaLlm,
  };
}

// ─────────────────────────────────────────────────────────────
// 3. Editorial Learning
// ─────────────────────────────────────────────────────────────

export async function getEditorialLearning(db: Firestore): Promise<EditorialLearningResult | null> {
  try {
    const insights = await getLatestInsights(db);
    if (!insights) return null;

    return {
      hasInsights: true,
      categoryPerformance: insights.categoryPerformance,
      topPerformers: insights.topPerformers,
      insights: insights.insights,
      avgViewsPerArticle: insights.avgViewsPerArticle,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// 4. Editorial Planner
// ─────────────────────────────────────────────────────────────

export async function runEditorialPlanner(
  db: Firestore,
  portadaArticles: Noticia[],
  allArticles: Noticia[],
): Promise<EditorialPlannerResult | null> {
  try {
    const analysis = await analyzePortada(db, portadaArticles, allArticles);
    return {
      balanceScore: analysis.balance.balanceScore,
      estado: analysis.balance.estado,
      suggestions: analysis.suggestions,
      conflicts: analysis.conflicts,
      editorialSummary: analysis.editorialSummary,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Ingestión — alimentar la memoria tras publicar
// ─────────────────────────────────────────────────────────────

export async function ingestPublishedArticle(
  db: Firestore,
  input: IngestArticleInput,
): Promise<void> {
  try {
    await ingestArticle(db, input);
  } catch (err) {
    console.warn('[editor-brain] Error ingiriendo artículo al knowledge base:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Orquestador completo — ejecuta los 4 cerebros en una llamada
// ─────────────────────────────────────────────────────────────

export async function runEditorBrain(
  db: Firestore,
  input: EditorBrainInput,
): Promise<EditorBrainResult> {
  const memory = await queryEditorialMemory(db, input);
  const context = buildEditorialContext(memory);
  const learning = await getEditorialLearning(db);

  return {
    memory,
    context,
    learning,
    planner: null, // Planner se ejecuta por separado (requiere lista de portada)
  };
}
