/**
 * NIOS Command Center — Swiss Watch Mode
 *
 * Capa de estado global y Sala de Expertos.
 *
 * REGLA ANTI-ALUCINACION (absoluta):
 *   - GREEN            solo si existe evidencia verificada en runtime.
 *   - YELLOW           funciona pero necesita pulido.
 *   - RED              roto y resoluble dentro del repositorio.
 *   - BLOCKED_EXTERNAL depende de una accion que solo puede hacer el propietario.
 *   - UNKNOWN          no medible con la informacion disponible.
 *
 * Nunca se permite convertir UNKNOWN, BLOCKED_EXTERNAL o RED en GREEN
 * sin una evidencia real adjunta.
 */

/** Semaforo de un experto o del sistema completo. */
export type SwissStatus = 'GREEN' | 'YELLOW' | 'RED' | 'BLOCKED_EXTERNAL' | 'UNKNOWN';

/** Prioridad operativa segun la seccion 28 del protocolo. */
export type SwissPriority = 'P0' | 'P1' | 'P2' | 'P3';

/** Estados del sistema de tareas (seccion 27). */
export type SwissTaskState =
  | 'QUEUED'
  | 'RUNNING'
  | 'VERIFYING'
  | 'DONE'
  | 'FAILED'
  | 'BLOCKED_EXTERNAL'
  | 'ESCALATED';

/** Identificadores de los expertos de la Sala de Expertos. */
export type ExpertId =
  | 'CEO'
  | 'EDITORIAL'
  | 'MENI'
  | 'SEO'
  | 'GOOGLE_INTELLIGENCE'
  | 'FIREBASE'
  | 'FIRESTORE'
  | 'PERFORMANCE'
  | 'UX'
  | 'DESIGN'
  | 'DISTRIBUTION'
  | 'MONETIZATION'
  | 'ADSENSE_READINESS'
  | 'SECURITY'
  | 'RELIABILITY'
  | 'WATCHDOG'
  | 'CRONS'
  | 'CODEBASE'
  | 'DEVELOPMENT';

/**
 * Evidencia de una comprobacion concreta.
 * Sin `evidence` una tarea no puede marcarse DONE (seccion 27).
 */
export interface SwissEvidence {
  /** Que se comprobo. */
  check: string;
  /** Resultado observado, en texto corto y verificable. */
  observed: string;
  /** Como se obtuvo: runtime probe, filesystem, http, firestore, etc. */
  source: 'runtime' | 'firestore' | 'http' | 'filesystem' | 'config' | 'build';
  /** Momento de la observacion. */
  observedAt: string;
  /** true solo si la observacion confirma funcionamiento. */
  passed: boolean;
}

/**
 * Bloqueo que depende del propietario de las cuentas externas.
 * Debe especificar exactamente que falta, donde ponerlo y como comprobarlo
 * (seccion 51 del protocolo).
 */
export interface ExternalBlocker {
  /** Que falta exactamente. */
  missing: string;
  /** Quien debe proporcionarlo. */
  owner: string;
  /** Donde se introduce (proveedor + ubicacion exacta). */
  where: string;
  /** Como se comprueba una vez configurado. */
  howToVerify: string;
  /** Prueba que NIOS ejecutara inmediatamente despues. */
  verificationCommand: string;
}

/** Tarea interna creada por un experto. */
export interface SwissTask {
  id: string;
  owner: ExpertId;
  title: string;
  priority: SwissPriority;
  status: SwissTaskState;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  /** Evidencia obligatoria para status DONE. */
  evidence: SwissEvidence[];
  result?: string;
  nextAction?: string;
}

/** Estado completo de un experto de la sala. */
export interface ExpertReport {
  id: ExpertId;
  /** Nombre legible del experto. */
  name: string;
  /** Dominio del que es responsable. */
  domain: string;
  status: SwissStatus;
  /** Explicacion de por que tiene ese color. */
  reason: string;
  /** Evidencia recogida en runtime. */
  evidence: SwissEvidence[];
  /** Accion que se esta ejecutando ahora, si hay alguna. */
  currentAction: string | null;
  /** Tareas abiertas asignadas a este experto. */
  tasks: SwissTask[];
  /** Bloqueos que requieren intervencion del propietario. */
  externalBlockers: ExternalBlocker[];
  /** Momento de la ultima comprobacion. */
  lastCheckedAt: string;
}

/** Resultado del motor de preparacion para AdSense (seccion 19). */
export interface AdSenseReadinessVerdict {
  status: SwissStatus;
  /** Score interno 0-100. No es una prediccion de aprobacion. */
  score: number;
  /**
   * Veredicto textual. Solo puede afirmar preparacion interna,
   * nunca aprobacion de Google (seccion 45).
   */
  verdict: 'NOT_READY' | 'READY_FOR_REVIEW';
  /** Bloqueadores internos concretos. Deben ser 0 para READY_FOR_REVIEW. */
  internalBlockers: AdSenseBlocker[];
  /** Comprobaciones ejecutadas con su resultado. */
  checks: AdSenseCheck[];
  /** Paginas con problemas detectados. */
  problemPages: { slug: string; issue: string }[];
  lastReviewedAt: string;
  /** Aviso permanente de que la decision final es de Google. */
  disclaimer: string;
}

export interface AdSenseCheck {
  id: string;
  label: string;
  /** Politica o requisito de Google relacionado. */
  policy: string;
  passed: boolean;
  detail: string;
  /** Peso del check en el score interno. */
  weight: number;
}

export interface AdSenseBlocker {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  problem: string;
  policy: string;
  correctiveAction: string;
  /** true si NIOS puede resolverlo dentro del repositorio. */
  fixableInternally: boolean;
}

/** Tablero completo del Command Center. */
export interface SwissWatchBoard {
  generatedAt: string;
  /** Estado global agregado. */
  status: SwissStatus;
  /** Explicacion del estado global. */
  summary: string;
  /** Modo operativo declarado. */
  mode: 'SWISS_WATCH';
  /** Conteo por color. */
  counters: Record<SwissStatus, number>;
  /** Sala de expertos completa. */
  experts: ExpertReport[];
  /** Todas las tareas abiertas, ordenadas por prioridad. */
  openTasks: SwissTask[];
  /** Todos los bloqueos externos consolidados. */
  externalBlockers: (ExternalBlocker & { expert: ExpertId })[];
  /** Motor de preparacion AdSense. */
  adsense: AdSenseReadinessVerdict;
  /** Errores ocurridos al construir el tablero. */
  errors: string[];
}
