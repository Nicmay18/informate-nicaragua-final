/**
 * Editorial Supervisor — Tipos canónicos
 * ========================================
 * El supervisor está POR ENCIMA del flujo operativo.
 * No es MENI. No es el Research Agent. No es el Story Editor.
 * Es el orquestador que vigila TODO el ciclo de vida de una noticia.
 *
 * MENI valida. Research investiga. Story redacta.
 * SUPERVISOR piensa, vigila, decide, y cuando puede, resuelve.
 */

import type { ResearchResult } from '@/lib/research/types';
import type { StoryProposal } from '@/lib/editorial/story-editor/types';
import type { WatchResult, UpdateDetected } from '@/lib/news-watch/types';

// ═══════════════════════════════════════════════════════════════
// CICLO DE VIDA DE UNA NOTICIA
// ═══════════════════════════════════════════════════════════════

export type ArticleLifecycleState =
  | 'IDEA'
  | 'RESEARCHING'
  | 'RESEARCHED'
  | 'WRITING'
  | 'EDITORIAL_REVIEW'
  | 'READY'
  | 'PUBLISHED'
  | 'WATCHING'
  | 'UPDATE_DETECTED'
  | 'UPDATED'
  | 'CLOSED'
  | 'ARCHIVED';

// ═══════════════════════════════════════════════════════════════
// DECISIÓN EDITORIAL DEL SUPERVISOR
// ═══════════════════════════════════════════════════════════════

export type SupervisorVerdict =
  | 'PUBLICAR'
  | 'PUBLICAR_CON_CAMBIOS'
  | 'INVESTIGAR_MAS'
  | 'REVISION_HUMANA'
  | 'NO_PUBLICAR'
  | 'ARCHIVAR'
  | 'ACTUALIZAR'
  | 'BLOQUEAR';

export interface SupervisorDecision {
  /** ID único de la decisión del supervisor */
  decisionId: string;
  /** Timestamp ISO */
  timestamp: string;
  /** Veredicto editorial */
  verdict: SupervisorVerdict;
  /** Razón humana legible — explica POR QUÉ, no solo qué */
  reason: string;
  /** Confianza 0-1 */
  confidence: number;
  /** ¿El score es alto pero la decisión es negativa? Explicar por qué */
  scoreOverride: boolean;
  scoreOverrideReason?: string;
  /** Problemas detectados que justifican la decisión */
  issues: SupervisorIssue[];
  /** Acciones recomendadas concretas */
  actions: SupervisorAction[];
  /** Estado del ciclo de vida resultante */
  resultingState: ArticleLifecycleState;
  /** Versión del modelo de decisión */
  modelVersion: string;
}

// ═══════════════════════════════════════════════════════════════
// PROBLEMAS DETECTADOS
// ═══════════════════════════════════════════════════════════════

export type IssueSeverity = 'CRITICAL' | 'IMPORTANT' | 'WARNING' | 'OPTIMIZATION';
export type IssueDomain =
  | 'TITULO'
  | 'INVESTIGACION'
  | 'REDACCION'
  | 'RESUMEN'
  | 'CUERPO'
  | 'CATEGORIA'
  | 'PERFIL'
  | 'SEO'
  | 'IMAGEN'
  | 'DISCOVER'
  | 'NEWS'
  | 'EEAT'
  | 'LECTOR'
  | 'PUBLICACION'
  | 'HOMEPAGE'
  | 'ARTICULO'
  | 'SOCIAL'
  | 'TELEGRAM'
  | 'FACEBOOK'
  | 'WHATSAPP'
  | 'RENDIMIENTO'
  | 'ACTUALIZACION'
  | 'CONFLICTO'
  | 'ABANDONO'
  | 'COSTO'
  | 'SEGURIDAD'
  | 'INFRAESTRUCTURA';

