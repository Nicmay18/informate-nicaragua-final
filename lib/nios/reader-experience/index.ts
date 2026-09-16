// lib/nios/reader-experience/index.ts
// ReaderExperienceEngine — Fase 2.2.
// Motor puro, determinista y auditado para DETECT → VALIDATE → SAFE REPAIR →
// VALIDATE AGAIN → COMMIT / ROLLBACK.
// No inventa datos, no escribe en producción y no modifica validators.

import type { Noticia } from '@/lib/types';
import type { Issue } from '@/lib/nios/validators/types';
import {
  validateContent,
  validateFuente,
  validateImagen,
  validateInternalLinks,
  validateLead,
  validatePuntoClave,
  validateSubtitulos,
  validateTitle,
  repairPuntosClave,
} from '@/lib/nios/validators';
import type {
  DetectedProblem,
  EngineResult,
  ReaderExperienceEngineConfig,
  Repairer,
  RepairProposal,
  ValidationResult,
} from './types';

const DEFAULT_MAX_REPAIRS = 8;

/**
 * Ejecuta todos los validators congelados sobre un artículo.
 * Es la única autoridad de validación; no duplica reglas.
 */
export function validateArticle(noticia: Noticia): ValidationResult {
  const issues: Issue[] = [
    ...validateTitle(noticia),
    ...validateLead(noticia),
    ...validateContent(noticia),
    ...validateFuente(noticia),
    ...validateImagen(noticia),
    ...validateSubtitulos(noticia),
    ...validateInternalLinks(noticia),
  ];

  const context = { titulo: noticia.titulo, resumen: noticia.resumen };
  for (const punto of noticia.puntosClave ?? []) {
    const pkIssues = validatePuntoClave(punto, noticia.contenido, context);
    issues.push(...pkIssues);
  }

  return { valid: !issues.some((i) => i.blocking), issues };
}

/**
 * DETECT.
 * No modifica el artículo. Devuelve problemas con evidencia y, si existe,
 * propuestas de reparación seguras.
 */
export function detect(
  noticia: Noticia,
  config?: ReaderExperienceEngineConfig,
): DetectedProblem[] {
  const { issues } = validateArticle(noticia);
  const repairers = config?.repairers ?? [puntosClaveRepairer];

  return issues.map((issue) => {
    const proposal = findProposal(noticia, issue, repairers);
    return {
      ...issue,
      stage: 'detect',
      confidence: 1,
      evidence: issue.message,
      proposedRepair: proposal ?? undefined,
    };
  });
}

function findProposal(
  noticia: Noticia,
  issue: Issue,
  repairers: Repairer[],
): RepairProposal | null {
  for (const r of repairers) {
    if (r.field === issue.field && r.canRepair(noticia, [issue])) {
      const p = r.propose(noticia);
      if (p) return p;
    }
  }
  return null;
}

function getChangedFields(original: Noticia, modified: Noticia): string[] {
  const keys = new Set<keyof Noticia>([...Object.keys(original), ...Object.keys(modified)] as (keyof Noticia)[]);
  const changed: string[] = [];
  for (const k of keys) {
    const a = (original as unknown as Record<string, unknown>)[k as string];
    const b = (modified as unknown as Record<string, unknown>)[k as string];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changed.push(k as string);
    }
  }
  return changed;
}

