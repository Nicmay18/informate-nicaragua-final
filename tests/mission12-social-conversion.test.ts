import { describe, it, expect } from 'vitest';
import {
  buildSocialWebFunnel,
  buildSocialConversionVerdict,
  fetchFacebookSnapshot,
  type FacebookSnapshot,
  type SocialConversionInput,
} from '@/lib/nios/intelligence/social-conversion';
import { getMetricDefinition } from '@/lib/nios/intelligence/metric-truth';

const baseInput = (
  overrides: Partial<SocialConversionInput> = {},
): SocialConversionInput => ({
  facebook: null,
  ga4: null,
  traffic: null,
  articles: [],
  ...overrides,
});

const realFacebook = (extra: Partial<FacebookSnapshot> = {}): FacebookSnapshot => ({
  source: 'Meta',
  status: 'REAL',
  collectedAt: new Date().toISOString(),
  periodDays: 28,
  reach: 10_000,
  impressions: 12_000,
  reproductions: 500,
  reactions: 300,
  comments: 50,
  shares: 20,
  linkClicks: 150,
  outboundClicks: 180,
  ...extra,
});

describe('Mission 12 — Facebook → Web Conversion Intelligence', () => {
  it('1. mucho alcance + pocos clicks → CONVERSION_PROBLEM', () => {
    const verdict = buildSocialConversionVerdict(
      baseInput({
        facebook: realFacebook({ reach: 100_000, linkClicks: 100 }),
      }),
    );
    expect(verdict.mainProblem).toBe('CONVERSION_PROBLEM');
    expect(verdict.doNotDo.some((d) => d.includes('No impulsar'))).toBe(true);
  });

  it('2. muchos clicks + pocas sesiones → SOCIAL_TO_WEB_PROBLEM', () => {
    const verdict = buildSocialConversionVerdict(
      baseInput({
        facebook: realFacebook({ reach: 10_000, linkClicks: 1_000 }),
        ga4: {
          status: 'REAL',
          sources: [{ source: 'facebook', sessions: 100, users: 90, screenPageviews: 120, engagementRate: 0.5 }],
        },
      }),
    );
    expect(verdict.mainProblem).toBe('SOCIAL_TO_WEB_PROBLEM');
  });

  it('3. muchas sesiones + poca lectura → POST_CLICK_PROBLEM', () => {
    const verdict = buildSocialConversionVerdict(
      baseInput({
        facebook: realFacebook({ reach: 10_000, linkClicks: 500 }),
        ga4: {
          status: 'REAL',
          sources: [{ source: 'facebook', sessions: 400, users: 380, screenPageviews: 420, engagementRate: 0.5 }],
        },
        articles: [{ slug: 'x', ga4Pageviews: 50, vistas: 50 }],
      }),
    );
    expect(verdict.mainProblem).toBe('POST_CLICK_PROBLEM');
  });

  it('4. sin Meta → NOT_CONFIGURED', async () => {
    process.env.FB_PAGE_ACCESS_TOKEN = '';
    process.env.FB_PAGE_ID = '';
    const fb = await fetchFacebookSnapshot();
    expect(fb.status).toBe('NOT_CONFIGURED');
    const verdict = buildSocialConversionVerdict(baseInput({ facebook: fb }));
    expect(verdict.status).toBe('EVIDENCIA_INSUFICIENTE');
  });

  it('5. sin GA4 continúa con fuentes disponibles', () => {
    const verdict = buildSocialConversionVerdict(
      baseInput({
        facebook: realFacebook(),
        ga4: null,
        traffic: { topSources: { facebook: 120 } },
      }),
    );
    expect(verdict.status).not.toBe('EVIDENCIA_INSUFICIENTE');
    expect(verdict.evidence.some((e) => e.source === 'Meta')).toBe(true);
  });

  it('6. métricas incompatibles no se suman', () => {
    const funnel = buildSocialWebFunnel(
      baseInput({
        facebook: realFacebook(),
        ga4: { status: 'REAL', sources: [{ source: 'facebook', sessions: 120, users: 100, screenPageviews: 150, engagementRate: 0.5 }] },
        articles: [{ slug: 'x', ga4Pageviews: 80, vistas: 80 }],
      }),
    );
    expect(funnel.reach?.definition.unit).toBe('cuentas');
    expect(funnel.webSessions?.definition.unit).toBe('sesiones');
    expect(funnel.articleViews?.definition.unit).toBe('vistas');
    expect(funnel.reach?.value).not.toBe(funnel.webSessions?.value);
  });

  it('7. artículo completo + Facebook débil no recomienda profundizar', () => {
    const verdict = buildSocialConversionVerdict(
      baseInput({
        facebook: realFacebook({ reach: 100_000, linkClicks: 100 }),
      }),
    );
    expect(verdict.actions.some((a) => a.includes('profundizar') || a.includes('contenido'))).toBe(false);
    expect(verdict.mainProblem).toBe('CONVERSION_PROBLEM');
  });

  it('8. artículo completo + Facebook excelente no tocar innecesariamente', () => {
    const verdict = buildSocialConversionVerdict(
      baseInput({
        facebook: realFacebook({ reach: 10_000, linkClicks: 1_000 }),
        ga4: { status: 'REAL', sources: [{ source: 'facebook', sessions: 900, users: 850, screenPageviews: 1_000, engagementRate: 0.6 }] },
        articles: [{ slug: 'x', ga4Pageviews: 800, vistas: 800 }],
      }),
    );
    expect(verdict.mainProblem).toBe('NONE');
    expect(verdict.doNotDo.some((d) => d.includes('No tocar'))).toBe(true);
  });

  it('9. contenido incompleto + alta conversión no genera recomendación de completar desde este módulo', () => {
    // El módulo social no mezcla recomendaciones editoriales; se limita a conversión.
    const verdict = buildSocialConversionVerdict(
      baseInput({
        facebook: realFacebook(),
        ga4: { status: 'REAL', sources: [{ source: 'facebook', sessions: 500, users: 480, screenPageviews: 550, engagementRate: 0.6 }] },
        articles: [{ slug: 'x', ga4Pageviews: 450, vistas: 450 }],
      }),
    );
    expect(verdict.mainProblem).toBe('NONE');
    expect(verdict.actions.some((a) => a.includes('completar'))).toBe(false);
  });

  it('10. atribución incierta reduce confidence', () => {
    const verdict = buildSocialConversionVerdict(
      baseInput({
        facebook: realFacebook(),
        ga4: null,
        traffic: { topSources: { facebook: 50 } },
      }),
    );
    expect(verdict.conversion.attributionConfidence).toBe('LOW');
    expect(verdict.confidence).toBeLessThan(60);
  });

  it('catálogo metric-truth incluye métricas sociales', () => {
    expect(getMetricDefinition('social.facebook.reach')).toBeDefined();
    expect(getMetricDefinition('social.facebook.linkClicks')).toBeDefined();
    expect(getMetricDefinition('social.facebook.webSessions')).toBeDefined();
  });
});
