/**
 * Tipos únicos del motor editorial determinístico.
 * Ningún otro archivo define estos tipos.
 */

export type VeredictoEditorial =
  | 'no_publicar'
  | 'publicar_breve'
  | 'publicar_estandar'
  | 'publicar_destacado'
  | 'portada'
  | 'cobertura_especial';

export type TipoContenido = 'FLASH' | 'NOTICIA' | 'REPORTAJE' | 'INVESTIGACION';

export interface NoticiaInput {
  titulo: string;
  contenido: string;
  resumen: string;
  categoria: string;
  autor: string;
  fecha: string;
  fechaActualizacion?: string;
  imagen?: string;
  imagenDestacada?: string;
  slug: string;
  palabrasClave?: string[];
  keywords?: string;
}

// ───────────────────────────────────────────────
// EVIDENCIA — calculada una sola vez por Extractor
// ───────────────────────────────────────────────

export interface SeoEvidence {
  tituloLength: number;
  resumenLength: number;
  slug?: string;
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

export interface ArticleEvidence {
  seo: SeoEvidence;
  eeat: EeatEvidence;
  discover: DiscoverEvidence;
  adsense: AdsenseEvidence;
  valorEditorial: ValorEditorialEvidence;
  forense: ForenseEvidence;
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
  noticia: NoticiaInput;
  textoPlano: string;
  parrafos: string[];
}

// ───────────────────────────────────────────────
// TRAZABILIDAD
// ───────────────────────────────────────────────

export interface ScoreTraceEntry {
  modulo: string;
  regla: string;
  motivo: string;
  delta: number;
  before: number;
  after: number;
}

export interface ScoreTrace {
  modulo: string;
  start: number;
  end: number;
  entries: ScoreTraceEntry[];
}

// ───────────────────────────────────────────────
// SCORES POR MÓDULO
// ───────────────────────────────────────────────

export interface ModuleScore {
  modulo: string;
  score: number;
  trace: ScoreTrace;
  signals: string[];
  warnings: string[];
  errors: string[];
  evidence: Record<string, unknown>;
  recommendations: string[];
}

export interface CalidadModules {
  seo: ModuleScore;
  eeat: ModuleScore;
  discover: ModuleScore;
  adsense: ModuleScore;
  valorEditorial: ModuleScore;
}

export interface RiesgoModules {
  forense: ModuleScore;
}

// ───────────────────────────────────────────────
// SALIDA ÚNICA
// ───────────────────────────────────────────────

export interface ExplainabilityItem {
  modulo: string;
  regla: string;
  parrafo: string;
  motivo: string;
  solucion: string;
  puntosPerdidos: number;
}

export interface AdsenseResult {
  seguro: boolean;
  palabrasSensibles: string[];
  motivo?: string;
}

export interface EvaluacionEditorial {
  evidence: ArticleEvidence;
  seo: ModuleScore;
  eeat: ModuleScore;
  discover: ModuleScore;
  adsense: ModuleScore;
  valorEditorial: ModuleScore;
  forense: ModuleScore;
  calidad: {
    score: number;
    detalle: { modulo: string; score: number; peso: number }[];
  };
  riesgo: {
    score: number;
    seguro: boolean;
    advertencias: string[];
  };
  scoreFinal: number;
  veredicto: VeredictoEditorial;
  explainability: ExplainabilityItem[];
  sugerencias: string[];
}

// Alias para compatibilidad interna mientras migran consumidores
export type ResultadoEditorial = EvaluacionEditorial;

// ───────────────────────────────────────────────
// PERFIL EDITORIAL DECLARATIVO
// ───────────────────────────────────────────────

export interface EditorialProfile {
  categoria: string;
  requiredEvidence: Record<string, RegExp>;
  requiredContext: { tipo: string; patrones: RegExp[] };
  requiredUtility: { preguntas: string[] };
  forbiddenQuestions: string[];
  forbiddenRecommendations: string[];
  scoreWeights: { seo: number; eeat: number; discover: number; adsense: number; valorEditorial: number };
  gates: { eeatMinimo: number; adsenseSeguro: boolean };
  editorialThreshold: Record<VeredictoEditorial, number>;
  allowedSources: string[];
  sugerenciasBase: {
    oportunidades: string[];
    convertirReferencia: string[];
    nivel10: string[];
  };
}

// ───────────────────────────────────────────────
// SALIDA LEGACY (solo para mapper V3)
// ───────────────────────────────────────────────

export interface CheckItem {
  nombre: string;
  estado: 'PASS' | 'WARN' | 'FAIL';
  mensaje: string;
}

export interface FiltroResultado {
  aprobado: boolean;
  puntuacion: number;
  checks: CheckItem[];
}

export type NivelAnalisis = 'FORENSE' | 'ORO' | 'PLATA' | 'BRONCE' | 'RECHAZADO';

export interface ResultadoAnalisis {
  aprobado: boolean;
  nivel: NivelAnalisis;
  puntuacion: number;
  filtros: {
    oro: FiltroResultado;
    adsense: FiltroResultado;
    discover: FiltroResultado;
    news: FiltroResultado;
    seo: FiltroResultado;
    eeat: FiltroResultado;
    valorEditorial: FiltroResultado;
  };
  accionesRequeridas: string[];
  metadataSugerida?: {
    keywordsLSI?: string[];
    tituloOptimizado?: string;
    metaDescription?: string;
  };
}
