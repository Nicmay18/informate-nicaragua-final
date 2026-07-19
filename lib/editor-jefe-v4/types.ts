/**
 * Editor IA V4 — Tipos compartidos
 * ================================
 * Todas las interfaces del sistema V4.
 * Ningún módulo debe definir tipos propios fuera de este archivo.
 */

import type { NoticiaInput } from '../analizador-noticias';

// ───────────────────────────────────────────────
// REGLA 1: ArticleEvidence — objeto estructurado de una sola pasada
// ───────────────────────────────────────────────

export interface SeoEvidence {
  tituloLength: number;
  resumenLength: number;
  slug: string;
  h2Count: number;
  strongCount: number;
  keywords: string[];
  tituloOptimizado: boolean;
}

export interface EeatEvidence {
  autor: string;
  autorVisible: boolean;
  fuentesDetectadas: string[];
  tieneAtribuciones: boolean;
  tieneAtribucionesFalsas: boolean;
  tieneCitasEstructuradas: boolean;
}

export interface DiscoverEvidence {
  tieneImagen: boolean;
  tituloClickbait: boolean;
  tieneFechaActualizacion: boolean;
  tieneFechaPublicacion: boolean;
}

export interface AdsenseEvidence {
  palabraCount: number;
  tieneDatosConcretos: boolean;
  tieneClickbait: boolean;
  ratioUnicidad: number;
  palabrasSensibles: string[];
}

export interface ValorEditorialEvidence {
  tieneFuentePropia: boolean;
  tieneCitaEspecifica: boolean;
  tieneAtribucionVaga: boolean;
  nombresPropiosCount: number;
  institucionesCount: number;
  parrafosSinDato: number;
  parrafosTotal: number;
  tieneDatosInventados: boolean;
  tieneFuentesAnonimas: boolean;
}

export interface ForenseEvidence {
  nivelRiesgo: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  adjetivosEmocionales: string[];
  transicionesIA: string[];
  tieneRedundancia: boolean;
  estructuraHtml: { h2: number; strong: number; blockquote: number };
  riesgosLegales: string[];
  tiposContaminacion: string[];
}

export interface ContextEvidence {
  tipo: string;
  patronesEncontrados: string[];
  contextoLegal: boolean;
  contextoHistorico: boolean;
  contextoInstitucional: boolean;
}

export interface ChronologyEvidence {
  fechasMencionadas: string[];
  horasMencionadas: string[];
  tieneCronologia: boolean;
}

export interface UtilityEvidence {
  preguntasRespondidas: string[];
  tieneServicio: boolean;
  tieneRecomendaciones: boolean;
  oportunidades: string[];
}

export interface OriginalityEvidence {
  tieneAportePropio: boolean;
  aportePropioItems: string[];
  tieneReporteoPropio: boolean;
  esReformulacion: boolean;
}

export interface EvidenceSignals {
  datosConcretos: { fechas: number; cifras: number; lugares: number; nombres: number };
  densidadVerificable: number;
  esNotaVerificable: boolean;
}

export interface FollowUpEvidence {
  tieneSeguimiento: boolean;
  actualizable: boolean;
  pendienteConfirmacion: boolean;
}

export interface SourceEvidence {
  fuentesIdentificadas: string[];
  numeroFuentes: number;
  dosFuentesIndependientes: boolean;
  documentoOficial: boolean;
  trabajoCampo: boolean;
}

export interface RiskEvidence {
  nivel: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  cierreGenerico: boolean;
  atribucionesFalsas: boolean;
}

export type TipoContenido = 'FLASH' | 'NOTICIA' | 'REPORTAJE' | 'INVESTIGACION';

export interface ArticleEvidence {
  // Datos crudos extraídos en la única pasada
  seo: SeoEvidence;
  eeat: EeatEvidence;
  discover: DiscoverEvidence;
  adsense: AdsenseEvidence;
  valorEditorial: ValorEditorialEvidence;
  forense: ForenseEvidence;

  // Datos estructurados para el Editor Jefe
  context: ContextEvidence;
  chronology: ChronologyEvidence;
  utility: UtilityEvidence;
  originality: OriginalityEvidence;
  evidence: EvidenceSignals;
  followUp: FollowUpEvidence;
  sources: SourceEvidence;
  risk: RiskEvidence;
  category: string;
  tipoContenido: TipoContenido;

  // Metadata
  noticia: NoticiaInput;
  textoPlano: string;
  parrafos: string[];
}

// ───────────────────────────────────────────────
// REGLA 3: EvaluationResult — formato uniforme para todos los módulos
// ───────────────────────────────────────────────

