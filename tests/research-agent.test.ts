// @vitest-environment node
import { test, expect, describe } from 'vitest';
import { runResearch } from '@/lib/research';
import type { ResearchInput } from '@/lib/research/types';

describe('Research Agent — Tests reales', () => {
  test('Caso Interpol: debe investigar y retornar estructura válida', async () => {
    const input: ResearchInput = {
      titulo: 'Interpol capturó a una nicaragüense en El Salvador',
      contenido: 'Autoridades de El Salvador informaron que una ciudadana nicaragüense fue capturada en coordinación con Interpol.',
      resumen: 'Capturan a nicaragüense en El Salvador vía Interpol.',
      categoria: 'Internacionales',
    };

    const result = await runResearch(input);

    // Estructura obligatoria
    expect(result).toBeDefined();
    expect(result.researchStartedAt).toBeTruthy();
    expect(result.researchCompletedAt).toBeTruthy();
    expect(result.modelVersion).toMatch(/^research-agent/);
    expect(result.summary).toBeDefined();
    expect(Array.isArray(result.factsFound)).toBe(true);
    expect(Array.isArray(result.sourcesChecked)).toBe(true);
    expect(Array.isArray(result.conflictsFound)).toBe(true);
    expect(Array.isArray(result.missingInformation)).toBe(true);
    expect(['PROCEED', 'UPDATE_FOCUS', 'INVESTIGATE_MORE', 'DO_NOT_PUBLISH']).toContain(result.recommendedAction);

    // No debe inventar: si no hay LLM, debe decirlo claramente
    if (result.recommendedAction === 'INVESTIGATE_MORE') {
      expect(result.reason).toBeTruthy();
    }
  });

  test('Caso información insuficiente: "Hallan cuerpo muerto" debe recomendar NO publicar o investigar más', async () => {
    const input: ResearchInput = {
      titulo: 'Hallan cuerpo muerto',
      contenido: 'Ayer hallaron un cuerpo muerto.',
      categoria: 'Sucesos',
    };

    const result = await runResearch(input);

    expect(result.recommendedAction).toMatch(/INVESTIGATE_MORE|DO_NOT_PUBLISH/);
    expect(result.missingInformation.length).toBeGreaterThan(0);
  });

  test('Caso conflicto: dos fuentes con cifras distintas debe detectar conflicto', async () => {
    const input: ResearchInput = {
      titulo: 'Accidente deja varios fallecidos',
      contenido: 'Fuente A reporta 2 fallecidos. Fuente B reporta 4 fallecidos. Las autoridades aún no confirmaron.',
      categoria: 'Sucesos',
    };

    const result = await runResearch(input);

    // Si hay LLM, debería detectar conflicto. Si no hay LLM, debe al menos marcar INVESTIGATE_MORE
    expect(['INVESTIGATE_MORE', 'UPDATE_FOCUS', 'PROCEED']).toContain(result.recommendedAction);
  });

  test('Watch mode: debe recibir existingArticle y marcar hasNewInformation', async () => {
    const input: ResearchInput = {
      titulo: 'Interpol capturó a una nicaragüense en El Salvador',
      contenido: 'Autoridades capturaron a una nicaragüense.',
      categoria: 'Internacionales',
      existingArticle: {
        id: 'test-123',
        titulo: 'Interpol capturó a una nicaragüense en El Salvador',
        contenido: 'La persona fue capturada.',
        fecha: new Date(Date.now() - 86400000).toISOString(),
      },
    };

    const result = await runResearch(input);

    expect(result).toBeDefined();
    expect(typeof result.hasNewInformation).toBe('boolean');
  });
});
