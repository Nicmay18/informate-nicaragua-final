/**
 * MENI v2.0 — Tipos del Motor Editorial Nicaragua Informate
 */

import type { NoticiaInput as EditorialNoticiaInput } from '@/lib/editorial';
import type { IntelligenceResult } from '@/lib/meni/intelligence/types';
import type { ResultadoDuplicado } from '@/lib/analizador-duplicados';
import type { QualityGateResult } from '@/lib/meni/quality-gate';
import type { EditorBrainResult } from '@/lib/meni/editor-brain';
import type { EditorialDnaResult } from '@/lib/meni/editorial-dna/types';
import type { EditorialTier } from '@/lib/meni/editorial-tiers';
import type { EditorialReason } from '@/lib/meni/editorial-reason';

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

export interface MeniBlockingIssue {
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

export interface MeniResult {
  version: '2.0';
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
  aprobado: boolean;
  calificacion: string;
  recomendaciones: MeniRecomendacion[];
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
  blockingIssues?: MeniBlockingIssue[];
  warnings?: MeniBlockingIssue[];
  autoCorrected?: boolean;
  autoCorrections?: { campo: string; antes: string; despues: string; descripcion: string }[];
  editorialDna?: EditorialDnaResult;
  editorialTier?: EditorialTier;
  editorialReason?: EditorialReason;
}

export interface MeniReport {
  evaluaciones: MeniResult[];
  ultimaActualizacion: string;
}
