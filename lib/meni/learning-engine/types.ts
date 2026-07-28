/**
 * Learning Engine — Tipos
 * ========================
 * Define las estructuras de datos para el aprendizaje basado en métricas reales.
 */

/** Métricas crudas de un artículo individual */
export interface ArticleMetrics {
  articleId: string;
  slug: string;
  titulo: string;
  categoria: string;
  departamento: string;
  autor: string;
  vistas: number;
  palabras: number;
  scoreMeni: number;
  aprobadoMeni: boolean;
  fecha: string;
  fechaPublicacion: string;
  tieneImagen: boolean;
  tieneResumen: boolean;
  fuentePrincipal: string;
  distribuida: boolean;
  // Métricas de aprendizaje real
  tiempoLecturaSeg?: number;
  ctrFacebook?: number;
  vistasDiscover?: number;
  tasaRetencion?: number;
  tipoIntroduccion?: string;
  longitudTitulo?: number;
}

/** Métricas agregadas por categoría */
export interface CategoryPerformance {
  categoria: string;
  totalArticulos: number;
  vistasTotales: number;
  vistasPromedio: number;
  mejorArticulo: { titulo: string; vistas: number } | null;
  peorArticulo: { titulo: string; vistas: number } | null;
  scorePromedio: number;
  tasaAprobacion: number;
}

/** Métricas agregadas por fuente de tráfico */
export interface SourcePerformance {
  fuente: string;
  visitas: number;
  articulosUnicos: number;
  visitasPorArticulo: number;
  porcentajeTotal: number;
}

/** Patrón temporal de rendimiento */
export interface TemporalPattern {
  diaSemana: string;
  horaPublicacion: number;
  vistasPromedio: number;
  totalArticulos: number;
}

/** Correlación entre una característica editorial y el rendimiento */
export interface Correlation {
  feature: string;
  description: string;
  correlation: number;
  sampleSize: number;
  recommendation: string;
}

/** Ajuste de peso sugerido por el Learning Engine */
export interface WeightAdjustment {
  component: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
  confidence: number;
}

/** Insight accionable generado por el Learning Engine */
export interface LearningInsight {
  id: string;
  type: 'performance' | 'pattern' | 'correlation' | 'recommendation' | 'alert' | 'positive';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'positive';
  data: Record<string, unknown>;
  generatedAt: string;
}

/** Resultado completo de un ciclo de aprendizaje */
export interface LearningCycleResult {
  runAt: string;
  totalArticlesAnalyzed: number;
  totalViews: number;
  avgViewsPerArticle: number;
  categoryPerformance: CategoryPerformance[];
  sourcePerformance: SourcePerformance[];
  temporalPatterns: TemporalPattern[];
  correlations: Correlation[];
  weightAdjustments: WeightAdjustment[];
  insights: LearningInsight[];
  topPerformers: ArticleMetrics[];
  underperformers: ArticleMetrics[];
}

/** Configuración del Learning Engine */
export interface LearningConfig {
  minArticlesForAnalysis: number;
  minViewsForInsight: number;
  daysToAnalyze: number;
  enableWeightTuning: boolean;
}

export const DEFAULT_LEARNING_CONFIG: LearningConfig = {
  minArticlesForAnalysis: 5,
  minViewsForInsight: 3,
  daysToAnalyze: 90,
  enableWeightTuning: true,
};
