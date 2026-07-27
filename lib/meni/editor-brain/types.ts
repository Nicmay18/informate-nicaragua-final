import type { LearningCycleResult } from '@/lib/meni/learning-engine/types';
import type { PortadaAnalysis } from '@/lib/meni/portada-intel/types';

export interface EditorialMemoryResult {
  hasMemory: boolean;
  totalArticles: number;
  antecedentes: string[];
  temasFrecuentes: string[];
  institucionesRelevantes: string[];
  lugaresRelacionados: string[];
  timeline: Array<{ title: string; date: string; category: string; slug: string }>;
  relatedEntities: string[];
}

export interface EditorialContextResult {
  contexto: string[];
  preguntasFrecuentes: string[];
  contextoParaLlm: string;
}

export interface EditorialLearningResult {
  hasInsights: boolean;
  categoryPerformance: LearningCycleResult['categoryPerformance'];
  topPerformers: LearningCycleResult['topPerformers'];
  insights: LearningCycleResult['insights'];
  avgViewsPerArticle: number;
}

export interface EditorialPlannerResult {
  balanceScore: number;
  estado: 'EQUILIBRADO' | 'DESEQUILIBRADO' | 'CRITICO';
  suggestions: PortadaAnalysis['suggestions'];
  conflicts: PortadaAnalysis['conflicts'];
  editorialSummary: string;
}

export interface EditorBrainResult {
  memory: EditorialMemoryResult;
  context: EditorialContextResult;
  learning: EditorialLearningResult | null;
  planner: EditorialPlannerResult | null;
}

export interface EditorBrainInput {
  titulo: string;
  contenido: string;
  categoria: string;
}

export interface IngestArticleInput {
  articleId: string;
  title: string;
  content: string;
  slug: string;
  category: string;
  departamento?: string;
  date: string;
  author?: string;
}
