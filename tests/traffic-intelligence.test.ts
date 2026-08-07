import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Firestore, CollectionReference, DocumentReference, QuerySnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import {
  getTrafficDailySummary,
  aggregateTrafficFromLog,
  saveTrafficDailySummary,
  generateTrafficPerformance,
  type TrafficDailySummary,
} from '@/lib/analytics/traffic-aggregator';

function createMockDb(
  trafficDailyData: Record<string, TrafficDailySummary> = {},
  trafficLogData: Array<Record<string, unknown>> = [],
): Firestore {
  const docs: QueryDocumentSnapshot[] = trafficLogData.map((data, i) => ({
    id: `doc-${i}`,
    data: () => data,
  } as unknown as QueryDocumentSnapshot));

  const mockSnap = {
    empty: docs.length === 0,
    docs,
  } as unknown as QuerySnapshot;

  const mockSubcollection = {
    get: vi.fn().mockResolvedValue({
      empty: Object.keys(trafficDailyData).length === 0,
      docs: Object.values(trafficDailyData).map((d) => ({
        id: d.slug,
        data: () => d,
      } as unknown as QueryDocumentSnapshot)),
    } as unknown as QuerySnapshot),
  } as unknown as CollectionReference;

  const mockDocRef = {
    collection: vi.fn().mockReturnValue(mockSubcollection),
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({ exists: false, data: () => null }),
  } as unknown as DocumentReference;

  const mockCollection = {
    doc: vi.fn().mockReturnValue(mockDocRef),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(mockSnap),
    add: vi.fn().mockResolvedValue({ id: 'new-doc' }),
  } as unknown as CollectionReference;

  return {
    collection: vi.fn().mockReturnValue(mockCollection),
  } as unknown as Firestore;
}

describe('Traffic Intelligence (FASE 3.7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lee resúmenes diarios de traffic_daily', async () => {
    const data: Record<string, TrafficDailySummary> = {
      'noticia-1': {
        slug: 'noticia-1',
        date: '2026-08-06',
        views: 100,
        sources: { google: 60, facebook: 40 },
        devices: { mobile: 80, desktop: 20 },
        updatedAt: '2026-08-06T12:00:00Z',
      },
    };
    const db = createMockDb(data);
    const result = await getTrafficDailySummary(db, '2026-08-06');

    expect(result['noticia-1'].views).toBe(100);
    expect(result['noticia-1'].sources.google).toBe(60);
    expect(result['noticia-1'].devices.mobile).toBe(80);
  });

  it('agraga fuentes correctamente desde traffic_log', async () => {
    const log = [
      { slug: 'a', source: 'google', userAgent: 'mobile' },
      { slug: 'a', source: 'google', userAgent: 'mobile' },
      { slug: 'a', source: 'facebook', userAgent: 'Mozilla/5.0 (Windows NT 10.0)' },
      { slug: 'b', source: 'telegram', userAgent: 'mobile' },
    ];
    const db = createMockDb({}, log);
    const result = await aggregateTrafficFromLog(db, '2026-08-06');

    expect(result['a'].views).toBe(3);
    expect(result['a'].sources.google).toBe(2);
    expect(result['a'].sources.facebook).toBe(1);
    expect(result['a'].devices.mobile).toBe(2);
    expect(result['a'].devices.desktop).toBe(1);
    expect(result['b'].views).toBe(1);
  });

  it('agraga dispositivos correctamente', async () => {
    const log = [
      { slug: 'x', source: 'directo', userAgent: 'Mozilla/5.0 (iPhone)' },
      { slug: 'x', source: 'directo', userAgent: 'Mozilla/5.0 (Windows NT)' },
      { slug: 'x', source: 'directo', userAgent: 'Mozilla/5.0 (iPad)' },
    ];
    const db = createMockDb({}, log);
    const result = await aggregateTrafficFromLog(db, '2026-08-06');

    expect(result['x'].devices.mobile).toBe(1);
    expect(result['x'].devices.desktop).toBe(1);
    expect(result['x'].devices.tablet).toBe(1);
  });

  it('fallback a traffic_log cuando traffic_daily está vacío', async () => {
    const log = [{ slug: 'c', source: 'google', userAgent: 'mobile' }];
    const db = createMockDb({}, log);
    const perf = await generateTrafficPerformance(db, 1, 20);

    expect(perf.topArticles.length).toBeGreaterThan(0);
    expect(perf.topArticles[0].slug).toBe('c');
    expect(perf.topArticles[0].views).toBe(1);
    const totalDaily = Object.values(perf.dailyGrowth).reduce((a, b) => a + b, 0);
    expect(totalDaily).toBe(1);
  });

  it('mantiene compatibilidad con traffic_log actual: no borra ni modifica', async () => {
    const log = [{ slug: 'd', source: 'google', userAgent: 'mobile' }];
    const db = createMockDb({}, log);
    await aggregateTrafficFromLog(db, '2026-08-06');

    // Aggregate es read-only
    expect(db.collection).toHaveBeenCalledWith('traffic_log');
  });
});
