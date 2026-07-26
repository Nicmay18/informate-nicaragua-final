/**
 * MENI OS v4.0 — Intelligence Engine Types
 * =========================================
 * Cada motor devuelve decisiones editoriales, no texto.
 * El LLM solo ejecuta; las decisiones vienen del código.
 */

import type { NoticiaInput } from '@/lib/meni/types';

export interface Entity {
  text: string;
  type: 'persona' | 'lugar' | 'institucion' | 'fecha' | 'cifra' | 'sigla' | 'ley' | 'programa';
  needsExplanation: boolean;
  explanation?: string;
}

export interface ContextDecision {
  entities: Entity[];
  personas: string[];
  lugares: string[];
  instituciones: string[];
  fechas: string[];
  antecedentesNecesarios: string[];
  contextoRequerido: string[];
  score: number;
}

export interface ReaderValueDecision {
  queGanaElLector: string[];
  queFaltaExplicar: string[];
  preguntasSinResponder: string[];
  valorDiferencial: string | null;
  bloquear: boolean;
  motivoBloqueo: string | null;
  score: number;
}

export interface OriginalityDecision {
  nivelTranscripcion: number;
  nivelReorganizacion: number;
  nivelAporteContexto: number;
  nivelExplicacion: number;
  score: number;
  veredicto: 'solo_cambia_palabras' | 'reorganiza' | 'aporta_contexto' | 'explica_mejor';
  razon: string;
}

export interface StructureBlock {
  tipo: string;
  contenido: string;
  prioridad: number;
}

export interface StructureDecision {
  bloques: StructureBlock[];
  orden: string[];
  razonOrden: string;
  score: number;
}

export interface ClarityDecision {
  conceptosDificiles: { termino: string; explicacion: string }[];
  siglasDetectadas: { sigla: string; significado: string }[];
  institucionesMencionadas: { nombre: string; descripcion: string }[];
  terminosTecnicos: { termino: string; alternativaSimple: string }[];
  score: number;
}

export interface AngleDecision {
  anguloDiferencial: string;
  porQueMereceExistir: string;
  conexionNicaragua: string;
  score: number;
}

export interface BackgroundDecision {
  antecedentes: { hecho: string; relevancia: string }[];
  lineaDeTiempo: { fecha: string; evento: string }[];
  contextoHistorico: string | null;
  score: number;
}

export interface FacebookDecision {
  copy: string;
  emoji: string;
  hashtags: string[];
  score: number;
}

export interface GoogleDecision {
  tituloSEO: string;
  metaDescripcion: string;
  slug: string;
  keywords: string[];
  schemaType: string;
  score: number;
}

export interface IntelligenceResult {
  context: ContextDecision;
  readerValue: ReaderValueDecision;
  originality: OriginalityDecision;
  structure: StructureDecision;
  clarity: ClarityDecision;
  angle: AngleDecision;
  background: BackgroundDecision;
  facebook: FacebookDecision;
  google: GoogleDecision;
  scoreIntelligence: number;
  bloquear: boolean;
  motivoBloqueo: string | null;
}

export type IntelligenceEngineInput = NoticiaInput & {
  fuente?: string;
  categoriaSugerida?: string;
};
