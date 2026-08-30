/**
 * NIOS CEO Decision Engine
 * ========================
 * Convierte cada diagnóstico en una decisión operativa explícita.
 *
 * Decisiones posibles:
 *   NO_ACTION        → no hay acción segura o no existe evidencia.
 *   AUTO_EXECUTE     → acción segura, verificable y sin intervención humana.
 *   QUEUE_FOR_HUMAN  → requiere aprobación o acción de un humano.
 *   BLOCKED          → dependencia externa (credenciales, permisos) bloquea.
 *
 * Cada decisión incluye factores: impact, confidence, effort, risk, urgency.
 * Prioridad = impact × confidence × urgency / (effort + 1) × (1 − risk).
 */

import type { NiosDiagnostic } from './intelligence/diagnostics';
import type { NiosDataStatus } from './intelligence/types';

export type CeoDecisionType = 'NO_ACTION' | 'AUTO_EXECUTE' | 'QUEUE_FOR_HUMAN' | 'BLOCKED';

export interface CeoDecisionFactors {
  impact: number; // 0-1
  confidence: number; // 0-1
  effort: number; // 1-5
  risk: number; // 0-1
  urgency: number; // 0-1
}

export interface CeoDecision {
  id: string;
  source: string;
  problem: string;
  decision: CeoDecisionType;
  priority: number;
  factors: CeoDecisionFactors;
  reason: string;
  expectedResult: string;
}

const BLOCKED_STATUSES: NiosDataStatus[] = [
  'ACCESS_BLOCKED',
  'CONFIG_REQUIRED',
  'INVALID_CONFIGURATION',
  'DATA_CONFLICT',
];

function impactForSeverity(severity: NiosDiagnostic['severity']): number {
  switch (severity) {
    case 'critical':
      return 1.0;
    case 'high':
      return 0.8;
    case 'medium':
      return 0.5;
    case 'low':
      return 0.3;
    default:
      return 0.1;
  }
}

function urgencyForSeverity(severity: NiosDiagnostic['severity'], dataAgeHours: number | null): number {
  let base: number;
  switch (severity) {
    case 'critical':
      base = 1.0;
      break;
    case 'high':
      base = 0.9;
      break;
    case 'medium':
      base = 0.6;
      break;
    case 'low':
      base = 0.3;
      break;
    default:
      base = 0.1;
  }
  if (dataAgeHours !== null && dataAgeHours > 24) {
    base = Math.min(1, base + 0.2);
  }
  return base;
}

function confidenceForStatus(status: NiosDataStatus, confidence: number): number {
  if (status === 'REAL') return 1.0;
  if (status === 'NOT_CONFIGURED') return 0.5;
  if (BLOCKED_STATUSES.includes(status)) return 0.2;
  return confidence / 100;
}

function decisionTypeFor(diagnostic: NiosDiagnostic, noticiasCount: number): CeoDecisionType {
  if (diagnostic.autoFixAvailable && !diagnostic.requiresHuman) {
    // Si no hay artículos canónicos, no tiene sentido "reconstruir" un snapshot vacío.
    if (diagnostic.id === 'nios-snapshot-inconsistent' && noticiasCount === 0) {
      return 'NO_ACTION';
    }
    return 'AUTO_EXECUTE';
  }

  if (diagnostic.requiresHuman) {
    return BLOCKED_STATUSES.includes(diagnostic.status) ? 'BLOCKED' : 'QUEUE_FOR_HUMAN';
  }

  if (diagnostic.status === 'REAL') return 'NO_ACTION';

  return 'NO_ACTION';
}

function riskFor(type: CeoDecisionType, actionId: string): number {
  if (type === 'NO_ACTION') return 0.0;
  if (type === 'BLOCKED') return 0.9;
  if (type === 'QUEUE_FOR_HUMAN') return 0.5;
  if (actionId === 'nios-cache-refresh') return 0.05;
  if (actionId === 'nios-snapshot-inconsistent') return 0.2;
  return 0.3;
}

function effortFor(type: CeoDecisionType): number {
  if (type === 'NO_ACTION') return 0.1;
  if (type === 'AUTO_EXECUTE') return 1;
  if (type === 'QUEUE_FOR_HUMAN') return 3;
  return 5;
}

export function decide(diagnostic: NiosDiagnostic, context?: { noticiasCount?: number }): CeoDecision {
  const noticiasCount = context?.noticiasCount ?? 0;
  const decision = decisionTypeFor(diagnostic, noticiasCount);
  const impact = impactForSeverity(diagnostic.severity);
  const urgency = urgencyForSeverity(diagnostic.severity, diagnostic.dataAgeHours ?? null);
  const confidence = confidenceForStatus(diagnostic.status, diagnostic.confidence);
  const effort = effortFor(decision);
  const risk = riskFor(decision, diagnostic.id);

  const raw = (impact * confidence * urgency) / (effort + 1) * (1 - risk);
  const priority = decision === 'NO_ACTION' ? 0 : Math.round(raw * 10000) / 10000;

  let reason: string;
  switch (decision) {
    case 'AUTO_EXECUTE':
      reason = `Acción segura y verificable: ${diagnostic.recommendedAction}`;
      break;
    case 'QUEUE_FOR_HUMAN':
      reason = `Requiere aprobación humana: ${diagnostic.recommendedAction}`;
      break;
    case 'BLOCKED':
      reason = `Dependencia externa bloqueada (${diagnostic.status})${
        diagnostic.variable ? `: ${diagnostic.variable}` : ''
      }${diagnostic.account ? `: ${diagnostic.account}` : ''}`;
      break;
    default:
      reason = `No hay acción automática segura: ${diagnostic.cause}`;
  }

  return {
    id: diagnostic.id,
    source: diagnostic.source,
    problem: diagnostic.problem,
    decision,
    priority,
    factors: { impact, confidence, effort, risk, urgency },
    reason,
    expectedResult: diagnostic.expectedResult,
  };
}
