// @vitest-environment node
import { test, expect, describe } from 'vitest';
import { runStoryEditor } from '@/lib/editorial/story-editor';
import type { ResearchResult } from '@/lib/research/types';

function mockResearch(overrides: Partial<ResearchResult> = {}): ResearchResult {
  return {
    researchStartedAt: new Date().toISOString(),
    researchCompletedAt: new Date().toISOString(),
    modelVersion: 'test',
    rawInput: 'test',
    summary: 'Investigación de prueba',
    factsFound: [
      { claim: 'Juan Pérez fue encontrado sin vida', status: 'CONFIRMED', sources: [{ name: 'Policía Nacional', level: 'PRIMARY' }], confidence: 0.9 },
    ],
    sourcesChecked: [{ name: 'Policía Nacional', level: 'PRIMARY' }],
    sourcesAccepted: [{ name: 'Policía Nacional', level: 'PRIMARY' }],
    sourcesRejected: [],
    conflictsFound: [],
    missingInformation: [],
    additionalContext: ['Juan Pérez llevaba 3 días desaparecido'],
    hasNewInformation: false,
    changesOriginalFocus: false,
    recommendedAction: 'PROCEED',
    reason: 'Información confirmada',
    ...overrides,
  };
}

describe('Story Editor — Tests reales', () => {
  test('Debe retornar estructura válida con verdict', async () => {
    const result = await runStoryEditor({
      research: mockResearch(),
      rawInput: {
        titulo: 'Hallan cuerpo muerto de Juan Pérez',
        contenido: 'Hallan cuerpo de Juan Pérez.',
        categoria: 'Sucesos',
      },
    });

    expect(result).toBeDefined();
    expect(['PUBLICAR', 'MEJORAR', 'INVESTIGAR', 'ACTUALIZAR', 'NO_PUBLICAR', 'ARCHIVAR']).toContain(result.verdict);
    expect(result.reason).toBeDefined();
    expect(result.focusAngle).toBeDefined();
    expect(result.suggestedTitle).toBeDefined();
    expect(result.readerSatisfaction).toBeDefined();
    expect(typeof result.readerSatisfaction.score).toBe('number');
    expect(result.seo).toBeDefined();
    expect(result.distribution).toBeDefined();
  });

  test('Con conflictos no resueltos, no debe recomendar PUBLICAR', async () => {
    const result = await runStoryEditor({
      research: mockResearch({
        conflictsFound: [{
          topic: 'Número de fallecidos',
          versionA: { claim: '2 fallecidos', source: { name: 'Medio A', level: 'MEDIA' } },
          versionB: { claim: '4 fallecidos', source: { name: 'Medio B', level: 'MEDIA' } },
          recommendation: 'Esperar confirmación oficial',
        }],
        recommendedAction: 'INVESTIGATE_MORE',
      }),
      rawInput: {
        titulo: 'Accidente deja varios fallecidos',
        contenido: 'Accidente con víctimas.',
        categoria: 'Sucesos',
      },
    });

    // Con conflicto, el verdict debe ser INVESTIGAR o NO_PUBLICAR (si LLM disponible) o fallback
    expect(['INVESTIGAR', 'NO_PUBLICAR', 'MEJORAR']).toContain(result.verdict);
  });

  test('Con información insuficiente, debe recomendar INVESTIGAR o NO_PUBLICAR', async () => {
    const result = await runStoryEditor({
      research: mockResearch({
        factsFound: [],
        missingInformation: [
          { question: 'Quién es la víctima?', importance: 'HIGH', why: 'Sin identificar no hay noticia' },
        ],
        recommendedAction: 'INVESTIGATE_MORE',
      }),
      rawInput: {
        titulo: 'Hallan cuerpo muerto',
        contenido: 'Ayer hallaron un cuerpo.',
        categoria: 'Sucesos',
      },
    });

    expect(['INVESTIGAR', 'NO_PUBLICAR']).toContain(result.verdict);
  });
});
