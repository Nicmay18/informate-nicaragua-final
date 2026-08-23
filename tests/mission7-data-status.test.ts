import { describe, it, expect } from 'vitest';
import { mergeArticleData } from '@/lib/nios/intelligence/data-merger';
import { generateGoogleTrustReport, generateThinContentReport } from '@/lib/nios/intelligence/google-trust';
import { detectGoogleOpportunities, getCEODailyBrief, analyzeForPublication } from '@/lib/ceo-agent';
import type { Noticia } from '@/lib/types';
import type { ArticleFusion, GSCSnapshot, GA4Snapshot } from '@/lib/nios/intelligence/types';

const baseArticle = (overrides: Partial<ArticleFusion> = {}): ArticleFusion => ({
  slug: 'test',
  url: 'https://nicaraguainformate.com/noticias/test',
  titulo: 'Test',
  categoria: 'Nacionales',
  autor: 'Autor Test',
  fechaPublicacion: new Date().toISOString(),
  palabras: 600,
  scoreMeni: 85,
  tags: ['tag1', 'tag2'],
  relatedLinksCount: 3,
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
  ...overrides,
});

const blockedGsc = (overrides: Partial<GSCSnapshot> = {}): GSCSnapshot => ({
  date: '2026-08-22',
  collectedAt: new Date().toISOString(),
  siteUrl: 'https://nicaraguainformate.com',
  dateRange: { start: '2026-07-25', end: '2026-08-22' },
  totalImpressions: 0,
  totalClicks: 0,
  avgCtr: 0,
  avgPosition: 0,
  pages: [],
  queries: [],
  countries: [],
  devices: [],
  status: 'ACCESS_BLOCKED',
  errorMessage: 'Credenciales no configuradas',
  ...overrides,
});

const realGsc = (overrides: Partial<GSCSnapshot> = {}): GSCSnapshot => ({
  date: '2026-08-22',
  collectedAt: new Date().toISOString(),
  siteUrl: 'https://nicaraguainformate.com',
  dateRange: { start: '2026-07-25', end: '2026-08-22' },
  totalImpressions: 10000,
  totalClicks: 400,
  avgCtr: 4,
  avgPosition: 8,
  pages: [],
  queries: [],
  countries: [],
  devices: [],
  status: 'REAL',
  ...overrides,
});

const blockedGa4 = (overrides: Partial<GA4Snapshot> = {}): GA4Snapshot => ({
  date: '2026-08-22',
  collectedAt: new Date().toISOString(),
  propertyId: '12345',
  dateRange: { start: '2026-07-25', end: '2026-08-22' },
  totalUsers: 0,
  totalSessions: 0,
  totalPageviews: 0,
  averageEngagementTimeSec: 0,
  engagementRate: 0,
  pages: [],
  sources: [],
  devices: [],
  status: 'ACCESS_BLOCKED',
  ...overrides,
});

const baseNoticia = (overrides: Partial<Noticia> = {}): Noticia =>
  ({
    id: '1',
    slug: 'test',
    titulo: 'Test',
    resumen: '',
    contenido: '<p>Contenido</p>',
    categoria: 'Nacionales',
    imagen: '/test.webp',
    fecha: new Date().toISOString(),
    autor: 'Autor Test',
    palabras: 600,
    scoreMeni: 85,
    tags: ['tag1', 'tag2'],
    related_links: [],
    estado: 'publicado',
    vistas: 0,
    ...overrides,
  } as unknown as Noticia);

describe('Misión 7 — el sistema no miente con ceros', () => {
  it('A) gsc ACCESS_BLOCKED => gscImpressions no se interpreta como 0 real', () => {
    const noticia = baseNoticia();
    const gsc = blockedGsc();
    const ga4 = blockedGa4();
    const fused = mergeArticleData([noticia], gsc, ga4);
    expect(fused).toHaveLength(1);
    expect(fused[0].gscStatus).toBe('ACCESS_BLOCKED');
    expect(fused[0].hasGscData).toBe(false);
    expect(fused[0].gscImpressions).toBe(0);
  });

  it('B) GSC bloqueado => Google Trust no penaliza como 0 impresiones', () => {
    const articles = [
      baseArticle({ slug: 'a', titulo: 'A', scoreMeni: 95, gscStatus: 'ACCESS_BLOCKED', gscImpressions: 0 }),
      baseArticle({ slug: 'b', titulo: 'B', scoreMeni: 50, gscStatus: 'ACCESS_BLOCKED', gscImpressions: 0 }),
      baseArticle({ slug: 'c', titulo: 'C', scoreMeni: 70, gscStatus: 'ACCESS_BLOCKED' }),
    ];
    const report = generateGoogleTrustReport(articles);
    expect(report.articlesHighMeniZeroImpressions).toBe(0);
    expect(report.articlesLowMeniHighImpressions).toBe(0);
    expect(report.thinContentCount).toBeGreaterThanOrEqual(0);
    expect(report.summary).toMatch(/ACCESS_BLOCKED|No es posible evaluar/i);
  });

  it('C) detectGoogleOpportunities con GSC bloqueado devuelve señales vacías', () => {
    const signals = detectGoogleOpportunities({ titulo: 'T' }, { impressions: 5000, clicks: 50, status: 'ACCESS_BLOCKED' });
    expect(signals).toHaveLength(0);
  });

  it('D) CEO Daily Brief no genera acciones GSC cuando GSC está bloqueado', () => {
    const article = baseNoticia({ slug: 's1', titulo: 'S1', vistas: 100 });
    const brief = getCEODailyBrief({
      articles: [article],
      traffic: { [article.slug]: { viewsRecent: 100, status: 'REAL' } },
      gsc: [{ impressions: 1000, clicks: 10, status: 'ACCESS_BLOCKED' } as any],
    });
    const gscActions = brief.filter(a => a.why.toLowerCase().includes('gsc') || a.why.toLowerCase().includes('google'));
    expect(gscActions).toHaveLength(0);
  });

  it('E) analyzeForPublication con tráfico ACCESS_BLOCKED no decide DO_NOT_PUBLISH por 0 vistas', () => {
    const article = baseNoticia({ slug: 's2', titulo: 'S2', vistas: undefined as any, palabras: 500 });
    const analysis = analyzeForPublication(article, {
      articlePool: [],
      traffic: { viewsRecent: 0, status: 'ACCESS_BLOCKED' },
      gsc: { impressions: 0, clicks: 0, status: 'ACCESS_BLOCKED' },
    });
    expect(analysis.traffic.status).toBe('ACCESS_BLOCKED');
    expect(analysis.action).not.toBe('DO_NOT_PUBLISH');
  });

  it('F) mergeArticleData con snapshots nulos reporta NO_DATA en lugar de inventar 0', () => {
    const noticia = baseNoticia();
    const fused = mergeArticleData([noticia], null, null);
    expect(fused[0].gscStatus).toBe('NO_DATA');
    expect(fused[0].ga4Status).toBe('NO_DATA');
    expect(fused[0].hasGscData).toBe(false);
    expect(fused[0].hasGa4Data).toBe(false);
  });

  it('G) Google Trust no reporta thin content por "0 impresiones" si GSC está bloqueado', () => {
    const articles = [baseArticle({ slug: 'd', titulo: 'D', palabras: 600, scoreMeni: 75, gscStatus: 'ACCESS_BLOCKED', gscImpressions: 0 })];
    const thin = generateThinContentReport(articles);
    const noImpressionFlag = thin.some(a => a.reasons.some(r => r.includes('0 impresiones')));
    expect(noImpressionFlag).toBe(false);
  });
});
