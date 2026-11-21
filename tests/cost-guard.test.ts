import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';

// Mock mínimo de Firestore para config/cost_guard
function makeDb(docData: Record<string, unknown> | null) {
  const docRef = {
    get: vi.fn(async () => ({
      exists: docData !== null,
      data: () => docData ?? undefined,
    })),
  };
  return {
    collection: vi.fn(() => ({ doc: vi.fn(() => docRef) })),
  } as unknown as Firestore;
}

describe('cost-guard — protección financiera', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('modo normal por defecto cuando el doc no existe → todo permitido', async () => {
    const { getCostGuardConfig, isNiosStageAllowed, isCronAllowed, __resetCostGuardCache } = await import('@/lib/cost-guard');
    __resetCostGuardCache();
    const db = makeDb(null);
    const cfg = await getCostGuardConfig(db);
    expect(cfg.mode).toBe('normal');
    expect(await isNiosStageAllowed(db, 'ceo')).toBe(true);
    expect(await isCronAllowed(db, '/api/cron/nios-ceo-loop')).toBe(true);
  });

  it('modo economy desactiva solo las etapas/crons listados', async () => {
    const { getCostGuardConfig, isNiosStageAllowed, isCronAllowed, __resetCostGuardCache } = await import('@/lib/cost-guard');
    __resetCostGuardCache();
    const db = makeDb({
      mode: 'economy',
      disabledStages: ['ceo'],
      disabledCrons: ['/api/cron/meni-learning-cycle'],
    });
    const cfg = await getCostGuardConfig(db);
    expect(cfg.mode).toBe('economy');
    expect(await isNiosStageAllowed(db, 'ceo')).toBe(false);
    expect(await isNiosStageAllowed(db, 'collect')).toBe(true);
    expect(await isNiosStageAllowed(db, 'analyze')).toBe(true);
    expect(await isCronAllowed(db, '/api/cron/meni-learning-cycle')).toBe(false);
    expect(await isCronAllowed(db, '/api/cron/nios-ceo-loop')).toBe(true);
  });

  it('fail-open: error de lectura → modo normal (el sitio nunca se apaga por el guard)', async () => {
    const { isNiosStageAllowed, __resetCostGuardCache } = await import('@/lib/cost-guard');
    __resetCostGuardCache();
    const db = {
      collection: vi.fn(() => ({ doc: vi.fn(() => ({ get: vi.fn(async () => { throw new Error('firestore down'); }) })) })),
    } as unknown as Firestore;
    expect(await isNiosStageAllowed(db, 'ceo')).toBe(true);
  });
});
