/**
 * Regresión — Métricas diarias de regeneraciones/costos (rama measure/regen-counters)
 * ============================================================================
 * La instrumentación de costos NUNCA debe romper el render: trackRegen es
 * fail-open. Estos tests fijan que (a) no lanza cuando Firestore falla y
 * (b) escribe un único doc diario con increments anidados.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  set: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => ({ collection: mocks.collection }),
}));

import { trackRegen } from '@/lib/metrics/daily-counters';

describe('trackRegen — métricas diarias', () => {
  beforeEach(() => {
    // vitest.config resetea mocks antes de cada test: hay que rearmar la cadena.
    mocks.set.mockResolvedValue(undefined);
    mocks.doc.mockReturnValue({ set: mocks.set });
    mocks.collection.mockReturnValue({ doc: mocks.doc });
  });

  it('escribe metrics_daily/{fecha} con merge e increments', async () => {
    await trackRegen('news_pool', { docs: 400 });
    expect(mocks.collection).toHaveBeenCalledWith('metrics_daily');
    expect(mocks.doc).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    expect(mocks.set).toHaveBeenCalledTimes(1);
    const [payload, opts] = mocks.set.mock.calls[0];
    expect(opts).toEqual({ merge: true });
    expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const keys = Object.keys(payload);
    expect(keys.some(k => k.startsWith('m.regen.news_pool'))).toBe(true);
    expect(keys.some(k => k.startsWith('m.docs.news_pool'))).toBe(true);
  });

  it('registra bytes solo cuando se proporcionan', async () => {
    await trackRegen('feed', { docs: 200, bytes: 2_400_000 });
    const [payload] = mocks.set.mock.calls[0];
    expect(Object.keys(payload).some(k => k.startsWith('m.kb.feed'))).toBe(true);
  });

  it('sanitiza claves con caracteres fuera de [a-zA-Z0-9_-]', async () => {
    await trackRegen('news_by_category', { key: 'deportes/nacional.2026', docs: 10 });
    const [payload] = mocks.set.mock.calls[0];
    const keys = Object.keys(payload).join(' ');
    expect(keys).not.toContain('deportes/nacional.2026');
    expect(keys).toContain('deportes_nacional_2026');
  });

  it('no escribe docs/bytes si son 0 o negativos, pero sí cuenta el regen', async () => {
    await trackRegen('empty_route', { docs: 0, bytes: -5 });
    const [payload] = mocks.set.mock.calls[0];
    expect(Object.keys(payload).filter(k => k.startsWith('m.docs') || k.startsWith('m.kb'))).toHaveLength(0);
    expect(Object.keys(payload).some(k => k.startsWith('m.regen.empty_route'))).toBe(true);
  });

  it('fail-open: si Firestore lanza, trackRegen NO propaga el error', async () => {
    mocks.set.mockRejectedValueOnce(new Error('Firestore down'));
    await expect(trackRegen('article', { docs: 1 })).resolves.toBeUndefined();
  });
});
