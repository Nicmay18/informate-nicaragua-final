/**
 * NIOS CEO Action Registry
 * ========================
 * Registro canónico de acciones que el CEO puede decidir ejecutar.
 * Evita que el sistema invente capacidades que no tiene.
 *
 * Niveles de autonomía:
 *   0 = observar
 *   1 = reparaciones técnicas seguras
 *   2 = optimizaciones reversibles
 *   3 = acciones editoriales de bajo riesgo
 *   4 = acciones que afectan publicación/distribución
 *   5 = acciones críticas → siempre humano
 */

export type CeoActionDomain =
  | 'health'
  | 'traffic'
  | 'content'
  | 'seo'
  | 'distribution'
  | 'social'
  | 'audience'
  | 'growth'
  | 'monetization'
  | 'system';

export type CeoExecutionMode = 'NO_ACTION' | 'AUTO_EXECUTE' | 'QUEUE_FOR_HUMAN' | 'BLOCKED';

export interface CeoActionDefinition {
  id: string;
  domain: CeoActionDomain;
  level: 0 | 1 | 2 | 3 | 4 | 5;
  title: string;
  risk: number; // 0-1
  reversible: boolean;
  requiresHuman: boolean;
  executor: 'nios-repair' | 'nios-cache' | 'nios-snapshot' | 'nios-queue' | 'nios-noop' | 'nios-experiment' | 'human';
  verification: string;
  sideEffect: string;
  description: string;
}

export interface CeoDecisionInput {
  id: string;
  domain: CeoActionDomain;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  evidence: string[];
  reason: string;
  expectedImpact: string;
  suggestedActionId: string;
  risk: number;
  deadline?: string; // ISO date
  metadata?: Record<string, unknown>;
}

export interface CeoEnrichedDecision {
  id: string;
  domain: CeoActionDomain;
  priority: number;
  priorityLabel: 'P0' | 'P1' | 'P2' | 'P3';
  evidence: string[];
  reason: string;
  expectedImpact: string;
  action: CeoActionDefinition;
  executionMode: CeoExecutionMode;
  deadline?: string;
  metadata?: Record<string, unknown>;
}

