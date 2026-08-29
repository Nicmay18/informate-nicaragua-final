import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';

import { getMetricDefinition } from '@/lib/nios/intelligence/metric-truth';
import { reconcileTraffic } from '@/lib/nios/intelligence/traffic-reconciler';
import { buildCeoVerdict } from '@/lib/nios/ceo-verdict';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import {
  isPublicationSectionCategory,
  validateCategoryProfile,
  TAXONOMY,
} from '@/lib/meni/taxonomy';
import { getGrowthMetrics } from '@/lib/growth';
import { getCanonicalArticleMetrics } from '@/lib/canonical-article-metrics';

vi.mock('@/lib/analytics/traffic-aggregator', () => ({
  aggregateTrafficFromLog: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {} as Firestore,
  getAdminDb: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  verifyAdminOrCronToken: vi.fn(() => true),
}));

vi.mock('@/lib/analytics/traffic-reader', () => ({
  getTrafficForDate: vi.fn().mockResolvedValue({ views24h: 0, articles: [] }),
  getTrafficPerformance: vi.fn().mockResolvedValue({
    source: 'traffic_daily',
    views24h: 183,
    views7d: 3500,
    views30d: 10000,
    articles: [],
    performance: {
      topArticles: [],
      topSources: {},
      dailyGrowth: { '2026-08-06': 183, '2026-08-05': 100 },
      weeklyTrend: {},
      generatedAt: new Date().toISOString(),
    },
    fallbackReads: 0,
    migrationHealth: 100,
  }),
}));

interface MockDoc {
  id: string;
  data: () => Record<string, unknown>;
  exists?: boolean;
}

interface MockSnap {
  docs: MockDoc[];
  size: number;
  empty: boolean;
}

function createMockDb(documentsByCollection: Record<string, MockDoc[]> = {}) {
  const emptySnap: MockSnap = { docs: [], size: 0, empty: true };

  function buildSnapshot(docs: MockDoc[]): MockSnap {
    return { docs, size: docs.length, empty: docs.length === 0 };
  }

  function queryFor(collectionName: string) {
    const all = documentsByCollection[collectionName] || [];

    class CollectionRef {
      private limitN?: number;
      private order?: { field: string; dir: 'asc' | 'desc' };
      private filters: { field: string; op: string; value: unknown }[] = [];
      private selects?: string[];

      select(...fields: string[]) {
        this.selects = fields;
        return this;
      }

      limit(n: number) {
        this.limitN = n;
        return this;
      }

      orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
        this.order = { field, dir };
        return this;
      }

      where(field: string, op: string, value: unknown) {
        this.filters.push({ field, op, value });
        return this;
      }

      count() {
        return {
          get: async () => ({
            data: () => ({
              count: all.length,
            }),
          }),
        };
      }

      doc(id: string) {
        return {
          get: async () => {
            const found = all.find((d) => d.id === id);
            if (found) {
              return { exists: true, data: () => found.data() };
            }
            return { exists: false, data: () => null };
          },
        };
      }

      async get(): Promise<MockSnap> {
        let result = [...all];

        for (const f of this.filters) {
          if (f.op === '==' && f.field === 'slug') {
            result = result.filter((d) => d.data().slug === f.value);
          } else if (f.op === '>' && f.field === 'timestamp') {
            // keep all for testing purposes
          }
        }

        if (this.order) {
          const field = this.order.field;
          result = result.sort((a, b) => {
            const va = a.data()[field] as number;
            const vb = b.data()[field] as number;
            if (va == null || vb == null) return 0;
            return this.order!.dir === 'desc' ? vb - va : va - vb;
          });
        }

        if (this.limitN !== undefined) {
          result = result.slice(0, this.limitN);
        }

        return buildSnapshot(result);
      }
    }

    return new CollectionRef();
  }

  return {
    collection: (name: string) => queryFor(name),
  } as unknown as Firestore;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ───────────────────────────────────────────────────────────────
// 1. METRIC INTEGRITY
// ───────────────────────────────────────────────────────────────

