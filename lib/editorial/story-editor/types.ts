/**
 * Story Editor — Tipos canónicos
 * ==============================
 * Después de investigar, determina el verdadero hecho noticioso.
 * No "hace bonito el texto". Encuentra el ángulo.
 */

export type EditorialVerdict = 'PUBLICAR' | 'MEJORAR' | 'INVESTIGAR' | 'ACTUALIZAR' | 'NO_PUBLICAR' | 'ARCHIVAR';

export interface StoryProposal {
  verdict: EditorialVerdict;
  reason: string;
  focusAngle: string;
  suggestedTitle: string;
  alternativeTitles: string[];
  suggestedSummary: string;
  suggestedBody: string;
  context: string;
  keyData: string[];
  sources: string[];
  questionsAnswered: string[];
  readerSatisfaction: {
    understandsWhatHappened: boolean;
    understandsWhyItMatters: boolean;
    understandsWhere: boolean;
    understandsWhen: boolean;
    knowsWhoConfirmed: boolean;
    hasNecessaryContext: boolean;
    score: number;
    improvements: string[];
  };
  seo: {
    title: string;
    metaDescription: string;
    slug: string;
    keywords: string[];
    entities: string[];
    searchIntent: string;
  };
  distribution: {
    social: string;
    telegram: string;
  };
}

export interface StoryEditorInput {
  research: import('@/lib/research/types').ResearchResult;
  rawInput: {
    titulo: string;
    resumen?: string;
    contenido: string;
    categoria?: string;
  };
}
