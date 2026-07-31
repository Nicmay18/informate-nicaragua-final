/**
 * MENI Quality Gate — Tipos
 * =========================
 * Único punto donde vive la validación editorial estructural.
 * Se ejecuta ANTES del LLM (sobre la fuente) y DESPUÉS del LLM (sobre el
 * artículo redactado), comparando ambos estados para detectar contradicciones,
 * duplicados, sensacionalismo, falta de servicio y bajo valor diferencial.
 */

export interface EntityMap {
  edades: string[];
  fechas: string[];
  horas: string[];
  cantidades: string[];
  nombres: string[];
  instituciones: string[];
  lugares: string[];
}

export type QualityGateStage = 'PRE_LLM' | 'POST_LLM';

export type QualityGateSeverity = 'info' | 'warning' | 'blocking';

export interface QualityGateIssue {
  categoria:
    | 'contradiccion'
    | 'cronologia'
    | 'coherencia'
    | 'terminologia'
    | 'precision'
    | 'lenguaje'
    | 'sensacionalismo'
    | 'servicio'
    | 'valor_diferencial'
    | 'explicacion'
    | 'originalidad';
  severidad: QualityGateSeverity;
  mensaje: string;
  evidencia?: string;
  corregible: boolean;
}

export interface QualityGateCorrection {
  categoria: QualityGateIssue['categoria'];
  descripcion: string;
  antes?: string;
  despues?: string;
}

export interface ExplanationIndex {
  porcentajeTranscripcion: number;
  porcentajeContexto: number;
  porcentajeExplicacion: number;
  porcentajeServicio: number;
}

export interface ParagraphTranscriptionEntry {
  indice: number;
  extracto: string;
  similitud: number;
  veredicto: 'OK' | 'REESCRIBIR';
}

export interface TranscriptionReportResult {
  parrafos: ParagraphTranscriptionEntry[];
  parrafosParaReescribir: number;
  similitudPromedio: number;
  similitudMaxima: number;
}

export interface QualityGateResult {
  stage: QualityGateStage;
  entidades: EntityMap;
  issues: QualityGateIssue[];
  corregidos: QualityGateCorrection[];
  bloqueado: boolean;
  motivosBloqueo: string[];
  explanationIndex: ExplanationIndex;
  originalidadPorcentaje: number;
  ctrEstimadoFacebook: number;
  discoverListo: boolean;
  editorScore: number;
  textoCorregido: string;
  transcriptionReport?: TranscriptionReportResult;
  timestamp: string;
}

export interface QualityGateInput {
  titulo: string;
  contenido: string;
  categoria: string;
  departamento?: string;
  fuenteOriginal?: string;
  entidadesPrevias?: EntityMap;
  titulosPrevios?: string[]; // últimos títulos de la misma categoría (idealmente 30) para detectar estructuras repetidas
  stage: QualityGateStage;
  /** Source of truth from Editorial Brain; when present, Quality Gate will not
   *  recompute originality/service/score and will use these values instead. */
  sourceOfTruth?: {
    score: number;
    originalidad: number;
    servicio: number;
    bloqueado: boolean;
  };
}
