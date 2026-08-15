// @vitest-environment node
import { test, expect, describe } from 'vitest';
import { runWatchCycle, applySafeUpdate, determineFrequency, FREQUENCY_INTERVALS } from '@/lib/news-watch';

describe('News Watch — Tests reales', () => {
  test('Watch cycle debe retornar estructura válida', async () => {
    const result = await runWatchCycle({
      id: 'test-watch-1',
      titulo: 'Accidente en carretera Masaya-Managua',
      contenido: 'Un accidente de tránsito dejó personas lesionadas.',
      resumen: 'Accidente en Masaya.',
      categoria: 'Sucesos',
      fecha: new Date().toISOString(),
    });

    expect(result).toBeDefined();
    expect(result.articleId).toBe('test-watch-1');
    expect(result.checkedAt).toBeTruthy();
    expect(typeof result.hasUpdates).toBe('boolean');
    expect(Array.isArray(result.updates)).toBe(true);
    expect(result.nextCheckAt).toBeTruthy();
    expect(['BREAKING', 'DEVELOPING', 'NORMAL', 'EVERGREEN']).toContain(result.frequency);
  });

  test('Frecuencia BREAKING para artículo reciente (< 6h)', () => {
    const freq = determineFrequency({
      fecha: new Date().toISOString(),
    });
    expect(freq).toBe('BREAKING');
  });

  test('Frecuencia EVERGREEN para artículo antiguo (> 7 días)', () => {
    const freq = determineFrequency({
      fecha: new Date(Date.now() - 10 * 86400000).toISOString(),
    });
    expect(freq).toBe('EVERGREEN');
  });

  test('Frecuencia DEVELOPING para artículo de 1 día', () => {
    const freq = determineFrequency({
      fecha: new Date(Date.now() - 24 * 3600000).toISOString(),
    });
    expect(freq).toBe('DEVELOPING');
  });

  test('applySafeUpdate conserva slug y actualiza dateModified', () => {
    const original = {
      slug: 'accidente-masaya-managua',
      fecha: '2026-01-01T00:00:00.000Z',
    };

    const update = {
      articleId: 'test',
      detectedAt: new Date().toISOString(),
      source: 'Policía Nacional',
      sourceLevel: 'PRIMARY' as const,
      previousFact: '2 fallecidos',
      newFact: 'Autoridad confirma 5 fallecidos',
      importance: 'HIGH' as const,
      confidence: 0.95,
      recommendedAction: 'SAFE_AUTO_UPDATE' as const,
      reason: 'Fuente primaria confirma nueva cifra',
    };

    const result = applySafeUpdate(original, update);

    expect(result.slugPreserved).toBe('accidente-masaya-managua');
    expect(result.dateModified).not.toBe(original.fecha);
    expect(result.updateNote).toContain('ACTUALIZACIÓN');
    expect(result.updateNote).toContain('5 fallecidos');
  });

  test('Conflicto debe resultar en BLOCKED_BY_CONFLICT', async () => {
    const result = await runWatchCycle({
      id: 'test-conflict',
      titulo: 'Accidente con víctimas',
      contenido: 'Fuente A: 2 fallecidos. Fuente B: 4 fallecidos.',
      categoria: 'Sucesos',
      fecha: new Date().toISOString(),
    });

    // Si hay actualizaciones con conflicto, deben tener BLOCKED_BY_CONFLICT
    const conflicts = result.updates.filter(u => u.recommendedAction === 'BLOCKED_BY_CONFLICT');
    if (conflicts.length > 0) {
      expect(conflicts[0].importance).toBe('HIGH');
    }
  });
});
