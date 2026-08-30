/**
 * NIOS CEO Learning
 * ==================
 * Aprendizaje operativo: resultados pasados afectan el peso de decisiones futuras.
 *
 * No inventa aprendizaje. Solo lee registros pasados de nios_memory y calcula
 * un factor de ajuste para decisiones similares.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { CeoDecisionInput } from './ceo-action-registry';

export interface CeoLearningPattern {
  id: string;
  domain: string;
  actionId: string;
  problemFingerprint: string;
  impact: 'positive' | 'negative' | 'neutral' | 'failed';
  confidence: number;
  timestamp: string;
}

function classifyImpact(impact: string): CeoLearningPattern['impact'] {
  const s = (impact || '').toLowerCase();
  if (s.includes('failed')) return 'failed';
  if (s.includes('no impact') || s.includes('sin impacto') || s.includes('nulo')) return 'neutral';
  if (s.includes('negativo') || s.includes('baj')) return 'negative';
  return 'positive';
}

function normalizeFingerprint(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .sort()
    .join(' ');
}

export function extractPatternsFromCeoMemory(doc: Record<string, unknown>): CeoLearningPattern[] {
  const learnings = Array.isArray(doc.learnings) ? (doc.learnings as Record<string, unknown>[]) : [];
  const sourceId = String(doc.id || '');
  const patterns: CeoLearningPattern[] = [];

  for (const l of learnings) {
    const problem = String(l.problem || l.decisionId || '');
    const decision = String(l.decision || '');
    const impactRaw = String(l.impact || '');
    const confidence = typeof l.confidence === 'number' ? l.confidence : 0.5;
    if (!problem || !decision) continue;

    patterns.push({
      id: `learn-${sourceId}-${problem.slice(0, 20)}`,
      domain: String(l.decisionId || 'unknown').split('-')[0] || 'unknown',
      actionId: decision,
      problemFingerprint: normalizeFingerprint(problem),
      impact: classifyImpact(impactRaw),
      confidence: Math.max(0, Math.min(1, confidence)),
      timestamp: String(l.timestamp || doc.timestamp || new Date().toISOString()),
    });
  }

  return patterns;
}

export async function loadCeoLearningPatterns(db: Firestore, limit = 100): Promise<CeoLearningPattern[]> {
  // Avoid composite-index requirement: filter by kind, then sort in memory.
  const snap = await db
    .collection('nios_memory')
    .where('kind', '==', 'ceo_loop')
    .get();

  const docs = snap.docs
    .map((d) => d.data() as Record<string, unknown>)
    .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')))
    .slice(0, limit);

  const patterns: CeoLearningPattern[] = [];
  for (const d of docs) {
    patterns.push(...extractPatternsFromCeoMemory(d));
  }
  return patterns;
}

function inputFingerprint(input: CeoDecisionInput): string {
  const evidence = input.evidence.join(' ');
  const meta = Object.values(input.metadata ?? {})
    .filter((v) => typeof v === 'string' || typeof v === 'number')
    .join(' ');
  return normalizeFingerprint(`${input.domain} ${input.reason} ${evidence} ${meta}`);
}

function similarity(a: string, b: string): number {
  const sa = new Set(a.split(/\s+/).filter(Boolean));
  const sb = new Set(b.split(/\s+/).filter(Boolean));
  if (sa.size === 0 || sb.size === 0) return 0;
  const shared = [...sa].filter((x) => sb.has(x)).length;
  return shared / Math.max(sa.size, sb.size);
}

export function calculateLearningBoost(input: CeoDecisionInput, patterns: CeoLearningPattern[]): number {
  if (patterns.length === 0) return 1;

  const fp = inputFingerprint(input);
  let boost = 0;
  let matches = 0;

  for (const p of patterns) {
    const sameAction = input.suggestedActionId === p.actionId;
    const sameDomain = input.domain === p.domain;
    const sim = similarity(fp, p.problemFingerprint);
    if (!sameAction && !sameDomain && sim < 0.25) continue;

    matches++;
    const weight = (sameAction ? 0.5 : 0) + (sameDomain ? 0.25 : 0) + sim * 0.25;
    const direction = p.impact === 'positive' ? 1 : p.impact === 'negative' ? -1 : 0;
    boost += direction * p.confidence * weight;
  }

  if (matches === 0) return 1;
  const averageBoost = boost / matches;
  // Cap boost between 0.5 (reduce) and 1.5 (increase)
  return Math.max(0.5, Math.min(1.5, 1 + averageBoost));
}
