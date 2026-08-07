import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Firestore, CollectionReference, DocumentReference, QuerySnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getTrafficForDate, getTrafficPerformance, getTrafficMigrationStatus } from '@/lib/analytics/traffic-reader';

vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

function createMockDb(
  dailyData: Array<Record<string, unknown>> = [],
  logData: Array<Record<string, unknown>> = [],
): Firestore {
  const logDocs: QueryDocumentSnapshot[] = logData.map((data, i) => ({
    id: `log-${i}`,
    data: () => data,
  } as unknown as QueryDocumentSnapshot));

  const dailyDocs: QueryDocumentSnapshot[] = dailyData.map((data) => ({
    id: String(data.slug || 'unknown'),
    data: () => data,
  } as unknown as QueryDocumentSnapshot));

  const dailySubcollection = {
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      empty: dailyDocs.length === 0,
      docs: dailyDocs,
    } as unknown as QuerySnapshot),
  } as unknown as CollectionReference;

  const dailyDoc = {
    collection: vi.fn().mockReturnValue(dailySubcollection),
  } as unknown as DocumentReference;

  const dailyCollection = {
    doc: vi.fn().mockReturnValue(dailyDoc),
  } as unknown as CollectionReference;

  const logQuery = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      empty: logDocs.length === 0,
      docs: logDocs,
    } as unknown as QuerySnapshot),
  } as unknown as CollectionReference;

  const mainCollection = (name: string) => {
    if (name === 'traffic_daily') return dailyCollection;
    if (name === 'traffic_log') return logQuery;
    return undefined;
  };

  return {
    collection: vi.fn().mockImplementation(mainCollection),
  } as unknown as Firestore;
}

describe('Traffic Reader (FASE 3.8)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(new Date('2026-08-06T12:00:00Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lee traffic_daily correctamente', async () => {
    const db = createMockDb([
      { slug: 'a', date: '2026-08-06', views: 120, sources: { google: 100, facebook: 20 }, devices: { mobile: 100, desktop: 20 }, updatedAt: '2026-08-06T12:00:00Z' },
      { slug: 'b', date: '2026-08-06', views: 80, sources: { telegram: 80 }, devices: { mobile: 80 }, updatedAt: '2026-08-06T12:00:00Z' },
    ]);
    const result = await getTrafficForDate(db, '2026-08-06');

    expect(result.source).toBe('traffic_daily');
    expect(result.views).toBe(200);
    expect(result.articles.length).toBe(2);
    expect(result.articles[0].slug).toBe('a');
    expect(result.migrationHealth).toBe(100);
    expect(result.fallbackReads).toBe(0);
  });

  it('fallback funciona cuando traffic_daily está vacío', async () => {
    const db = createMockDb([], [
      { slug: 'x', source: 'google', userAgent: 'mobile' },
      { slug: 'x', source: 'google', userAgent: 'mobile' },
      { slug: 'y', source: 'facebook', userAgent: 'desktop' },
    ]);
    const result = await getTrafficForDate(db, '2026-08-06');

    expect(result.source).toBe('traffic_log_fallback');
    expect(result.views).toBe(3);
    expect(result.migrationHealth).toBe(0);
    expect(result.fallbackReads).toBe(1);
  });

  it('cache no rompe datos: source consistente', async () => {
    const db = createMockDb([
      { slug: 'a', date: '2026-08-06', views: 10, sources: { directo: 10 }, devices: { mobile: 10 }, updatedAt: '2026-08-06T12:00:00Z' },
    ]);
    const first = await getTrafficForDate(db, '2026-08-06');
    const second = await getTrafficForDate(db, '2026-08-06');

    expect(first.source).toBe('traffic_daily');
    expect(second.source).toBe('traffic_daily');
    expect(first.articles[0].views).toBe(second.articles[0].views);
  });

  it('ausencia de datos devuelve estado seguro', async () => {
    const db = createMockDb([], []);
    const result = await getTrafficForDate(db, '2026-08-06');

    expect(result.source).toBe('traffic_log_fallback');
    expect(result.views).toBe(0);
    expect(result.articles).toEqual([]);
    expect(result.migrationHealth).toBe(0);
  });

  it('getTrafficMigrationStatus refleja daily source', async () => {
    const db = createMockDb([
      { slug: 'a', date: '2026-08-06', views: 1, sources: { directo: 1 }, devices: { mobile: 1 }, updatedAt: '2026-08-06T12:00:00Z' },
    ]);
    const status = await getTrafficMigrationStatus(db);

    expect(status.dailySource).toBe('traffic_daily');
    expect(status.dailyGenerated).toBe(true);
    expect(status.migrationHealth).toBe(100);
  });
});
