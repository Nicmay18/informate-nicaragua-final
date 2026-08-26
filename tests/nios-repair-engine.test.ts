import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import { runRepairEngine } from '@/lib/nios/repair-engine';
import type { GSCSnapshot, GA4Snapshot, ArticleFusion } from '@/lib/nios/intelligence/types';
import type { Noticia } from '@/lib/types';

vi.mock('@/lib/nios/intelligence/data-merger', async () => ({
  loadNoticiasFromFirestore: vi.fn(),
  mergeArticleData: vi.fn(),
}));

vi.mock('@/lib/nios/intelligence/store', async () => ({
  getLatestSnapshot: vi.fn(),
  saveDailySnapshot: vi.fn(),
}));

import { loadNoticiasFromFirestore, mergeArticleData } from '@/lib/nios/intelligence/data-merger';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';

const mockedLoad = vi.mocked(loadNoticiasFromFirestore);
const mockedMerge = vi.mocked(mergeArticleData);
const mockedGetLatest = vi.mocked(getLatestSnapshot);

function gsc(status: 'REAL'): GSCSnapshot {
  return {
    date: '2026-05-20',
    collectedAt: new Date().toISOString(),
    siteUrl: 'sc-domain:nicaraguainformate.com',
    dateRange: { start: '2026-05-01', end: '2026-05-07' },
    totalImpressions: 1000,
    totalClicks: 50,
    avgCtr: 0.05,
    avgPosition: 12,
    pages: [],
    queries: [],
    countries: [],
    devices: [],
    status,
  } as unknown as GSCSnapshot;
}

function ga4(status: 'REAL'): GA4Snapshot {
  return {
    date: '2026-05-20',
    collectedAt: new Date().toISOString(),
    propertyId: '123456',
    dateRange: { start: '2026-05-01', end: '2026-05-07' },
    totalUsers: 100,
    totalSessions: 120,
    totalPageviews: 300,
    averageEngagementTimeSec: 60,
    engagementRate: 0.7,
    pages: [],
    sources: [],
    devices: [],
    status,
  } as unknown as GA4Snapshot;
}

function noticia(slug: string): Noticia {
  return {
    id: slug,
    slug,
    titulo: `Noticia ${slug}`,
    categoria: 'Nacionales',
    autor: 'Redacción',
    fechaPublicacion: new Date().toISOString(),
    palabras: 500,
    scoreMeni: 95,
    tags: [],
    relatedLinks: [],
    estado: 'publicado',
    contenido: 'Contenido de prueba.',
    url: `https://nicaraguainformate.com/noticias/${slug}`,
  } as unknown as Noticia;
}

function fusion(slug: string): ArticleFusion {
  return {
    slug,
    url: `https://nicaraguainformate.com/noticias/${slug}`,
    titulo: `Noticia ${slug}`,
    categoria: 'Nacionales',
    autor: 'Redacción',
    fechaPublicacion: new Date().toISOString(),
    palabras: 500,
    scoreMeni: 95,
    tags: [],
    relatedLinksCount: 0,
    gscImpressions: 0,
    gscClicks: 0,
    gscCtr: 0,
    gscPosition: 0,
    gscTopQueries: [],
    ga4Users: 0,
    ga4Sessions: 0,
    ga4Pageviews: 0,
    ga4AvgEngagementTimeSec: 0,
    ga4EngagementRate: 0,
    hasGscData: false,
    hasGa4Data: false,
  };
}

describe('NIOS Repair Engine', () => {
  let latestSnapshot: { date: string; articlesFused: ArticleFusion[] };
  let setCalls: unknown[] = [];

  beforeEach(() => {
    latestSnapshot = { date: '2026-05-20', articlesFused: [] };
    setCalls = [];
    mockedGetLatest.mockImplementation(() => Promise.resolve(latestSnapshot as any));

    const setMock = vi.fn().mockImplementation(async (payload: any) => {
      setCalls.push(payload);
      if (Array.isArray(payload.articlesFused)) {
        latestSnapshot.articlesFused = payload.articlesFused;
      }
      if (typeof payload.articlesCount === 'number') {
        (latestSnapshot as any).articlesCount = payload.articlesCount;
      }
      return undefined;
    });

    const docRef = { set: setMock };
    const colRef = { doc: () => docRef };
    const db = { collection: () => colRef } as unknown as Firestore;

    const noticias = [noticia('a'), noticia('b')];
    const merged = [fusion('a'), fusion('b')];

    mockedLoad.mockImplementation(() => Promise.resolve(noticias));
    mockedMerge.mockImplementation(() => merged);

    (global as any).__TEST_DB__ = db;
    (global as any).__TEST_NOTICIAS__ = noticias;
    (global as any).__TEST_MERGED__ = merged;
  });

  it('auto-repairs snapshot inconsistency and reports VERIFIED', async () => {
    const db: Firestore = (global as any).__TEST_DB__;

    const result = await runRepairEngine({
      db,
      gsc: gsc('REAL'),
      ga4: ga4('REAL'),
    });

    expect(result.repaired.length).toBeGreaterThan(0);
    expect(result.repaired.some((r) => r.repairId === 'nios-snapshot-inconsistent')).toBe(true);
    expect(result.mode).toMatch(/VERIFIED|HEALTHY/);
    expect(result.report.snapshotConsistency.consistent).toBe(true);
    expect(setCalls.length).toBeGreaterThan(0);
    expect(latestSnapshot.articlesFused.length).toBe(2);
  });

  it('reports WAITING_HUMAN when GSC requires human configuration', async () => {
    const db: Firestore = (global as any).__TEST_DB__;
    const result = await runRepairEngine({ db });

    expect(result.pendingHuman.some((a) => a.source === 'GSC' || a.source === 'GA4')).toBe(true);
    expect(['WAITING_HUMAN', 'ACTION_REQUIRED', 'BLOCKED']).toContain(result.mode);
  });

  it('does not invent data when no noticias exist', async () => {
    const db: Firestore = (global as any).__TEST_DB__;
    latestSnapshot = { date: '2026-05-20', articlesFused: [] };
    mockedLoad.mockImplementation(() => Promise.resolve([]));
    mockedMerge.mockImplementation(() => []);

    const result = await runRepairEngine({ db });

    expect(result.repaired.length).toBe(0);
    expect(result.failedRepairs.some((a) => a.id === 'nios-snapshot-inconsistent')).toBe(false);
    expect(result.actions.some((a) => a.id === 'nios-snapshot-inconsistent')).toBe(false);
  });
});
