import { describe, it, expect } from 'vitest';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import { buildCeoVerdict } from '@/lib/nios/ceo-verdict';
import { reconcileTraffic } from '@/lib/nios/intelligence/traffic-reconciler';
import {
  filterAbsurdImprovementRecommendations,
  isContentComplete,
} from '@/lib/nios/intelligence/absurd-recommendation-guard';
import { generateImprovementRecommendations } from '@/lib/nios/intelligence/content-improvement';
import { getMetricDefinition } from '@/lib/nios/intelligence/metric-truth';
import type { CeoVerdictInput } from '@/lib/nios/ceo-verdict';
import type { ArticleFusion } from '@/lib/nios/intelligence/types';

// ─── helpers ─────────────────────────────────────────────────────

const baseArticle: ArticleFusion = {
  slug: 'inss-familiares-cobertura-fallecimiento',
  url: '/noticias/inss-familiares-cobertura-fallecimiento',
  titulo: 'INSS: ¿Qué familiares tienen cobertura por fallecimiento?',
  categoria: 'Nacionales',
  autor: 'Nicaragua Informate',
  fechaPublicacion: new Date().toISOString(),
  palabras: 750,
  scoreMeni: 92,
  tags: ['INSS', 'seguridad social', 'familiares', 'fallecimiento'],
  relatedLinksCount: 3,
  gscImpressions: 0,
  gscClicks: 0,
  gscCtr: 0,
  gscPosition: 0,
  gscTopQueries: [],
  ga4Users: 120,
  ga4Sessions: 140,
  ga4Pageviews: 180,
  // noticias.vistas es la métrica canónica de lifetime; ga4Pageviews es GA4.
  // ArticleFusion no duplica vistas, solo expone ga4Pageviews para el análisis.
  ga4AvgEngagementTimeSec: 90,
  ga4EngagementRate: 0.65,
  hasGscData: false,
  hasGa4Data: true,
  gscStatus: 'no_data',
  ga4Status: 'matched',
  gscMatchStatus: 'no_data',
  ga4MatchStatus: 'matched',
};

const eclipseArticle: Partial<ArticleFusion> = {
  slug: 'eclipse-lunar-visible-nicaragua',
  titulo: 'Eclipse lunar visible en Nicaragua este fin de semana',
  categoria: 'Nacionales',
  palabras: 520,
};

const mockCeoInput = (overrides: Partial<CeoVerdictInput> = {}): CeoVerdictInput => ({
  snapshot: null,
  snapshotDate: null,
  google: null,
  trust: { averageGoogleTrustScore: 78 } as any,
  adsense: null,
  traffic: null,
  trafficIntelligence: {
    hasData: true,
    message: 'Tráfico interno disponible',
    sources: [
      { id: 'traffic', name: 'Traffic Log', status: 'REAL', value: 700, unit: 'visitas', note: '7 días' },
      { id: 'gsc', name: 'GSC', status: 'NO_DATA', value: null, unit: 'clics', note: 'Sin datos' },
      { id: 'ga4', name: 'GA4', status: 'REAL', value: 120, unit: 'usuarios', note: '7 días' },
    ],
    trafficPerformance: null,
    totalTrafficViews7d: 700,
    gscClicks: null,
    ga4Users: 120,
    ga4Sessions: 140,
  },
  meniLearning: null,
  learningPatterns: [],
  reliability: null,
  weekly: { questions: { requiresAttention: ['Revisar metas vacías'] } } as any,
  alerts: [],
  telemetry: null,
  telemetryHistory: [],
  ttlStatus: 'pendiente',
  articlesCount: 150,
  gsc: { status: 'NO_DATA' } as any,
  ga4: { status: 'REAL', totalUsers: 120, totalSessions: 140 } as any,
  contentOpportunity: { opportunities: [{ query: 'pensión por fallecimiento INSS' }] } as any,
  categoryIntelligence: null,
  editorCEOReport: { whatToRepeat: [], articlesToUpdate: [] } as any,
  snapshotHistory: [],
  ...overrides,
});

// ─── 1. CASO 700 vs 19 ───────────────────────────────────────────

describe('Caso 700 vs 19 — métricas de vistas', () => {
  it('distingue lifetime (noticias.vistas) vs 7 días (traffic_log/traffic_daily)', () => {
    const canonical = getMetricDefinition('article.views.canonical');
    expect(canonical).not.toBeUndefined();
    expect(canonical?.source).toBe('Firestore');
    expect(canonical?.scope).toBe('article');
    expect(canonical?.freshness).toBe('realtime');
    expect(canonical?.key).toBe('article.views.canonical');
  });

  it('reconcileTraffic no mezcla fuentes incompatibles', () => {
    const traffic = {
      topArticles: [{ slug: 'inss-familiares', views: 19, sources: {} }],
      topSources: { direct: 10, social: 9 },
      dailyGrowth: { '2026-08-25': 19 },
      weeklyTrend: {},
      generatedAt: new Date().toISOString(),
    };
    const ri = reconcileTraffic(traffic, null, null);
    const trafficSource = ri.sources.find((s) => s.id === 'traffic');
    expect(trafficSource?.value).toBe(19);
    expect(trafficSource?.unit).toBe('visitas');
    expect(ri.gscClicks).toBeNull();
    expect(ri.ga4Users).toBeNull();
    expect(ri.hasData).toBe(true);
  });
});

