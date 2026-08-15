/**
 * Research Agent — Tipos canónicos
 * =================================
 * La investigación ocurre ANTES de redactar.
 * No inventa datos. No inventa fuentes.
 */

export type SourceLevel = 'PRIMARY' | 'MEDIA' | 'SECONDARY' | 'SOCIAL';
export type FactStatus = 'CONFIRMED' | 'REPORTED' | 'UNVERIFIED' | 'CONFLICTING' | 'OUTDATED';

export interface ResearchSource {
  name: string;
  level: SourceLevel;
  url?: string;
  snippet?: string;
  date?: string;
}

export interface ResearchFact {
  claim: string;
  status: FactStatus;
  sources: ResearchSource[];
  confidence: number;
}

export interface ResearchConflict {
  topic: string;
  versionA: { claim: string; source: ResearchSource };
  versionB: { claim: string; source: ResearchSource };
  recommendation: string;
}

export interface MissingInformation {
  question: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  why: string;
}

export interface ResearchResult {
  researchStartedAt: string;
  researchCompletedAt: string;
  modelVersion: string;
  rawInput: string;
  summary: string;
  factsFound: ResearchFact[];
  sourcesChecked: ResearchSource[];
  sourcesAccepted: ResearchSource[];
  sourcesRejected: ResearchSource[];
  conflictsFound: ResearchConflict[];
  missingInformation: MissingInformation[];
  additionalContext: string[];
  hasNewInformation: boolean;
  newInformationSummary?: string;
  changesOriginalFocus: boolean;
  recommendedAction: 'PROCEED' | 'UPDATE_FOCUS' | 'INVESTIGATE_MORE' | 'DO_NOT_PUBLISH';
  reason: string;
}

export interface ResearchInput {
  titulo: string;
  resumen?: string;
  contenido: string;
  categoria?: string;
  /** Si es watch, el artículo publicado original */
  existingArticle?: {
    id: string;
    titulo: string;
    contenido: string;
    fecha: string;
  };
}