function isAllowed(
  changed: string[],
  allowedFields: string[] | undefined,
): boolean {
  if (!allowedFields || allowedFields.length === 0) return true;
  return changed.every((f) => allowedFields.includes(f));
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function now(): string {
  return new Date().toISOString();
}

function logStep(
  audit: EngineResult['audit'],
  stage: 'detect' | 'validate' | 'repair' | 'validate_again' | 'commit' | 'rollback',
  detail: unknown,
) {
  audit.steps.push({ stage, timestamp: now(), detail });
}

/**
 * COMMIT / ROLLBACK.
 * Compara el resultado posterior con el original y decide.
 */
function commitOrRollback(
  original: Noticia,
  repaired: Noticia,
  post: ValidationResult,
  audit: EngineResult['audit'],
  changed: string[],
): { final: Noticia; status: 'committed' | 'rolled_back' } {
  if (
    post.valid &&
    changed.length > 0 &&
    !changed.some((f) => (repaired as unknown as Record<string, unknown>)[f] === undefined)
  ) {
    logStep(audit, 'commit', {
      changed,
      postIssueCount: post.issues.length,
    });
    return { final: deepClone(repaired), status: 'committed' };
  }

  logStep(audit, 'rollback', {
    reason: post.valid ? 'no allowed changes' : 'post-validation failed',
    changed,
    postIssues: post.issues,
  });
  return { final: deepClone(original), status: 'rolled_back' };
}

/**
 * SAFE REPAIR.
 * Aplica los reparadores permitidos y con límite de reparaciones.
 */
function applyRepairs(
  noticia: Noticia,
  initial: ValidationResult,
  config?: ReaderExperienceEngineConfig,
): { noticia: Noticia; records: import('@/lib/nios/validators/types').RepairRecord[] } {
  const repairers = config?.repairers ?? [puntosClaveRepairer];
  const allowedFields = config?.allowedFields;
  const maxRepairs = config?.maxRepairs ?? DEFAULT_MAX_REPAIRS;

  let current = deepClone(noticia);
  const records: import('@/lib/nios/validators/types').RepairRecord[] = [];
  let appliedCount = 0;

  for (const r of repairers) {
    if (appliedCount >= maxRepairs) break;
    if (!r.canRepair(current, initial.issues)) continue;

    let applied: { noticia: Noticia; records: import('@/lib/nios/validators/types').RepairRecord[] } | null = null;
    try {
      applied = r.apply(current);
    } catch {
      continue;
    }
    if (!applied) continue;

    const changed = getChangedFields(current, applied.noticia);
    const repairerFields = r.allowedFields ?? [r.field];
    if (!isAllowed(changed, allowedFields)) continue;
    if (!changed.every((f) => repairerFields.includes(f))) continue;

    records.push(...applied.records);
    current = deepClone(applied.noticia);
    appliedCount += 1;
  }

  return { noticia: current, records };
}

/**
 * Ejecución completa del ReaderExperienceEngine.
 * Determinista, auditable y reversible.
 */
export function runReaderExperienceEngine(
  noticia: Noticia,
  config?: ReaderExperienceEngineConfig,
): EngineResult {
  const startedAt = now();
  const audit: EngineResult['audit'] = { startedAt, completedAt: startedAt, steps: [] };
  const original = deepClone(noticia);

  logStep(audit, 'validate', { stage: 'initial' });
  const initial = validateArticle(original);

  if (initial.valid) {
    logStep(audit, 'commit', { reason: 'already valid' });
    const completedAt = now();
    return {
      status: 'no_changes',
      original,
      final: original,
      initial,
      detections: [],
      repair: { applied: false, records: [] },
      post: initial,
      changes: {},
      audit: { ...audit, completedAt },
    };
  }

  const detections = detect(original, config);
  logStep(audit, 'detect', { detectionCount: detections.length });

  if (!detections.some((d) => d.proposedRepair)) {
    logStep(audit, 'rollback', { reason: 'no safe repair available' });
    const completedAt = now();
    return {
      status: 'blocked',
      original,
      final: original,
      initial,
      detections,
      repair: { applied: false, records: [] },
      post: initial,
      changes: {},
      audit: { ...audit, completedAt },
    };
  }

  const { noticia: repaired, records } = applyRepairs(original, initial, config);
  logStep(audit, 'repair', { recordCount: records.length });

  logStep(audit, 'validate_again', { stage: 'post' });
  const post = validateArticle(repaired);

  const changed = getChangedFields(original, repaired);
  const { final, status } = commitOrRollback(original, repaired, post, audit, changed);

  const changes: Record<string, { before: unknown; after: unknown }> = {};
  for (const f of changed) {
    changes[f] = {
      before: (original as unknown as Record<string, unknown>)[f],
      after: (repaired as unknown as Record<string, unknown>)[f],
    };
  }

  const completedAt = now();
  return {
    status,
    original,
    final,
    initial,
    detections,
    repair: { applied: records.length > 0, records },
    post,
    changes,
    audit: { ...audit, completedAt },
  };
}

/**
 * Reparador de puntos clave.
 * Utiliza repairPuntosClave congelado (solo oraciones originales, rollback).
 */
export const puntosClaveRepairer: Repairer = {
  name: 'puntosClave',
  rule: 'PK_TRUNCATED',
  field: 'puntosClave',
  canRepair: (noticia, issues) =>
    (noticia.puntosClave ?? []).length > 0 &&
    issues.some((i) => i.field === 'puntosClave' && i.code.startsWith('PK')),
  propose: (noticia) => {
    const repair = repairPuntosClave(noticia);
    return {
      repairer: 'puntosClave',
      rule: 'PK_TRUNCATED',
      field: 'puntosClave',
      reason: 'Reconstruir puntos clave con oraciones completas del contenido original',
      before: noticia.puntosClave ?? [],
      after: repair.puntosClave,
    };
  },
  apply: (noticia) => {
    const repair = repairPuntosClave(noticia);
    return {
      noticia: { ...noticia, puntosClave: repair.puntosClave ?? undefined },
      records: repair.records,
    };
  },
};
