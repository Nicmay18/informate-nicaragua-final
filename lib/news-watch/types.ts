/**
 * News Watch — Tipos canónicos
 * ============================
 * Una noticia publicada NO queda muerta.
 * Entra en estado WATCHING y puede evolucionar.
 */

export type WatchFrequency = 'BREAKING' | 'DEVELOPING' | 'NORMAL' | 'EVERGREEN';
export type UpdateAction = 'SAFE_AUTO_UPDATE' | 'EDITOR_REVIEW_REQUIRED' | 'BLOCKED_BY_CONFLICT';
export type UpdateImportance = 'HIGH' | 'MEDIUM' | 'LOW';

export interface WatchConfig {
  frequency: WatchFrequency;
  intervalMinutes: number;
  maxChecks: number;
  enabled: boolean;
}

export interface UpdateDetected {
  articleId: string;
  detectedAt: string;
  source: string;
  sourceLevel: 'PRIMARY' | 'MEDIA' | 'SECONDARY' | 'SOCIAL';
  previousFact: string;
  newFact: string;
  importance: UpdateImportance;
  confidence: number;
  recommendedAction: UpdateAction;
  reason: string;
}

export interface WatchResult {
  articleId: string;
  checkedAt: string;
  hasUpdates: boolean;
  updates: UpdateDetected[];
  nextCheckAt: string;
  frequency: WatchFrequency;
  watchStatus: 'active' | 'paused' | 'stabilized';
}

export interface TimelineEntry {
  timestamp: string;
  fact: string;
  source: string;
  sourceLevel: 'PRIMARY' | 'MEDIA' | 'SECONDARY' | 'SOCIAL';
}

export interface ArticleLifecycle {
  articleId: string;
  state: 'NACIMIENTO' | 'INVESTIGACION' | 'PUBLICACION' | 'MONITOREO' | 'ACTUALIZACION' | 'NUEVA_INVESTIGACION' | 'ESTABILIZACION' | 'ARCHIVO';
  timeline: TimelineEntry[];
  datePublished: string;
  dateModified: string;
  updateCount: number;
  watchConfig: WatchConfig;
}
