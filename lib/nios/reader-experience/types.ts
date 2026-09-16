import type { Noticia } from '@/lib/types';
import type { Issue, RepairRecord } from '@/lib/nios/validators/types';

/**
 * Problema detectado por el ReaderExperienceEngine.
 * Extiende un Issue de los validators con evidencia, confianza y,
 * opcionalmente, una propuesta de reparación segura.
 */
export interface DetectedProblem extends Issue {
  stage: 'detect';
  confidence: number;
  evidence: string;
  proposedRepair?: RepairProposal;
}

/**
 * Propuesta de reparación generada en DETECT, sin aplicar.
 */
export interface RepairProposal {
  repairer: string;
  rule: string;
  field: string;
  reason: string;
  before: unknown;
  after: unknown | null;
}

/**
 * Resultado canónico de una validación.
 */
export interface ValidationResult {
  valid: boolean;
  issues: Issue[];
}

/**
 * Estrategia de reparación segura que puede ofrecer el Engine.
 */
export interface Repairer {
  name: string;
  rule: string;
  field: string;
  /** Campos que este reparador puede modificar. Default: [field]. */
  allowedFields?: string[];
  canRepair: (noticia: Noticia, issues: Issue[]) => boolean;
  propose: (noticia: Noticia) => RepairProposal | null;
  apply: (noticia: Noticia) => { noticia: Noticia; records: RepairRecord[] } | null;
}

/**
 * Configuración del ReaderExperienceEngine.
 */
export interface ReaderExperienceEngineConfig {
  /** Máximo de reparaciones a aplicar en una ejecución. Default 8. */
  maxRepairs?: number;
  /** Campos que el Engine puede modificar. Default todos. */
  allowedFields?: string[];
  /** Reparadores registrados. */
  repairers?: Repairer[];
}

/**
 * Entrada de la bitácora de auditoría.
 */
export interface AuditStep {
  stage: 'detect' | 'validate' | 'repair' | 'validate_again' | 'commit' | 'rollback';
  timestamp: string;
  detail: unknown;
}

/**
 * Resultado de una ejecución del ReaderExperienceEngine.
 */
export interface EngineResult {
  status: 'committed' | 'rolled_back' | 'no_changes' | 'blocked';
  original: Noticia;
  final: Noticia;
  initial: ValidationResult;
  detections: DetectedProblem[];
  repair: {
    applied: boolean;
    records: RepairRecord[];
  };
  post: ValidationResult;
  changes: Record<string, { before: unknown; after: unknown }>;
  audit: {
    startedAt: string;
    completedAt: string;
    steps: AuditStep[];
  };
}