describe('Metric Integrity', () => {
  it('1. canonical lifetime views (noticias.vistas) está definida y separada', () => {
    const def = getMetricDefinition('article.views.canonical');
    expect(def).toBeDefined();
    expect(def?.collection).toBe('noticias');
    expect(def?.field).toBe('vistas');
    expect(def?.period).toBe('lifetime');
    expect(def?.definition).toMatch(/acumulad/i);
  });

  it('2. recent traffic (7 días) está definida como RAW y no lifetime', () => {
    const def = getMetricDefinition('site.traffic.recent24h');
    expect(def).toBeDefined();
    expect(def?.period).not.toBe('lifetime');
    expect(def?.collection).toBe('traffic_log');
  });

  it('3. GA4 pageviews es métrica distinta a las canónicas', () => {
    const def = getMetricDefinition('article.ga4.pageviews');
    expect(def).toBeDefined();
    expect(def?.source).toBe('Google Analytics 4');
    expect(def?.caveats?.some((c) => c.includes('canónico'))).toBe(true);
  });

  it('4. social reach no existe en el catálogo canónico, se mantiene como fuente externa', () => {
    // Verifica que no se inventó una métrica social canónica falsa.
    const def = getMetricDefinition('site.social.reach');
    expect(def).toBeUndefined();
  });

  it('5. GSC clicks son métrica separada y no sumables a vistas', () => {
    const def = getMetricDefinition('article.gsc.clicks');
    expect(def).toBeDefined();
    expect(def?.unit).toBe('clics');
    expect(def?.source).toBe('Google Search Console');

    const gsc = { status: 'REAL', totalClicks: 19 } as any;
    const ga4 = { status: 'REAL', totalUsers: 120 } as any;
    const traffic = {
      generatedAt: new Date().toISOString(),
      topArticles: [],
      topSources: {},
      dailyGrowth: { '1': 10, '2': 9 },
      weeklyTrend: {},
    };
    const ri = reconcileTraffic(traffic as any, gsc, ga4);
    const trafficSource = ri.sources.find((s) => s.id === 'traffic');
    const gscSource = ri.sources.find((s) => s.id === 'gsc');
    expect(trafficSource?.unit).toBe('visitas');
    expect(gscSource?.unit).toBe('clics');
    expect(ri.gscClicks).toBe(19);
  });
});

// ───────────────────────────────────────────────────────────────
// 2. CONSUMER INTEGRITY
// ───────────────────────────────────────────────────────────────

describe('Consumer Integrity', () => {
  it('6. growth expone métricas canónicas con definición', async () => {
    const db = createMockDb({
      noticias: [
        { id: 'a', data: () => ({ slug: 'a', titulo: 'A', vistas: 700 }) },
        { id: 'b', data: () => ({ slug: 'b', titulo: 'B', vistas: 19 }) },
      ],
    });

    const metrics = await getGrowthMetrics(db);
    expect(metrics.metrics.length).toBeGreaterThan(0);
    expect(metrics.metrics.some((m) => m.key === 'site.articles.total')).toBe(true);
    expect(metrics.metrics.some((m) => m.key === 'site.articles.averageViews')).toBe(true);
    expect(metrics.mostRead?.metric.key).toBe('article.rank.lifetime.top');
    expect(metrics.topArticles.every((a) => a.metric.key === 'article.rank.lifetime.top')).toBe(true);
  });

  it('7. auditor-dashboard incluye metricDefinitions', async () => {
    const { getAdminDb: mockGetAdminDb } = await import('@/lib/firebase-admin');
    (mockGetAdminDb as any).mockReturnValue(
      createMockDb({
        noticias: [
          { id: 'x', data: () => ({ slug: 'x', titulo: 'X', vistas: 10, categoria: 'Nacionales' }) },
        ],
        distribuciones: [],
      }),
    );

    const { GET } = await import('@/app/api/admin/auditor-dashboard/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/admin/auditor-dashboard');
    const res = await GET(req);
    const json = await res.json();
    expect(json.metricDefinitions).toBeDefined();
    expect(json.metricDefinitions.topNoticias?.key).toBe('article.rank.lifetime.top');
    expect(json.metricDefinitions.visitas24h?.key).toBe('site.traffic.recent24h');
    expect(json.topNoticias[0].metric.key).toBe('article.rank.lifetime.top');
  });

  it('8. top-noticias declara criterio TOP_BY_CANONICAL_LIFETIME_VIEWS', async () => {
    const { getAdminDb: mockGetAdminDb } = await import('@/lib/firebase-admin');
    (mockGetAdminDb as any).mockReturnValue(
      createMockDb({
        noticias: [
          { id: 'eclipse', data: () => ({ slug: 'eclipse-lunar', titulo: 'Eclipse', vistas: 700, categoria: 'Nacionales' }) },
          { id: 'inss', data: () => ({ slug: 'inss-pension', titulo: 'INSS', vistas: 19, categoria: 'Nacionales' }) },
        ],
      }),
    );

    const { GET } = await import('@/app/api/top-noticias/route');
    const res = await GET();
    const json = await res.json();
    expect(json.criterio).toBe('TOP_BY_CANONICAL_LIFETIME_VIEWS');
    expect(json.definicion).toMatch(/canónico/i);
    expect(json.noticias[0].vistasCanonicas).toBe(700);
    expect(json.noticias[0].metric?.key).toBe('article.rank.lifetime.top');
  });
});

// ───────────────────────────────────────────────────────────────
// 3. UX 700 VS 19
// ───────────────────────────────────────────────────────────────

