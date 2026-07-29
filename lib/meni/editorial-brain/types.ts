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
import type { KnowledgeQueryResult } from '@/lib/meni/knowledge-base/types';

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
  // Editor Jefe — Fase 1: patrones aprendidos del editor humano
  editorPatterns?: EditorPattern[];
  // Editor Jefe — Fase 2: datos de portada para saturación
  portadaData?: { categoria: string; fecha: string }[];
  // Editor Jefe — Fase 3: query de Knowledge Base
  knowledgeQuery?: KnowledgeQueryResult;
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
// Editor Jefe — Fase 1: Aprendizaje del Editor
// ═══════════════════════════════════════════════════════════

export type CampoCorreccion = 'titulo' | 'entrada' | 'contexto' | 'servicio' | 'orden' | 'cuerpo' | 'frases';

export interface EditorPattern {
  campo: CampoCorreccion;
  descripcion: string;
  frecuencia: number;
  categorias: string[];
  ejemploAntes: string;
  ejemploDespues: string;
  confianzaNivel: number;
  ultimaVez: string;
}

export interface CorreccionRegistrada {
  articleId: string;
  campo: CampoCorreccion;
  antes: string;
  despues: string;
  categoria: string;
  fecha: string;
  diferenciaTipo: 'acortar' | 'ampliar' | 'agregar_contexto' | 'eliminar_relleno' | 'agregar_servicio' | 'reordenar' | 'otro';
}

// ═══════════════════════════════════════════════════════════
// Editor Jefe — Fase 2: Ranking Editorial + Saturación
// ═══════════════════════════════════════════════════════════

export interface EditorialRanking {
  estrellas: 1 | 2 | 3 | 4 | 5;
  etiqueta: 'Portada Principal' | 'Portada' | 'Destacada' | 'Secundaria' | 'No vale portada';
  valorPortada: 'principal' | 'portada' | 'destacada' | 'secundaria' | 'no_portada';
  valorDiscover: 'Alta' | 'Media' | 'Baja';
  valorFacebook: 'Alta' | 'Media' | 'Baja';
  valorServicio: 'Muy alto' | 'Alto' | 'Medio' | 'Bajo';
  razon: string;
}

export interface SaturacionPortada {
  distribucion: { categoria: string; cantidad: number; porcentaje: number }[];
  categoriasSaturadas: string[];
  categoriasFaltantes: string[];
  recomendacion: string;
  nivelSaturacion: 'verde' | 'amarillo' | 'rojo';
  horasSinNoticiaPositiva?: number;
}

// ═══════════════════════════════════════════════════════════
// Editor Jefe — Fase 3: Memoria Editorial Inteligente
// ═══════════════════════════════════════════════════════════

export interface MemoriaEditorial {
  antecedentes: string[];
  cronologia: { fecha: string; titulo: string; categoria: string; slug: string }[];
  entidadesRelacionadas: string[];
  tendencia: string | null;
  contextoNarrativo: string;
  totalRelacionadas: number;
}

// ═══════════════════════════════════════════════════════════
// Editorial Jefe Ejecutivo — veredicto único
// ═══════════════════════════════════════════════════════════

export type VeredictoEjecutivoPublicar = 'SI' | 'NO' | 'MEJORAR';

export interface VeredictoEditorJefe {
  // Respuesta a la única pregunta del editor
  publicar: VeredictoEjecutivoPublicar;
  confianza: number; // 0-100
  respuestaEjecutiva: string; // frase del Editor Jefe
  readerLearning: string; // qué aprende el lector
  editorialContribution: string; // qué aporta Nicaragua Informate
  worthReading: string; // por qué abrir Nicaragua Informate y no otro medio
  loQueOtrosNoContaran: string[]; // ángulos que probablemente no cubrirán otros medios
  wowIdea: string; // una sola idea con identidad
  // Evidencia que alimenta el veredicto
  valorParaLector: string;
  valorFrenteCompetencia: string;
  riesgoEditorial: 'BAJO' | 'MEDIO' | 'ALTO';
  queFalta: string[];
  // Distribución y canales
  recomendacionPortada: 'Hero principal' | 'Portada principal' | 'Portada' | 'Destacada' | 'Secundaria' | 'No va a portada';
  probabilidadFacebook: 'Muy alta' | 'Alta' | 'Media' | 'Baja' | 'Muy baja';
  probabilidadDiscover: 'Muy alta' | 'Alta' | 'Media' | 'Baja' | 'Muy baja';
  // Memoria y aprendizaje
  antecedentesUsados: string[];
  patronesAplicados: string[];
  correccionesEditor: string[];
}

export type RecomendacionEditorial = 'publicar' | 'mejorar' | 'revisar';

export interface PuntoPerdido {
  concepto: string;
  puntos: number;
}

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
  puntosPerdidos: PuntoPerdido[];
  // ─────────────────────────────────────────────────────────────
  // Campos planos — única fuente de verdad para UI y engine.ts
  // Todo el sistema deriva de estos campos, no de los sub-motores.
  // ─────────────────────────────────────────────────────────────
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
  // Filosofía editorial — respuestas obligatorias
  readerLearning: string;
  editorialContribution: string;
  // ─────────────────────────────────────────────────────────────
  // Fase 1: Aprendizaje del Editor
  // Patrones detectados de correcciones manuales del editor humano.
  // ─────────────────────────────────────────────────────────────
  patronesAplicados: EditorPattern[];
  correccionesSugeridas: string[];
  // ─────────────────────────────────────────────────────────────
  // Fase 2: Ranking Editorial + Editor de Portada
  // ─────────────────────────────────────────────────────────────
  ranking: EditorialRanking;
  saturacion?: SaturacionPortada;
  // ─────────────────────────────────────────────────────────────
  // Fase 3: Memoria Editorial Inteligente
  // Contexto narrativo generado desde la Knowledge Base.
  // ─────────────────────────────────────────────────────────────
  memoriaEditorial?: MemoriaEditorial;
  // ─────────────────────────────────────────────────────────────
  // Veredicto ejecutivo único: la única salida del Editor Jefe
  // ─────────────────────────────────────────────────────────────
  veredictoEjecutivo: VeredictoEditorJefe;
}
