/**
 * Sistema de Seguimiento — Tipos
 * ================================
 * Casos abiertos y continuidad editorial.
 * Rastrea historias en desarrollo que requieren cobertura continua.
 */

/** Estado de un caso */
export type CaseStatus =
  | 'abierto'        // Caso activo, requiere seguimiento
  | 'en_desarrollo'  // Hay novedades, sigue evolucionando
  | 'en_pausa'       // Sin novedades recientes, pero no cerrado
  | 'cerrado'        // Resuelto o finalizado
  | 'archivado';     // Ya no relevante

/** Prioridad del caso */
export type CasePriority = 'urgente' | 'alta' | 'media' | 'baja';

/** Tipo de caso editorial */
export type CaseType =
  | 'judicial'         // Casos legales, juicios, procesos
  | 'conflicto'        // Conflictos sociales, políticos, territoriales
  | 'investigacion'    // Investigaciones en curso
  | 'salud_publica'    // Brotes, epidemias, crisis sanitarias
  | 'economia'         // Crisis económicas, precios, políticas
  | 'desastre'         // Desastres naturales, emergencias
  | 'politico'         // Procesos políticos, elecciones, reformas
  | 'deportivo'        // Torneos, transferencias, selecciones
  | 'social'           // Movimientos sociales, protestas, demandas
  | 'general';         // Otros

/** Un caso de seguimiento editorial */
export interface TrackingCase {
  id: string;
  title: string;
  summary: string;
  type: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  category: string;
  departamento: string;

  /** Artículos asociados al caso */
  articleIds: string[];
  articleSlugs: string[];
  articleCount: number;

  /** Entidades del Knowledge Graph relacionadas */
  entityIds: string[];

  /** Fechas clave */
  openedAt: string;
  lastUpdateAt: string;
  lastArticleAt: string | null;
  closedAt: string | null;

  /** Tiempo esperado entre actualizaciones (días) */
  expectedUpdateFrequencyDays: number;

  /** Próxima fecha sugerida para actualización */
  nextCheckDate: string;

  /** Etiquetas para búsqueda */
  tags: string[];

  /** Metadata adicional */
  metadata: {
    keyEntities: string[];
    location: string;
    peopleInvolved: string[];
    institutionsInvolved: string[];
  };
}

/** Actualización de un caso (vinculada a un artículo) */
export interface CaseUpdate {
  id: string;
  caseId: string;
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  updateType: 'nuevo_articulo' | 'novedad' | 'cierre' | 'actualizacion';
  summary: string;
  timestamp: string;
  significant: boolean;
}

/** Alerta de seguimiento */
export interface CaseAlert {
  id: string;
  caseId: string;
  caseTitle: string;
  type: 'stale' | 'new_development' | 'deadline' | 'priority_change' | 'entity_match';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestedAction: string;
  createdAt: string;
  resolved: boolean;
}

/** Resultado de detección automática desde un artículo */
export interface CaseDetectionResult {
  detected: boolean;
  caseId: string | null;
  newCase: Partial<TrackingCase> | null;
  matchedEntities: string[];
  reason: string;
}

/** Resumen del panel de seguimiento */
export interface SeguimientoDashboard {
  totalOpen: number;
  totalClosed: number;
  byType: Record<CaseType, number>;
  byPriority: Record<CasePriority, number>;
  byStatus: Record<CaseStatus, number>;
  staleCases: TrackingCase[];
  urgentCases: TrackingCase[];
  recentUpdates: CaseUpdate[];
  alerts: CaseAlert[];
  topCases: TrackingCase[];
}

/** Configuración del sistema de seguimiento */
export interface SeguimientoConfig {
  staleThresholdDays: number;
  urgentThresholdDays: number;
  autoDetect: boolean;
  autoLinkEntities: boolean;
}

export const DEFAULT_SEGUIMIENTO_CONFIG: SeguimientoConfig = {
  staleThresholdDays: 14,
  urgentThresholdDays: 30,
  autoDetect: true,
  autoLinkEntities: true,
};