describe('UX 700 vs 19', () => {
  it('9. lifetime 700 y recent traffic 19 nunca tienen la misma definición', async () => {
    const { getAdminDb: mockGetAdminDb } = await import('@/lib/firebase-admin');
    (mockGetAdminDb as any).mockReturnValue(
      createMockDb({
        noticias: [{ id: 'eclipse', data: () => ({ slug: 'eclipse-lunar', titulo: 'Eclipse', vistas: 700 }) }],
      }),
    );
    const canonical = await getCanonicalArticleMetrics('eclipse-lunar');
    const recent = getMetricDefinition('site.traffic.recent24h');

    expect(canonical?.cmsViews).toBe(700);
    expect(canonical?.sources[0].period).toBe('lifetime');
    expect(recent?.period).not.toBe('lifetime');
    expect(recent?.collection).toBe('traffic_log');
  });

  it('10. reconcileTraffic reporta 700 lifetime y 19 recent sin sumar', () => {
    const traffic = {
      generatedAt: new Date().toISOString(),
      topArticles: [],
      topSources: {},
      dailyGrowth: { d1: 19 },
      weeklyTrend: {},
    } as any;
    const gsc = { status: 'REAL', totalClicks: 0 } as any;
    const ri = reconcileTraffic(traffic, gsc, null);
    const trafficSource = ri.sources.find((s) => s.id === 'traffic');
    expect(trafficSource?.value).toBe(19);
    expect(trafficSource?.note.toLowerCase()).toContain('no sumar');
  });
});

// ───────────────────────────────────────────────────────────────
// 4. TAXONOMÍA
// ───────────────────────────────────────────────────────────────

describe('Taxonomía', () => {
  it('11. eclipse detecta perfil astronomía', () => {
    const result = detectContentProfile(
      'Eclipse lunar visible en Nicaragua este sábado',
      'El fenómeno astronómico se podrá observar en distintas partes del país. La luna tomará un tono rojizo.',
    );
    expect(result.profile_detected).toBe('astronomia');
  });

  it('12. categoría y perfil no se contaminan', () => {
    const valid = validateCategoryProfile('Nacionales', 'astronomia');
    expect(valid.valid).toBe(true);
    expect(TAXONOMY.CATEGORIA.meaning).toMatch(/Sección de publicación/);
    expect(TAXONOMY.PERFIL.meaning).toMatch(/temático/);

    const contaminated = validateCategoryProfile('Espectáculos', 'astronomia');
    expect(contaminated.valid).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// 5. CEO
// ───────────────────────────────────────────────────────────────

describe('CEO Decision Integrity', () => {
  function baseCeoInput(partial: any = {}): any {
    return {
      articlesCount: 10,
      trafficIntelligence: reconcileTraffic({ generatedAt: '', topArticles: [], topSources: {}, dailyGrowth: {}, weeklyTrend: {} }, null, null),
      gsc: { status: 'REAL', totalClicks: 0 },
      ga4: { status: 'REAL', totalUsers: 120 },
      trust: { averageGoogleTrustScore: 80 },
      alerts: [],
      editorCEOReport: { whatToStop: [], whatToRepeat: [] },
      ...partial,
    };
  }

  it('13. artículo completo no recomienda ampliar', () => {
    const v = buildCeoVerdict(
      baseCeoInput({
        editorCEOReport: {
          whatToStop: [
            { action: 'Agregar más contenido al artículo INSS', reasoning: 'Ya responde la pregunta del lector.' },
          ],
          whatToRepeat: [],
        },
      }),
    );
    expect(v.doNotDo.some((d) => d.includes('NO repetir') && d.includes('Agregar más contenido'))).toBe(true);
  });

  it('14. artículo completo + bajo tráfico no expandir, distribución', () => {
    const v = buildCeoVerdict(
      baseCeoInput({
        trafficIntelligence: reconcileTraffic({ generatedAt: '', topArticles: [], topSources: {}, dailyGrowth: {}, weeklyTrend: {} }, null, null),
        editorCEOReport: {
          whatToStop: [{ action: 'Ampliar notas completas', reasoning: 'El problema es distribución, no contenido.' }],
          whatToRepeat: [],
        },
      }),
    );
    expect(v.doNotDo.some((d) => d.toLowerCase().includes('ampliar') || d.includes('NO repetir'))).toBe(true);
  });

  it('15. métricas contradictorias → confidence menor', () => {
    const v = buildCeoVerdict(
      baseCeoInput({
        trafficIntelligence: reconcileTraffic({ generatedAt: '', topArticles: [], topSources: {}, dailyGrowth: { d1: 19 }, weeklyTrend: {} }, { status: 'REAL', totalClicks: 0 } as any, null),
        gsc: null,
        ga4: null,
      }),
    );
    expect(v.confidence).toBeLessThan(80);
    expect(v.evidence.some((e) => e.source === 'GSC' || e.source === 'GA4' || e.source === 'Traffic')).toBe(true);
  });

  it('16. fuente bloqueada → degraded mode mantiene CEO operativo', () => {
    const v = buildCeoVerdict(
      baseCeoInput({
        gsc: { status: 'ACCESS_BLOCKED' },
        ga4: { status: 'REAL', totalUsers: 120 },
        trafficIntelligence: reconcileTraffic({ generatedAt: '', topArticles: [], topSources: {}, dailyGrowth: { d1: 100 }, weeklyTrend: {} } as any, { status: 'ACCESS_BLOCKED' } as any, { status: 'REAL' } as any),
      }),
    );
    expect(v.status).not.toBe('RIESGO_CRITICO');
    expect(v.evidence.some((e) => e.source === 'GSC' && e.status === 'ACCESS_BLOCKED')).toBe(true);
    expect(v.evidence.some((e) => e.source === 'GA4' && e.status === 'REAL')).toBe(true);
  });
});