export interface EvaluationResult {
  modulo: string;
  score: number;                        // 0-100
  signals: string[];                    // señales positivas detectadas
  warnings: string[];                   // advertencias
  errors: string[];                     // errores críticos
  evidence: Record<string, unknown>;    // evidencia estructurada
  recommendations: string[];            // recomendaciones
  trace?: DebugTrace;                   // traza opcional de cada cambio de score
}

// ───────────────────────────────────────────────
// REGLA 3: NormalizedResults — resultados normalizados de todos los módulos
// ───────────────────────────────────────────────

export interface NormalizedResults {
  seo: EvaluationResult;
  eeat: EvaluationResult;
  forense: EvaluationResult;
  adsense: EvaluationResult;
  discover: EvaluationResult;
  valorEditorial: EvaluationResult;
  penalizacionesDeduplicadas: PenalizacionDeduplicada[];
}

export interface PenalizacionDeduplicada {
  causa: string;
  modulosAfectados: string[];
  puntosPerdidos: number;
  parrafo: string;
  motivo: string;
  solucion: string;
}

// ───────────────────────────────────────────────
// REGLA 4: ConsistencyCheck — resultado del Consistency Engine
// ───────────────────────────────────────────────

export interface ConsistencyCheck {
  ok: boolean;
  violaciones: ViolacionConsistencia[];
}

export interface ViolacionConsistencia {
  tipo: 'EDITOR_INCONSISTENT' | 'SCORE_CONTRADICTORY' | 'PENALTY_DUPLICATED';
  descripcion: string;
  modulos: string[];
  scoreEsperado: number;
  scoreObtenido: number;
}

// ───────────────────────────────────────────────
// REGLA 5: EditorialProfile — perfil declarativo (sin lógica)
// ───────────────────────────────────────────────

export interface EditorialProfile {
  categoria: string;

  requiredEvidence: Record<string, RegExp>;
  requiredContext: { tipo: string; patrones: RegExp[] };
  requiredUtility: { preguntas: string[] };
  forbiddenQuestions: string[];
  forbiddenRecommendations: string[];

  scoreWeights: {
    evidencia: number;
    fuente: number;
    contexto: number;
    utilidad: number;
    originalidad: number;
  };

  editorialThreshold: {
    no_publicar: number;
    publicar_breve: number;
    publicar_estandar: number;
    publicar_destacado: number;
    portada: number;
    cobertura_especial: number;
  };

  allowedSources: string[];
  sugerenciasBase: {
    oportunidades: string[];
    convertirReferencia: string[];
    nivel10: string[];
  };
}

// ───────────────────────────────────────────────
// REGLA 10: Explainability — explicación detallada de puntos perdidos
// ───────────────────────────────────────────────

export interface ExplainabilityItem {
  regla: string;
  parrafo: string;
  motivo: string;
  solucion: string;
  puntosPerdidos: number;
}

// ───────────────────────────────────────────────
// DebugTrace — trazabilidad de cada regla de puntuación
// ───────────────────────────────────────────────

export interface ScoreTraceEntry {
  id: string;
  tipo: 'start' | 'add' | 'sub' | 'set' | 'floor' | 'ceiling' | 'bonus' | 'weight';
  source: string;                       // archivo/función que emitió la regla
  modulo?: string;                      // módulo afectado (SEO, EEAT, etc.)
  rule: string;                         // identificador corto de la regla
  motivo: string;                       // mensaje legible para el editor
  delta: number;                        // cambio de puntos
  scoreAfter: number;                   // score después de aplicar
}

export interface DebugTrace {
  scoreInicial: number;
  scoreFinal: number;
  entries: ScoreTraceEntry[];
}

// ───────────────────────────────────────────────
// ResultadoEditorial — salida final del EditorJefeEngine
// ───────────────────────────────────────────────

export type VeredictoEditorial =
  | 'no_publicar'
  | 'publicar_breve'
  | 'publicar_estandar'
  | 'publicar_destacado'
  | 'portada'
  | 'cobertura_especial'
  | 'EDITOR_INCONSISTENT';

export interface ScoreBreakdown {
  seo: number;
  eeat: number;
  forense: number;
  adsense: number;
  discover: number;
  valorEditorial: number;
  evidencia: number;
  fuente: number;
  contexto: number;
  utilidad: number;
  originalidad: number;
  final: number;
}

export interface ResultadoEditorial {
  categoria: string;
  perfilUsado: string;
  scores: ScoreBreakdown;
  veredicto: VeredictoEditorial;
  explainability: ExplainabilityItem[];
  sugerencias: string[];
  consistencia: ConsistencyCheck;
  evidence: ArticleEvidence;
  results: NormalizedResults;
  debugTrace: DebugTrace;
}
