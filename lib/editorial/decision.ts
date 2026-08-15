/**
 * Editorial Decision — ONE SOURCE OF TRUTH
 * =========================================
 * La decisión editorial canónica existe una sola vez.
 * Después de la decisión, NINGÚN módulo puede volver a clasificar la noticia.
 *
 * Homepage: LEE.
 * Categoría: LEE.
 * Artículo: LEE.
 * SEO: LEE.
 * Sitemap: LEE.
 * NIOS: LEE.
 */

import type { PublicCategory } from '@/lib/types';
import type { MeniContentProfile } from '@/lib/meni/profile-detector';
import type { ResearchResult } from '@/lib/research/types';
import type { StoryProposal } from '@/lib/editorial/story-editor/types';

export type EditorialState =
  | 'DRAFT'
  | 'RESEARCHING'
  | 'RESEARCHED'
  | 'STORY_PROPOSED'
  | 'VALIDATED'
  | 'PUBLISHED'
  | 'WATCHING'
  | 'UPDATE_DETECTED'
  | 'UPDATED'
  | 'STABILIZED'
  | 'ARCHIVED';

export interface EditorialDecision {
  /** ID único de la decisión */
  decisionId: string;
  /** Timestamp de la decisión */
  timestamp: string;
  /** Estado del ciclo de vida */
  state: EditorialState;
  /** Resultado de la investigación */
  research?: ResearchResult;
  /** Propuesta del Story Editor */
  story?: StoryProposal;
  /** Categoría pública canónica — única fuente de verdad */
  publicCategory: PublicCategory;
  /** Perfil interno detectado por MENI */
  profileInternal: MeniContentProfile;
  /** Score MENI (validación, no investigación) */
  scoreMeni: number | null;
  /** Aprobado por MENI */
  aprobadoMeni: boolean;
  /** Confianza de la decisión */
  confidence: number;
  /** Razón de la decisión */
  reason: string;
  /** Fuente de la verdad */
  sourceOfTruth: 'research+story+meni' | 'meni_only' | 'manual';
  /** Versión del modelo de decisión */
  modelVersion: string;
}

export const DECISION_MODEL_VERSION = 'editorial-decision-v1.0';

/**
 * Construye la decisión editorial canónica a partir de research + story + MENI.
 */
export function buildEditorialDecision(params: {
  publicCategory: PublicCategory;
  profileInternal: MeniContentProfile;
  scoreMeni: number | null;
  aprobadoMeni: boolean;
  research?: ResearchResult;
  story?: StoryProposal;
  reason?: string;
}): EditorialDecision {
  const confidence = computeConfidence(params);
  const state = computeState(params);

  return {
    decisionId: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    state,
    research: params.research,
    story: params.story,
    publicCategory: params.publicCategory,
    profileInternal: params.profileInternal,
    scoreMeni: params.scoreMeni,
    aprobadoMeni: params.aprobadoMeni,
    confidence,
    reason: params.reason || params.story?.reason || params.research?.reason || '',
    sourceOfTruth: params.research && params.story ? 'research+story+meni' : 'meni_only',
    modelVersion: DECISION_MODEL_VERSION,
  };
}

function computeConfidence(params: {
  research?: ResearchResult;
  story?: StoryProposal;
  scoreMeni: number | null;
  aprobadoMeni: boolean;
}): number {
  let conf = 0;
  if (params.research) {
    const confirmedFacts = params.research.factsFound.filter(f => f.status === 'CONFIRMED').length;
    conf += Math.min(0.4, confirmedFacts * 0.1);
    if (params.research.conflictsFound.length === 0) conf += 0.1;
  }
  if (params.story) {
    conf += Math.min(0.3, (params.story.readerSatisfaction.score || 0) / 300);
  }
  if (params.aprobadoMeni && params.scoreMeni !== null) {
    conf += Math.min(0.2, (params.scoreMeni - 70) / 150);
  }
  return Math.max(0, Math.min(1, conf));
}

function computeState(params: {
  research?: ResearchResult;
  story?: StoryProposal;
  aprobadoMeni: boolean;
}): EditorialState {
  if (!params.research) return 'DRAFT';
  if (!params.story) return 'RESEARCHED';
  if (params.story.verdict === 'NO_PUBLICAR') return 'ARCHIVED';
  if (params.story.verdict === 'INVESTIGAR') return 'RESEARCHED';
  if (params.aprobadoMeni) return 'VALIDATED';
  return 'STORY_PROPOSED';
}
