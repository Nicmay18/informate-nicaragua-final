import { logger } from '@/lib/logger';
import type { NiosModuleReport, NiosPriority, NiosRecommendation, NiosStatus } from './types';

const PRIORITY_SCORE: Record<NiosPriority, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export function uuid(prefix = ''): string {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function daysAgo(dateString?: string | Date): number {
  if (!dateString) return 0;
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export function rec(
  title: string,
  description: string,
  priority: NiosPriority,
  action: string,
  module: string,
  impact?: string
): NiosRecommendation {
  return { id: uuid(`${module}-`), title, description, priority, action, module, impact };
}

export function sortByPriority(recommendations: NiosRecommendation[]): NiosRecommendation[] {
  return [...recommendations].sort((a, b) => PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority]);
}

export function emptyModule(module: string, summary: string, status: NiosStatus = 'ok'): NiosModuleReport {
  return { module, status, summary, metrics: [], recommendations: [] };
}

export function trackError(ctx: string, err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  logger.error(`[nios:${ctx}]`, msg);
  return msg;
}