export interface SupervisorIssue {
  severity: IssueSeverity;
  domain: IssueDomain;
  problem: string;
  impact: string;
  cause: string;
  action: string;
  /** ¿Puede resolverse automáticamente de forma segura? */
  autoFixable: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ACCIONES DEL SUPERVISOR
// ═══════════════════════════════════════════════════════════════

export type ActionType =
  | 'INVESTIGATE'
  | 'RESEARCH_WEB'
  | 'REWRITE_TITLE'
  | 'REWRITE_SUMMARY'
  | 'REWRITE_BODY'
  | 'RECLASSIFY'
  | 'FIX_SEO'
  | 'ADD_IMAGE'
  | 'GENERATE_SOCIAL'
  | 'DISTRIBUTE'
  | 'START_WATCH'
  | 'RUN_WATCH_CYCLE'
  | 'APPLY_SAFE_UPDATE'
  | 'REQUEST_HUMAN_REVIEW'
  | 'BLOCK_PUBLICATION'
  | 'ARCHIVE'
  | 'ALERT';

export interface SupervisorAction {
  type: ActionType;
  description: string;
  priority: 'IMMEDIATE' | 'HIGH' | 'NORMAL' | 'LOW';
  /** ¿Se ejecuta automáticamente o requiere humano? */
  execution: 'AUTO' | 'MANUAL' | 'SEMI_AUTO';
  /** Si es AUTO, qué función del supervisor la ejecuta */
  handler?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXTO COMPLETO DE UNA NOTICIA
// ═══════════════════════════════════════════════════════════════

export interface ArticleContext {
  id?: string;
  titulo: string;
  contenido: string;
  resumen?: string;
  categoria?: string;
  perfil?: string;
  departamento?: string;
  autor?: string;
  imagen?: string;
  slug?: string;
  publicado?: boolean;
  estado?: string;
  fecha?: string;
  publishedAt?: string;
  dateModified?: string;
  editorialTier?: string;
  scoreMeni?: number;
  aprobadoMeni?: boolean;
  /** Resultado de investigación si existe */
  research?: ResearchResult;
  /** Propuesta del Story Editor si existe */
  story?: StoryProposal;
  /** Resultado del último watch cycle si existe */
  watch?: WatchResult;
  /** Actualizaciones detectadas pendientes */
  pendingUpdates?: UpdateDetected[];
  /** Días desde publicación */
  ageDays?: number;
  /** Vistas acumuladas */
  views?: number;
}

// ═══════════════════════════════════════════════════════════════
// SALUD DEL MEDIO
// ═══════════════════════════════════════════════════════════════

export interface MediumHealth {
  checkedAt: string;
  critical: number;
  important: number;
  warning: number;
  optimization: number;
  issues: SupervisorIssue[];
  /** Indicadores clave */
  indicators: {
    totalPublished: number;
    totalWatching: number;
    totalUpdatesDetected: number;
    totalAbandoned: number;
    totalWithoutPublishedAt: number;
    totalWithInvalidCategory: number;
    totalWithoutImage: number;
    geminiConfigured: boolean;
    telegramConfigured: boolean;
    facebookConfigured: boolean;
    cronActive: boolean;
    costGuardActive: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════
// AUDITORÍA DE HOMEPAGE
// ═══════════════════════════════════════════════════════════════

export interface HomepageAudit {
  checkedAt: string;
  issues: SupervisorIssue[];
  metrics: {
    totalArticles: number;
    categoryBalance: Record<string, number>;
    oldestArticleAgeHours: number;
    titlesWeak: number;
    imagesMissing: number;
    duplicateTitles: number;
  };
  recommendations: string[];
}

// ═══════════════════════════════════════════════════════════════
// CONTROL DE COSTOS
// ═══════════════════════════════════════════════════════════════

export interface CostGuardStatus {
  /** Llamadas IA en la última hora */
  callsThisHour: number;
  /** Límite por hora */
  maxCallsPerHour: number;
  /** Llamadas hoy */
  callsToday: number;
  /** Límite diario */
  maxCallsPerDay: number;
  /** Llamadas este mes */
  callsThisMonth: number;
  /** Límite mensual */
  maxCallsPerMonth: number;
  /** ¿Se puede hacer otra llamada? */
  canCall: boolean;
  /** Razón si no se puede */
  blockedReason?: string;
  /** Estimación de costo acumulado en USD */
  estimatedCostUsd: number;
}

export interface CostGuardConfig {
  maxCallsPerHour: number;
  maxCallsPerDay: number;
  maxCallsPerMonth: number;
  /** Costo estimado por llamada en USD */
  costPerCall: number;
  /** Cooldown en ms entre llamadas al mismo artículo */
  articleCooldownMs: number;
}

// ═══════════════════════════════════════════════════════════════
// PANEL DE OPERACIONES
// ═══════════════════════════════════════════════════════════════

export interface OperationsPanel {
  generatedAt: string;
  health: MediumHealth;
  costGuard: CostGuardStatus;
  /** Noticias que requieren atención inmediata */
  criticalArticles: Array<{
    articleId: string;
    titulo: string;
    state: ArticleLifecycleState;
    issues: SupervisorIssue[];
    lastAction: string;
  }>;
  /** Noticias en vigilancia */
  watchingArticles: Array<{
    articleId: string;
    titulo: string;
    frequency: string;
    lastCheck: string;
    nextCheck: string;
    updatesDetected: number;
  }>;
  /** Actualizaciones detectadas pendientes de revisión */
  pendingUpdates: Array<{
    articleId: string;
    titulo: string;
    update: UpdateDetected;
  }>;
  /** Investigaciones activas */
  activeInvestigations: Array<{
    articleId: string;
    titulo: string;
    startedAt: string;
  }>;
  /** Homepage audit */
  homepage: HomepageAudit | null;
}

export const SUPERVISOR_MODEL_VERSION = 'editorial-supervisor-v1.0';