// ─── 2. CASO ECLIPSE ─────────────────────────────────────────────

describe('Caso Eclipse — no es nacionales por ubicación', () => {
  it('clasifica noticia de eclipse como astronomía', () => {
    const result = detectContentProfile(
      'Eclipse lunar visible en Nicaragua este fin de semana',
      'El eclipse lunar será visible desde Managua, León y Granada. La Luna tomará un tono rojizo durante la noche del sábado.',
      'El eclipse lunar se verá en varias ciudades de Nicaragua.',
    );
    expect(result.profile_detected).toBe('astronomia');
    expect(result.profile_detected).not.toBe('espectaculos');
    expect(result.profile_detected).not.toBe('nacionales');
  });
});

// ─── 3. CASO INSS COMPLETO ───────────────────────────────────────

describe('Caso INSS — contenido completo', () => {
  it('isContentComplete devuelve COMPLETE para INSS', () => {
    expect(isContentComplete(baseArticle)).toBe(true);
  });

  it('generateImprovementRecommendations no pide profundizar un artículo completo', () => {
    const recs = generateImprovementRecommendations([baseArticle], { facebook: 0 });
    const expand = recs.filter((r) => /agregar contexto|profundic|ampliar/i.test(r.recommendedAction));
    expect(expand).toHaveLength(0);
  });

  it('filterAbsurdImprovementRecommendations bloquea "profundizar" en artículo completo', () => {
    const absurd = [
      {
        id: 'x',
        slug: baseArticle.slug,
        titulo: baseArticle.titulo,
        categoria: baseArticle.categoria,
        trigger: 'manual',
        observation: 'Artículo completo',
        recommendedAction: 'Profundizar el análisis con más datos.',
        evidence: [],
        priority: 'medium',
        createdAt: new Date().toISOString(),
      },
    ];
    const filtered = filterAbsurdImprovementRecommendations(absurd, [baseArticle]);
    expect(filtered).toHaveLength(0);
  });
});

// ─── 4. CEO VERDICT ──────────────────────────────────────────────

describe('CEO Verdict — salida completa y basada en datos', () => {
  it('produce todos los campos obligatorios', () => {
    const v = buildCeoVerdict(mockCeoInput());
    expect(v.status).toMatch(/VAS_BIEN|CORREGIR|LA_ESTAS_CAGANDO|SIN_EVIDENCIA/);
    expect(v.statusIcon).toBeDefined();
    expect(v.statusLabel).toBeDefined();
    expect(v.whatIsHappening).toContain('150 artículos');
    expect(v.whatMatters.length).toBeGreaterThanOrEqual(0);
    expect(v.whatToDoToday.length).toBeGreaterThanOrEqual(0);
    expect(v.niosRepairs.length).toBeGreaterThanOrEqual(0);
    expect(v.needsHuman.length).toBeGreaterThanOrEqual(0);
    expect(v.doNotDo.length).toBeGreaterThan(0);
    expect(v.expectedResult).toBeDefined();
    expect(v.confidence).toBeGreaterThanOrEqual(0);
    expect(v.confidence).toBeLessThanOrEqual(100);
    expect(v.evidence.length).toBeGreaterThan(0);
  });

  it('GSC bloqueado + GA4 + tráfico interno = CEO sigue operando', () => {
    const v = buildCeoVerdict(
      mockCeoInput({
        gsc: { status: 'ACCESS_BLOCKED' } as any,
        trafficIntelligence: {
          ...mockCeoInput().trafficIntelligence,
          sources: [
            { id: 'traffic', name: 'Traffic Log', status: 'REAL', value: 700, unit: 'visitas', note: '7 días' },
            { id: 'gsc', name: 'GSC', status: 'ACCESS_BLOCKED', value: null, unit: 'clics', note: 'Bloqueado' },
            { id: 'ga4', name: 'GA4', status: 'REAL', value: 120, unit: 'usuarios', note: '7 días' },
          ],
        },
      }),
    );
    expect(v.status).not.toBe('LA_ESTAS_CAGANDO');
    expect(v.evidence.some((e) => e.source === 'GSC' && e.status === 'ACCESS_BLOCKED')).toBe(true);
    expect(v.niosRepairs).toContain('Verificar configuración GSC.');
    expect(v.doNotDo.some((d) => d.includes('No sumar') && d.includes('visitas') && d.includes('usuarios'))).toBe(true);
  });
});