const REGISTRY: Record<string, CeoActionDefinition> = {
  'nios-cache-refresh': {
    id: 'nios-cache-refresh',
    domain: 'system',
    level: 1,
    title: 'Refrescar caché de NIOS',
    risk: 0.05,
    reversible: true,
    requiresHuman: false,
    executor: 'nios-cache',
    verification: 'Siguiente lectura de datos no usa caché obsoleta.',
    sideEffect: 'Invalida tags de caché de Next.js y NIOS.',
    description: 'Reconstruye lecturas de caché para evitar decisiones con datos viejos.',
  },
  'nios-snapshot-refresh': {
    id: 'nios-snapshot-refresh',
    domain: 'system',
    level: 1,
    title: 'Reconstruir snapshot diario',
    risk: 0.2,
    reversible: true,
    requiresHuman: false,
    executor: 'nios-snapshot',
    verification: 'nios_daily_snapshots contiene el mismo conteo de artículos que noticias publicadas.',
    sideEffect: 'Guarda un nuevo documento de snapshot en Firestore.',
    description: 'Regenera el snapshot diario cuando el conteo no coincide con el dashboard.',
  },
  'revalidate-traffic-tag': {
    id: 'revalidate-traffic-tag',
    domain: 'traffic',
    level: 1,
    title: 'Invalidar caché de tráfico',
    risk: 0.05,
    reversible: true,
    requiresHuman: false,
    executor: 'nios-cache',
    verification: 'Tag traffic-data invalidado; próxima lectura obtiene datos frescos.',
    sideEffect: 'Re-solicita performance de tráfico a Firestore.',
    description: 'Fuerza lectura actualizada del rendimiento de tráfico.',
  },
  'queue-hero-article': {
    id: 'queue-hero-article',
    domain: 'content',
    level: 4,
    title: 'Colocar artículo sugerido en portada',
    risk: 0.6,
    reversible: true,
    requiresHuman: true,
    executor: 'nios-queue',
    verification: 'Tarea pendiente en nios_memory con referencia al slug propuesto.',
    sideEffect: 'Crea tarea para que un humano decida si lo pone en hero.',
    description: 'Sugiere reposicionar una noticia en el hero de la portada.',
  },
  'queue-distribution-copy': {
    id: 'queue-distribution-copy',
    domain: 'distribution',
    level: 4,
    title: 'Preparar copias de distribución',
    risk: 0.5,
    reversible: true,
    requiresHuman: true,
    executor: 'nios-queue',
    verification: 'nios_memory contiene la tarea de distribución pendiente.',
    sideEffect: 'Encola copias para Telegram/Facebook/WhatsApp/Newsletter.',
    description: 'Sugiere al equipo de canal los textos de distribución.',
  },
  'queue-evergreen-guide': {
    id: 'queue-evergreen-guide',
    domain: 'growth',
    level: 3,
    title: 'Crear guía evergreen desde nota identificada',
    risk: 0.4,
    reversible: true,
    requiresHuman: true,
    executor: 'nios-queue',
    verification: 'Tarea en nios_memory con noticia origen y tema.',
    sideEffect: 'Encola trabajo de transformación a guía, no modifica el artículo.',
    description: 'Sugiere convertir una noticia recurrente en guía permanente.',
  },
  'queue-title-experiment': {
    id: 'queue-title-experiment',
    domain: 'seo',
    level: 3,
    title: 'Proponer experimento de título/meta',
    risk: 0.4,
    reversible: true,
    requiresHuman: true,
    executor: 'nios-queue',
    verification: 'nios_memory contiene experimento con hipótesis, control, variante y métrica.',
    sideEffect: 'Encola experimento SEO; no publica cambios automáticamente.',
    description: 'Sugiere experimento de título/meta para artículo con impresiones y bajo CTR.',
  },
  'queue-update-article': {
    id: 'queue-update-article',
    domain: 'content',
    level: 3,
    title: 'Actualizar artículo con datos nuevos',
    risk: 0.5,
    reversible: true,
    requiresHuman: true,
    executor: 'nios-queue',
    verification: 'Tarea en nios_memory con slug y motivo de actualización.',
    sideEffect: 'Encola revisión editorial; no modifica contenido automáticamente.',
    description: 'Sugiere actualizar una pieza antigua con tráfico pero información desactualizada.',
  },
  'block-ga4-missing': {
    id: 'block-ga4-missing',
    domain: 'system',
    level: 5,
    title: 'Configurar GA4 antes de continuar',
    risk: 0.9,
    reversible: false,
    requiresHuman: true,
    executor: 'human',
    verification: 'Variable de entorno NIOS_GA4_PROPERTY_ID configurada y datos reales.',
    sideEffect: 'Ninguno hasta que el humano configure la propiedad.',
    description: 'Bloquea decisiones basadas en GA4 hasta que se configure.',
  },
  'block-gsc-missing': {
    id: 'block-gsc-missing',
    domain: 'system',
    level: 5,
    title: 'Configurar Google Search Console antes de continuar',
    risk: 0.9,
    reversible: false,
    requiresHuman: true,
    executor: 'human',
    verification: 'Credenciales GSC configuradas y datos reales recibidos.',
    sideEffect: 'Ninguno hasta que el humano configure credenciales.',
    description: 'Bloquea decisiones SEO basadas en GSC hasta que se configure.',
  },
  'no-action-healthy': {
    id: 'no-action-healthy',
    domain: 'system',
    level: 0,
    title: 'Sin acción necesaria',
    risk: 0,
    reversible: true,
    requiresHuman: false,
    executor: 'nios-noop',
    verification: 'No se requiere verificación.',
    sideEffect: 'Ninguno.',
    description: 'El sistema está saludable; solo se registra observación.',
  },
  'no-action-insufficient-evidence': {
    id: 'no-action-insufficient-evidence',
    domain: 'system',
    level: 0,
    title: 'Sin acción por evidencia insuficiente',
    risk: 0,
    reversible: true,
    requiresHuman: false,
    executor: 'nios-noop',
    verification: 'Evidencia registrada en nios_memory para próxima revisión.',
    sideEffect: 'Ninguno.',
    description: 'La señal no supera el umbral de acción concreta.',
  },
};

export function getCeoAction(id: string): CeoActionDefinition | undefined {
  return REGISTRY[id];
}

export function determineExecutionMode(action: CeoActionDefinition, context: { humanConfirmed?: boolean } = {}): CeoExecutionMode {
  if (action.requiresHuman && !context.humanConfirmed) {
    return action.level >= 5 ? 'BLOCKED' : 'QUEUE_FOR_HUMAN';
  }
  if (action.level <= 1) return 'AUTO_EXECUTE';
  if (action.level <= 2) return context.humanConfirmed ? 'AUTO_EXECUTE' : 'QUEUE_FOR_HUMAN';
  return 'QUEUE_FOR_HUMAN';
}

export function scorePriority(input: CeoDecisionInput, learningBoost = 1): number {
  const order = { P0: 1, P1: 0.8, P2: 0.5, P3: 0.1 } as const;
  const base = order[input.priority] ?? 0.1;
  const executability = input.suggestedActionId ? 1 : 0.5;
  const riskPenalty = 1 - input.risk;
  const raw = base * executability * riskPenalty * Math.max(0.5, Math.min(2, learningBoost));
  return Math.round(raw * 10000) / 10000;
}

export function labelPriority(score: number): 'P0' | 'P1' | 'P2' | 'P3' {
  if (score >= 0.8) return 'P0';
  if (score >= 0.5) return 'P1';
  if (score >= 0.25) return 'P2';
  return 'P3';
}
