import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import { runCEOLoop } from '@/lib/nios/ceo-loop';
import { decide } from '@/lib/nios/ceo-decision-engine';
import { generateNiosDiagnostics } from '@/lib/nios/intelligence/diagnostics';
import type { GSCSnapshot, GA4Snapshot, ArticleFusion } from '@/lib/nios/intelligence/types';
import type { Noticia } from '@/lib/types';
import { revalidateTag } from 'next/cache';

vi.mock('@/lib/nios/intelligence/data-merger', async () => ({
  loadNoticiasFromFirestore: vi.fn(),
  mergeArticleData: vi.fn(),
}));

vi.mock('@/lib/nios/intelligence/store', async () => ({
  getLatestSnapshot: vi.fn(),
  saveDailySnapshot: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', async () => ({
  getAdminDb: vi.fn(() => (global as any).__TEST_DB__),
}));

import { loadNoticiasFromFirestore, mergeArticleData } from '@/lib/nios/intelligence/data-merger';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';

const mockedLoad = vi.mocked(loadNoticiasFromFirestore);
const mockedMerge = vi.mocked(mergeArticleData);
const mockedGetLatest = vi.mocked(getLatestSnapshot);
const mockedRevalidate = vi.mocked(revalidateTag);

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

function gsc(status: GSCSnapshot['status']): GSCSnapshot {
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

function ga4(status: GA4Snapshot['status']): GA4Snapshot {
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

describe('CEO AGENT FINAL MISSION — fire tests', () => {
  let latestSnapshot: { date: string; articlesFused: ArticleFusion[] };
  let setCalls: unknown[] = [];

  beforeEach(() => {
    latestSnapshot = { date: '2026-05-20', articlesFused: [] };
    setCalls = [];
    mockedRevalidate.mockImplementation(() => undefined);

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

    const docMock = { id: 'test-loop-1', set: setMock };
    const colMock = { doc: () => docMock };
    const db = { collection: () => colMock } as unknown as Firestore;

    (global as any).__TEST_DB__ = db;

    const noticias = [noticia('a'), noticia('b')];
    const merged = [fusion('a'), fusion('b')];

    mockedLoad.mockImplementation(() => Promise.resolve(noticias));
    mockedMerge.mockImplementation(() => merged);
    mockedGetLatest.mockImplementation(() => Promise.resolve(latestSnapshot as any));
  });

  it('TEST A — data stale: detect, repair and verify snapshot inconsistency', async () => {
    const db: Firestore = (global as any).__TEST_DB__;
    const result = await runCEOLoop(db, 'cron/nios-collect');

    expect(result.record.repaired.some((r) => r.repairId === 'nios-snapshot-inconsistent')).toBe(true);
    expect(result.record.status).toBe('COMPLETE');
    expect(result.record.verifications.some((v) => v.id === 'nios-snapshot-inconsistent' && v.verified)).toBe(true);
    expect(result.autonomy.report.EXECUTE).toBe('REAL');
    expect(result.autonomy.report.VERIFY).toBe('REAL');
    expect(result.record.learnings.some((l) => l.decisionId === 'nios-snapshot-inconsistent')).toBe(true);
    expect(setCalls.some((c: any) => c.kind === 'ceo_loop')).toBe(true);
  });

  it('TEST B — new article collected and counted', async () => {
    mockedLoad.mockImplementation(() => Promise.resolve([noticia('nueva')]));
    mockedMerge.mockImplementation(() => [fusion('nueva')]);

    const db: Firestore = (global as any).__TEST_DB__;
    const result = await runCEOLoop(db, 'cron/nios-collect');

    expect((result.record.report.snapshotConsistency as any).dashboardCount).toBe(1);
    expect(result.record.observations.some((o) => o.source === 'NIOS')).toBe(true);
  });

  it('TEST C — cache stale: detect, refresh and verify', async () => {
    latestSnapshot.articlesFused = [fusion('a'), fusion('b')];

    const db: Firestore = (global as any).__TEST_DB__;
    const result = await runCEOLoop(db, 'cron/nios-collect');

    expect(result.record.repaired.some((r) => r.repairId === 'nios-cache-refresh')).toBe(true);
    expect(result.record.verifications.some((v) => v.id === 'nios-cache-refresh' && v.verified)).toBe(true);
    expect(result.autonomy.report.VERIFY).toBe('REAL');
  });

  it('TEST D — REAL data produces NO_ACTION', () => {
    const diagnostics = generateNiosDiagnostics(gsc('REAL'), ga4('REAL'));
    const gscDiag = diagnostics.find((d) => d.source === 'GSC' && d.status === 'REAL');
    expect(gscDiag).toBeDefined();
    const decision = decide(gscDiag!);
    expect(decision.decision).toBe('NO_ACTION');
    expect(decision.reason).toContain('No hay acción automática segura');
  });

  it('TEST E — repair failure is not reported as success', async () => {
    mockedRevalidate.mockImplementation(() => {
      throw new Error('cache unreachable');
    });
    latestSnapshot.articlesFused = [fusion('a'), fusion('b')];

    const db: Firestore = (global as any).__TEST_DB__;
    const result = await runCEOLoop(db, 'cron/nios-collect');

    expect(result.record.failedRepairs).toBeGreaterThan(0);
    expect(result.record.verifications.some((v) => v.id === 'nios-cache-refresh' && !v.verified)).toBe(true);
    expect(result.record.status).toBe('PARTIAL');
  });

  it('TEST F — GSC without credentials gets BLOCKED', () => {
    const diagnostics = generateNiosDiagnostics(gsc('ACCESS_BLOCKED'), null);
    const gscDiag = diagnostics.find((d) => d.source === 'GSC');
    expect(gscDiag).toBeDefined();
    const decision = decide(gscDiag!);
    expect(decision.decision).toBe('BLOCKED');
    expect(decision.reason).toContain('Dependencia externa bloqueada');
  });

  it('TEST G — NIOS remembers the outcome (learnings persisted)', async () => {
    const db: Firestore = (global as any).__TEST_DB__;
    const result = await runCEOLoop(db, 'cron/nios-collect');

    expect(result.record.learnings.length).toBeGreaterThan(0);
    expect(result.record.learnings.every((l) => typeof l.confidence === 'number' && l.confidence >= 0 && l.timestamp)).toBe(true);
    expect(setCalls.some((c: any) => c.kind === 'ceo_loop' && Array.isArray(c.learnings))).toBe(true);
  });

  it('TEST H — repairs do not modify editorial content', async () => {
    const db: Firestore = (global as any).__TEST_DB__;
    await runCEOLoop(db, 'cron/nios-collect');

    const editorialCalls = setCalls.filter((c: any) => c.titulo || c.contenido);
    expect(editorialCalls.length).toBe(0);
    expect(setCalls.some((c: any) => c.articlesFused !== undefined || c.articlesCount !== undefined)).toBe(true);
  });
});