// ─── 5. GSC DEGRADED + CONTRADICTORIAS ───────────────────────────

describe('GSC degraded y métricas contradictorias', () => {
  it('reconcileTraffic reporta GSC como NO_DATA sin romper otras fuentes', () => {
    const gsc = { status: 'NO_DATA', totalClicks: 0 } as any;
    const ga4 = { status: 'REAL', totalUsers: 120 } as any;
    const ri = reconcileTraffic(null, gsc, ga4);
    const gscSource = ri.sources.find((s) => s.id === 'gsc');
    expect(gscSource?.status).toBe('NO_DATA');
    expect(ri.ga4Users).toBe(120);
    expect(ri.hasData).toBe(true);
  });

  it('baja confianza cuando no hay fuentes', () => {
    const v = buildCeoVerdict(mockCeoInput({ trafficIntelligence: { ...mockCeoInput().trafficIntelligence, hasData: false }, gsc: null, ga4: null }));
    expect(v.status).toBe('SIN_EVIDENCIA');
    expect(v.confidence).toBeLessThan(50);
  });
});

// ─── 6. ESCENARIOS EJECUTIVOS ────────────────────────────────────

describe('Escenarios de decisión ejecutiva', () => {
  it('A: artículo de calidad con tráfico bajo → no profundizar', () => {
    // Bajo tráfico → no es "completo" por la definición de completitud,
    // pero al no ser Sucesos tampoco genera la recomendación de agregar contexto.
    const article = { ...baseArticle, ga4Pageviews: 5 };
    expect(isContentComplete(article)).toBe(false);
    const recs = generateImprovementRecommendations([article], {});
    const absurd = recs.filter((r) => /profundic|ampliar|agregar contexto/i.test(r.recommendedAction));
    expect(absurd).toHaveLength(0);
  });

  it('B: completo + buen SEO + alto alcance social pero 0 clics → problema de conversión social', () => {
    const socialArticle = { ...baseArticle, hasGscData: true, gscImpressions: 0, gscClicks: 0, gscCtr: 0 };
    const recs = generateImprovementRecommendations([socialArticle], { facebook: 5000, instagram: 0, twitter: 0 });
    const socialRec = recs.find((r) => r.trigger === 'social-zero-google');
    expect(socialRec).toBeDefined();
    expect(socialRec?.recommendedAction).toContain('evergreen');
  });

  it('C: suceso corto incompleto → recomienda completar', () => {
    const incomplete = { ...baseArticle, categoria: 'Sucesos', palabras: 250, scoreMeni: 70, ga4Pageviews: 120 };
    const recs = generateImprovementRecommendations([incomplete], {});
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => /agregar contexto|completar/i.test(r.recommendedAction))).toBe(true);
  });

  it('D: métricas contradictorias → CEO reporta cada fuente con su propia unidad', () => {
    // GSC 0 clics vs GA4 120 usuarios vs Traffic 700 visitas.
    // No son la misma métrica; CEO las mantiene separadas y no las suma.
    const v = buildCeoVerdict(mockCeoInput());
    const trafficEvidence = v.evidence.find((e) => e.source === 'Traffic');
    const ga4Evidence = v.evidence.find((e) => e.source === 'GA4');
    const gscEvidence = v.evidence.find((e) => e.source === 'GSC');
    expect(trafficEvidence).toBeDefined();
    expect(ga4Evidence).toBeDefined();
    expect(gscEvidence).toBeDefined();
    // Evidencia de GSC reporta clics y GA4 reporta usuarios, nunca sumados.
    expect(ga4Evidence?.note).toContain('usuarios');
    expect(gscEvidence?.note).not.toContain('usuarios');
  });

  it('E: GSC bloqueado + GA4 + internas → CEO operativo parcial', () => {
    const v = buildCeoVerdict(mockCeoInput({ gsc: { status: 'ACCESS_BLOCKED' } as any }));
    expect(v.status).toMatch(/CORREGIR|VAS_BIEN/);
    expect(v.evidence.some((e) => e.source === 'GSC' && e.status === 'ACCESS_BLOCKED')).toBe(true);
    expect(v.evidence.some((e) => e.source === 'GA4' && e.status === 'REAL')).toBe(true);
  });

  it('F: todas las fuentes disponibles y consistentes → confidence mayor', () => {
    const v = buildCeoVerdict(
      mockCeoInput({
        gsc: { status: 'REAL', totalClicks: 120 } as any,
        trust: { averageGoogleTrustScore: 85 } as any,
      }),
    );
    expect(v.status).toBe('VAS_BIEN');
    expect(v.confidence).toBeGreaterThan(70);
  });
});
