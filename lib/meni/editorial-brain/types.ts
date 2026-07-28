/**
 * Editorial Brain — Tipos
 * =====================================
 * Un editor, no un policía.
 * No bloquea: guía. No aprueba: recomienda.
 * El LLM solo ejecuta lo que el Editorial Brain decide.
 */

import type { NoticiaInput } from '@/lib/meni/types';
import type { IntelligenceResult } from '@/lib/meni/intelligence/types';
import type { EditorialDnaResult } from '@/lib/meni/editorial-dna/types';
import type { TierThresholds } from '@/lib/meni/editorial-tiers';
import type { StoryPlan } from '@/lib/meni/story-planner/types';
import type { AntiClickbaitResult } from '@/lib/meni/anti-clickbait/types';
import type { ReaderJourneyResult } from '@/lib/meni/reader-journey/types';

/** Contexto de conocimiento histórico (desde editor-brain async) */
export interface KnowledgeContext {
  hasMemory: boolean;
  totalArticles: number;
  antecedentes: string[];
  temasFrecuentes: string[];
  institucionesRelevantes: string[];
  lugaresRelacionados: string[];
  timeline: Array<{ title: string; date: string; category: string; slug: string }>;
  relatedEntities: string[];
  contextoParaLlm: string;
  preguntasFrecuentes: string[];
}

export type EditorialBrainInput = NoticiaInput & {
  fuente?: string;
  categoriaSugerida?: string;
  tierThresholds?: TierThresholds;
  knowledgeContext?: KnowledgeContext;
};

// ═══════════════════════════════════════════════════════════
// 1. News Value Engine
// ═══════════════════════════════════════════════════════════

export interface NewsValueDecision {
  interesPublico: number;
  cercania: number;
  actualidad: number;
  impacto: number;
  servicio: number;
  rareza: number;
  utilidad: number;
  score: number;
  veredicto: 'alta' | 'media' | 'baja';
  razon: string;
}

// ═══════════════════════════════════════════════════════════
// 2. Competition Engine
// ═══════════════════════════════════════════════════════════

export interface CompetitionDecision {
  enfoqueTN8: string;
  enfoqueCanal4: string;
  enfoqueLaPrensa: string;
  enfoqueNicaraguaInformate: string;
  diferencia: string;
  score: number;
}

// ═══════════════════════════════════════════════════════════
// 3. Nicaragua Informate Engine
// ═══════════════════════════════════════════════════════════

export interface NicaraguaInformateDecision {
  porQueLeerAqui: string;
  queAportaDiferente: string;
  selloEditorial: string;
  bloquear: boolean;
  motivoBloqueo: string | null;
  score: number;
}

// ═══════════════════════════════════════════════════════════
// 4. Reader Questions Engine
// ═══════════════════════════════════════════════════════════

export interface ReaderQuestion {
  pregunta: string;
  obligatoria: boolean;
  respondida: boolean;
}

export interface ReaderQuestionsDecision {
  preguntas: ReaderQuestion[];
  preguntasObligatorias: string[];
  preguntasOpcionales: string[];
  score: number;
}

// ═══════════════════════════════════════════════════════════
// 5. Explanation Engine 2.0
// ═══════════════════════════════════════════════════════════

export interface ExplanationItem {
  pregunta: string;
  respuesta: string;
  tipo: 'causa' | 'significado' | 'consecuencia' | 'impacto';
}

export interface ExplanationDecision {
  explicaciones: ExplanationItem[];
  porQueOcurrio: string;
  queSignifica: string;
  queCambia: string;
  comoAfecta: string;
  score: number;
}

// ═══════════════════════════════════════════════════════════
// 6. Editorial Difference Engine
// ═══════════════════════════════════════════════════════════

export interface EditorialDifferenceDecision {
  enfoqueCompetencia: string;
  enfoqueNI: string;
  porcentajeDiferencia: number;
  elementosDiferenciales: string[];
  bloquear: boolean;
  motivoBloqueo: string | null;
  score: number;
}

// ═══════════════════════════════════════════════════════════
// 7. Public Value Engine
// ═══════════════════════════════════════════════════════════

export interface PublicValueDecision {
  ayudaAlLector: boolean;
  soloInforma: boolean;
  queAporta: string;
  score: number;
}

// ═══════════════════════════════════════════════════════════
// 8. Reader Retention Engine
// ═══════════════════════════════════════════════════════════

export interface RetentionRisk {
  parrafo: number;
  razon: string;
  solucion: string;
}

export interface ReaderRetentionDecision {
  riesgos: RetentionRisk[];
  reestructurar: boolean;
  estrategia: string;
  score: number;
}

// ═══════════════════════════════════════════════════════════
// 9. Story Completeness Engine
// ═══════════════════════════════════════════════════════════

export interface StoryCompletenessDecision {
  cerrada: boolean;
  respuestasFaltantes: string[];
  contextoFaltante: string[];
  dudasPendientes: string[];
  score: number;
}

