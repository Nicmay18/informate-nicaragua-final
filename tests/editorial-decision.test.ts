// @vitest-environment node
import { test, expect, describe } from 'vitest';
import { buildEditorialDecision, DECISION_MODEL_VERSION } from '@/lib/editorial/decision';
import type { ResearchResult } from '@/lib/research/types';
import type { StoryProposal } from '@/lib/editorial/story-editor/types';

function mockResearch(): ResearchResult {
  return {
    researchStartedAt: new Date().toISOString(),
    researchCompletedAt: new Date().toISOString(),
    modelVersion: 'test',
    rawInput: 'test',
    summary: 'Investigación completa',
    factsFound: [
      { claim: 'Hecho confirmado', status: 'CONFIRMED', sources: [{ name: 'Policía', level: 'PRIMARY' }], confidence: 0.9 },
    ],
    sourcesChecked: [],
    sourcesAccepted: [],
    sourcesRejected: [],
    conflictsFound: [],
    missingInformation: [],
    additionalContext: [],
    hasNewInformation: false,
    changesOriginalFocus: false,
    recommendedAction: 'PROCEED',
    reason: 'OK',
  };
}

function mockStory(): StoryProposal {
  return {
    verdict: 'PUBLICAR',
    reason: 'Noticia completa',
    focusAngle: 'Ángulo correcto',
    suggestedTitle: 'Título',
    alternativeTitles: [],
    suggestedSummary: 'Resumen',
    suggestedBody: '<p>Cuerpo</p>',
    context: 'Contexto',
    keyData: ['dato1'],
    sources: ['Policía'],
    questionsAnswered: ['¿Qué pasó?'],
    readerSatisfaction: {
      understandsWhatHappened: true,
      understandsWhyItMatters: true,
      understandsWhere: true,
      understandsWhen: true,
      knowsWhoConfirmed: true,
      hasNecessaryContext: true,
      score: 90,
      improvements: [],
    },
    seo: { title: 'T', metaDescription: 'M', slug: 's', keywords: [], entities: [], searchIntent: 'info' },
    distribution: { social: 'S', telegram: 'T' },
  };
}

describe('Editorial Decision — One Source of Truth', () => {
  test('Debe construir decisión con research + story + MENI', () => {
    const decision = buildEditorialDecision({
      publicCategory: 'Sucesos',
      profileInternal: 'sucesos',
      scoreMeni: 88,
      aprobadoMeni: true,
      research: mockResearch(),
      story: mockStory(),
    });

    expect(decision.decisionId).toMatch(/^dec_/);
    expect(decision.modelVersion).toBe(DECISION_MODEL_VERSION);
    expect(decision.publicCategory).toBe('Sucesos');
    expect(decision.profileInternal).toBe('sucesos');
    expect(decision.scoreMeni).toBe(88);
    expect(decision.aprobadoMeni).toBe(true);
    expect(decision.sourceOfTruth).toBe('research+story+meni');
    expect(decision.state).toBe('VALIDATED');
    expect(decision.confidence).toBeGreaterThan(0);
  });

  test('Sin research ni story, sourceOfTruth debe ser meni_only', () => {
    const decision = buildEditorialDecision({
      publicCategory: 'Nacionales',
      profileInternal: 'nacionales',
      scoreMeni: 75,
      aprobadoMeni: true,
    });

    expect(decision.sourceOfTruth).toBe('meni_only');
    expect(decision.state).toBe('DRAFT');
  });

  test('Verdict NO_PUBLICAR debe resultar en estado ARCHIVED', () => {
    const decision = buildEditorialDecision({
      publicCategory: 'Sucesos',
      profileInternal: 'sucesos',
      scoreMeni: 50,
      aprobadoMeni: false,
      research: mockResearch(),
      story: { ...mockStory(), verdict: 'NO_PUBLICAR' },
    });

    expect(decision.state).toBe('ARCHIVED');
  });

  test('Confianza debe estar entre 0 y 1', () => {
    const decision = buildEditorialDecision({
      publicCategory: 'Sucesos',
      profileInternal: 'sucesos',
      scoreMeni: 100,
      aprobadoMeni: true,
      research: mockResearch(),
      story: mockStory(),
    });

    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
  });
});
