/**
 * Tipos del Motor Editorial Nicaragua Informate
 */

import type { NoticiaInput as EditorialNoticiaInput } from '@/lib/editorial';
import type { IntelligenceResult } from '@/lib/meni/intelligence/types';
import type { ResultadoDuplicado } from '@/lib/analizador-duplicados';
import type { QualityGateResult } from '@/lib/meni/quality-gate';
import type { EditorBrainResult } from '@/lib/meni/editor-brain';
import type { EditorialDnaResult } from '@/lib/meni/editorial-dna/types';
import type { EditorialTier } from '@/lib/meni/editorial-tiers';
import type { EditorialReason } from '@/lib/meni/editorial-reason';
import type { EstadoEditorial, RecomendacionEditorial, DiagnosticoEditorial as DiagnosticoEditorialNI } from '@/lib/meni/editorial-brain/types';
import type { ContextScore } from '@/lib/meni/contextualiza';
import type { MeniContentProfile } from '@/lib/meni/profile-detector';

export type NoticiaInput = EditorialNoticiaInput & { id?: string; departamento?: string };

export type MeniCategoria =
  | 'Sucesos'
  | 'Nacionales'
  | 'Internacionales'
  | 'Deportes'
  | 'Tecnología'
  | 'Economía'
  | 'Cultura'
  | 'Espectáculos'
  | 'Política'
  | 'Salud'
  | 'Educación'
  | 'General';

export type MeniPrioridad = 'PORTADA' | 'ALTA' | 'MEDIA' | 'BAJA';

export type MeniRiesgo = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface MeniSEO {
  score: number;
  tituloSEO: string;
  tituloDiscover: string;
  metaDescripcion: string;
  slug: string;
  keywords: string[];
}

export interface MeniEEAT {
  score: number;
  autor: string;
  citasEstructuradas: boolean;
  fuentesDetectadas: string[];
  advertencias: string[];
}

export interface MeniDiscover {
  score: number;
  imagenDestacada: boolean;
  clickbait: boolean;
  fechaActualizada: boolean;
}

export interface MeniAdSense {
  score: number;
  seguro: boolean;
  advertencias: string[];
}

export interface MeniForense {
  score: number;
  nivel: MeniRiesgo;
  adjetivosEmocionales: string[];
  riesgosLegales: string[];
}

export interface MeniRiesgoEditorial {
  nivel: MeniRiesgo;
  motivo: string;
  advertencias: string[];
}

export interface MeniValorEditorial {
  aportePropio: boolean;
  items: string[];
  utilidad: string[];
  preguntasAbiertas: string[];
}

export interface MeniAuditoria {
  originalidad: number;
  redaccion: number;
  utilidad: number;
  experienciaLector: number;
}

export interface MeniRecomendacion {
  area: string;
  severidad: 'baja' | 'media' | 'alta';
  mensaje: string;
}

export interface RevisionEditorJefe {
  code: string;
  module: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'BLOCKER';
  title: string;
  description: string;
  currentValue: number | string;
  expectedValue: number | string;
  howToFix: string;
  field: 'titulo' | 'resumen' | 'contenido' | 'keywords' | 'autor' | 'categoria' | 'imagen' | 'general';
  evidence?: string;
}

// Backward compat alias
export type MeniBlockingIssue = RevisionEditorJefe;