// ═══════════════════════════════════════════════════════════
// 10. Utility Gate — ¿El lector termina sabiendo algo nuevo?
// ═══════════════════════════════════════════════════════════

export interface UtilityGateResult {
  aportaNuevo: boolean;
  queAprendeElLector: string[];
  recomendacionesEditoriales: string[];
  score: number;
  // Backward compat (computed from recomendacionesEditoriales)
  bloquear: boolean;
  motivoBloqueo: string | null;
}

// ═══════════════════════════════════════════════════════════
// 11. Diagnóstico Editorial Nicaragua Informate — unificado
// ═══════════════════════════════════════════════════════════

export interface DiagnosticoEditorial {
  // 5 preguntas obligatorias del Diagnóstico Editorial NI
  valeLaPenaPublicar: { respuesta: boolean; razon: string };
  queAprenderaQueNoEnOtroMedio: { respuesta: string; razon: string };
  queAportaNicaraguaInformate: { respuesta: string; razon: string };
  queLeFaltaParaReferencia: string[];
  publicarEnPortada: { respuesta: boolean; razon: string };
  // Síntesis narrativa del editor
  mensajeEditor: string;
  razonamiento: { punto: string; positivo: boolean }[];
  // Campos de apoyo (backward compat)
  razonValorPeriodistico: string;
  queAportaAlLector: string;
  queAportaFrenteTN8: string;
  queAportaFrenteLaPrensa: string;
  queAportaFrenteCanal4: string;
  queAportaFrenteInternacionales: string;
  queAprenderaElLector: string[];
  explicacionFalta: string[];
  contextoFalta: string[];
  servicioFalta: string[];
  pareceBoletin: boolean;
  parrafosTranscritos: string[];
  partesConAdnNI: string[];
  prioridad: 'valor_lector' | 'diferenciacion' | 'explicacion' | 'contexto' | 'servicio' | 'originalidad' | 'calidad_tecnica';
}

// ═══════════════════════════════════════════════════════════
// 12. Verificación post-LLM — ¿Se cumplieron las decisiones editoriales?
// ═══════════════════════════════════════════════════════════

export interface EditorialVerificationItem {
  requisito: string;
  tipo: 'explicacion' | 'contexto' | 'servicio' | 'pregunta' | 'diferenciacion';
  cumplido: boolean;
  evidencia: string | null;
}

export interface EditorialVerification {
  items: EditorialVerificationItem[];
  totalRequisitos: number;
  cumplidos: number;
  incumplidos: number;
  pasa: boolean;
  detalles: string;
}

// ═══════════════════════════════════════════════════════════
// LLM Instructions — lo que el LLM recibe
// ═══════════════════════════════════════════════════════════

export interface LlmInstructions {
  angulo: string;
  estructura: string[];
  contextoNecesario: string[];
  explicacionesObligatorias: string[];
  preguntasAResponder: string[];
  enfoqueDiferencial: string;
  selloEditorial: string;
  tituloSEO: string;
  metaDescripcion: string;
  slug: string;
  keywords: string[];
  copyFacebook: string;
  pieFoto: string;
  // MENI v7: directivas del Story Planner
  storyPlan: StoryPlan;
  // MENI v7: viaje del lector
  readerJourney: ReaderJourneyResult;
  // MENI v7: frases prohibidas del Story Planner
  frasesProhibidas: string[];
  // MENI v7: qué no hacer
  queNoHacer: string[];
  // MENI v7: objetivo pedagógico
  objetivoPedagogico: string;
}

// ═══════════════════════════════════════════════════════════
// EditorialDecision — el objeto final
// ═══════════════════════════════════════════════════════════

export type RecomendacionEditorial = 'publicar' | 'mejorar' | 'revisar';

export type EstadoEditorial =
  | 'excelente'
  | 'muy_buena'
  | 'necesita_explicacion'
  | 'demasiado_parecida'
  | 'no_aporta';

export interface EditorialDecision {
  newsValue: NewsValueDecision;
  competition: CompetitionDecision;
  nicaraguaInformate: NicaraguaInformateDecision;
  readerQuestions: ReaderQuestionsDecision;
  explanation: ExplanationDecision;
  editorialDifference: EditorialDifferenceDecision;
  publicValue: PublicValueDecision;
  readerRetention: ReaderRetentionDecision;
  storyCompleteness: StoryCompletenessDecision;
  intelligence: IntelligenceResult;
  storyPlan: StoryPlan;
  antiClickbait: AntiClickbaitResult;
  readerJourney: ReaderJourneyResult;
  utilityGate: UtilityGateResult;
  diagnostico: DiagnosticoEditorial;
  recomendacionEditorial: RecomendacionEditorial;
  estadoEditorial: EstadoEditorial;
  mensajeEditor: string;
  razonamiento: { punto: string; positivo: boolean }[];
  score: number;
  // Backward compat (computed from recomendacionEditorial)
  publicar: boolean;
  bloquear: boolean;
  motivoBloqueo: string | null;
  llmInstructions: LlmInstructions;
  editorialDna: EditorialDnaResult;
}
