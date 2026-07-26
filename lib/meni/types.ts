/**
 * MENI v2.0 — Tipos del Motor Editorial Nicaragua Informate
 */

import type { NoticiaInput as EditorialNoticiaInput } from '@/lib/editorial';
import type { IntelligenceResult } from '@/lib/meni/intelligence/types';

export type NoticiaInput = EditorialNoticiaInput & { departamento?: string };

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
  intelligence?: IntelligenceResult;
}

export interface MeniReport {
  evaluaciones: MeniResult[];
  ultimaActualizacion: string;
}