export interface MeniResult {
  version: '2.0';
  meniVersion: string;
  estado: 'Activo';
  categoria: MeniCategoria;
  modulo: string;
  prioridad: MeniPrioridad;
  riesgo: MeniRiesgoEditorial;
  seo: MeniSEO;
  eeat: MeniEEAT;
  discover: MeniDiscover;
  adsense: MeniAdSense;
  forense: MeniForense;
  valorEditorial: MeniValorEditorial;
  auditoria: MeniAuditoria;
  diagnostico: string;
  scoreFinal: number;
  finalEditorialScore: number;
  estadoFinal: 'APROBADO' | 'MEJORAR' | 'NO_PUBLICAR';
  aprobado: boolean;
  calificacion: string;
  puntosPerdidos?: { concepto: string; puntos: number }[];
  recomendaciones: MeniRecomendacion[];
  recomendacionesContextuales?: MeniRecomendacion[];
  articleHash: string;
  evaluationTimestamp: string;
  profile_used?: MeniContentProfile;
  profile_confidence?: number;
  matched_keywords?: string[];
  matched_entities?: string[];
  contextScore?: ContextScore;
  // Estado Editorial — veredicto periodístico
  estadoEditorial?: EstadoEditorial;
  recomendacionEditorial?: RecomendacionEditorial;
  diagnosticoEditorial?: DiagnosticoEditorialNI;
  mensajeEditor?: string;
  razonamientoEditorial?: { punto: string; positivo: boolean }[];
  articulo?: {
    titulo: string;
    resumen: string;
    contenido?: string;
    slug: string;
  };
  duplicado?: ResultadoDuplicado;
  qualityGate?: QualityGateResult;
  intelligence?: IntelligenceResult;
  editorBrain?: EditorBrainResult;
  blockingIssues?: RevisionEditorJefe[];
  warnings?: RevisionEditorJefe[];
  autoCorrected?: boolean;
  autoCorrections?: { campo: string; antes: string; despues: string; descripcion: string }[];
  editorialDna?: EditorialDnaResult;
  editorialTier?: EditorialTier;
  editorialReason?: EditorialReason;
  editorialDecision?: EditorialDecisionFlat;
}

export interface EditorialDecisionFlat {
  valeLaPenaPublicar: boolean;
  motivoPrincipal: string;
  aportaAlLector: string;
  diferenciaCompetencia: string;
  utilidadReal: string;
  explicacion: string;
  contexto: string;
  servicio: string;
  riesgoEditorial: 'BAJO' | 'MEDIO' | 'ALTO';
  acciones: string[];
  puntosPerdidos?: { concepto: string; puntos: number }[];
  // Editor Jefe
  patronesAplicados: { campo: string; descripcion: string; frecuencia: number }[];
  correccionesSugeridas: string[];
  ranking: {
    estrellas: number;
    etiqueta: string;
    valorPortada: string;
    valorDiscover: string;
    valorFacebook: string;
    valorServicio: string;
    razon: string;
  };
  saturacion?: {
    distribucion: { categoria: string; cantidad: number; porcentaje: number }[];
    categoriasSaturadas: string[];
    categoriasFaltantes: string[];
    recomendacion: string;
    nivelSaturacion: string;
    horasSinNoticiaPositiva?: number;
  };
  memoriaEditorial?: {
    antecedentes: string[];
    cronologia: { fecha: string; titulo: string; categoria: string; slug: string }[];
    entidadesRelacionadas: string[];
    tendencia: string | null;
    contextoNarrativo: string;
    totalRelacionadas: number;
  };
  // MENI Editor Jefe Ejecutivo — la única salida visible
  veredictoEjecutivo?: {
    publicar: string;
    confianza: number;
    respuestaEjecutiva: string;
    readerLearning: string;
    editorialContribution: string;
    worthReading: string;
    loQueOtrosNoContaran: string[];
    wowIdea: string;
    evaluacionCategoria?: {
      categoria: string;
      contexto: number;
      explicacion: number;
      servicio: number;
      faltantes: string[];
      cumplidos: string[];
    };
    fuentesFaltan: string[];
    journalistChecklist: string[];
    valorParaLector: string;
    valorFrenteCompetencia: string;
    riesgoEditorial: string;
    queFalta: string[];
    puntosPerdidos?: { concepto: string; puntos: number }[];
    recomendacionPortada: string;
    probabilidadFacebook: string;
    probabilidadDiscover: string;
    antecedentesUsados: string[];
    patronesAplicados: string[];
    correccionesEditor: string[];
  };
}

export interface MeniReport {
  evaluaciones: MeniResult[];
  ultimaActualizacion: string;
}
