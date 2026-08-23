// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { generateNiosDiagnostics } from '@/lib/nios/intelligence/diagnostics';
import { generateRepairPlan } from '@/lib/nios/intelligence/repair-plan';
import { generateCEOStatusReport } from '@/lib/nios/intelligence/ceo-status';
import { mergeArticleData } from '@/lib/nios/intelligence/data-merger';
import { formatNiosMetric } from '@/lib/nios/intelligence/types';
import type { GSCSnapshot, GA4Snapshot } from '@/lib/nios/intelligence/types';
import type { Noticia } from '@/lib/types';

describe('Misión 10 — Diagnóstico, repair plan y CEO operativo', () => {
  beforeEach(() => {
    process.env.FIREBASE_CLIENT_EMAIL = 'nios-service@example.iam.gserviceaccount.com';
    process.env.NIOS_GSC_SITE_URL = 'https://nicaraguainformate.com';
    process.env.NIOS_GA4_PROPERTY_ID = '';
  });

  it('formatNiosMetric no convierte ACCESS_BLOCKED en cero', () => {
    expect(formatNiosMetric(0, 'ACCESS_BLOCKED', 'GSC')).toBe('GSC — Acceso bloqueado');
    expect(formatNiosMetric(0, 'CONFIG_REQUIRED', 'GA4')).toBe('GA4 — Configuración requerida');
    expect(formatNiosMetric(0, 'REAL', 'GSC')).toBe('0');
    expect(formatNiosMetric(1234, 'REAL', 'GA4')).toBe('1,234');
  });

  it('genera diagnóstico crítico para GSC ACCESS_BLOCKED con acción humana', () => {
    const gsc = {
      status: 'ACCESS_BLOCKED',
      siteUrl: 'https://nicaraguainformate.com',
      errorMessage: 'User does not have sufficient permission',
    } as unknown as GSCSnapshot;

    const diagnostics = generateNiosDiagnostics(gsc, null);
    const gscDiag = diagnostics.find((d) => d.source === 'GSC');

    expect(gscDiag).toBeDefined();
    expect(gscDiag!.severity).toBe('critical');
    expect(gscDiag!.status).toBe('ACCESS_BLOCKED');
    expect(gscDiag!.requiresHuman).toBe(true);
    expect(gscDiag!.autoFixAvailable).toBe(false);
    expect(gscDiag!.recommendedAction).toContain('Agregar la cuenta de servicio');
    expect(gscDiag!.impact).toContain('Google Trust');
  });

  it('genera diagnóstico crítico para GA4 CONFIG_REQUIRED con variable requerida', () => {
    const ga4 = {
      status: 'CONFIG_REQUIRED',
      propertyId: '',
      errorMessage: 'NIOS_GA4_PROPERTY_ID no está configurada.',
    } as unknown as GA4Snapshot;

    const diagnostics = generateNiosDiagnostics(null, ga4);
    const ga4Diag = diagnostics.find((d) => d.source === 'GA4');

    expect(ga4Diag).toBeDefined();
    expect(ga4Diag!.severity).toBe('critical');
    expect(ga4Diag!.status).toBe('CONFIG_REQUIRED');
    expect(ga4Diag!.variable).toBe('NIOS_GA4_PROPERTY_ID');
    expect(ga4Diag!.requiresHuman).toBe(true);
    expect(ga4Diag!.autoFixAvailable).toBe(false);
  });

  it('genera diagnóstico alto para GA4 INVALID_CONFIGURATION', () => {
    const ga4 = {
      status: 'INVALID_CONFIGURATION',
      propertyId: '525672447',
      errorMessage: '3 INVALID_ARGUMENT: property not found',
    } as unknown as GA4Snapshot;

    const diagnostics = generateNiosDiagnostics(null, ga4);
    const ga4Diag = diagnostics.find((d) => d.source === 'GA4');

    expect(ga4Diag).toBeDefined();
    expect(ga4Diag!.severity).toBe('high');
    expect(ga4Diag!.status).toBe('INVALID_CONFIGURATION');
    expect(ga4Diag!.requiresHuman).toBe(true);
  });

  it('AdSense se documenta como NOT_CONFIGURED sin bloquear', () => {
    delete process.env.GOOGLE_ADSENSE_CLIENT_ID;
    const diagnostics = generateNiosDiagnostics(null, null);
    const adsense = diagnostics.find((d) => d.source === 'AdSense');

    expect(adsense).toBeDefined();
    expect(adsense!.status).toBe('NOT_CONFIGURED');
    expect(adsense!.severity).toBe('low');
    expect(adsense!.requiresHuman).toBe(true);
    expect(adsense!.impact).toContain('No bloquea');
  });

  it('repair plan clasifica acciones humanas críticas y da siguiente acción', () => {
    const gsc = {
      status: 'ACCESS_BLOCKED',
      siteUrl: 'https://nicaraguainformate.com',
      errorMessage: 'User does not have sufficient permission',
    } as unknown as GSCSnapshot;

    const ga4 = {
      status: 'CONFIG_REQUIRED',
      propertyId: '',
      errorMessage: 'NIOS_GA4_PROPERTY_ID no está configurada.',
    } as unknown as GA4Snapshot;

    const diagnostics = generateNiosDiagnostics(gsc, ga4);
    const plan = generateRepairPlan(diagnostics);

    expect(plan.health).toBe('critical');
    expect(plan.critical.length).toBeGreaterThan(0);
    expect(plan.humanActions.length).toBeGreaterThan(0);
    expect(plan.nextAction).toContain('Agregar la cuenta de servicio');
    expect(plan.autoFixes.length).toBe(0);
  });

  it('CEO status report habla con datos parciales sin detener NIOS', () => {
    const gsc = {
      status: 'ACCESS_BLOCKED',
      siteUrl: 'https://nicaraguainformate.com',
      errorMessage: 'User does not have sufficient permission',
    } as unknown as GSCSnapshot;

    const ga4 = {
      status: 'CONFIG_REQUIRED',
      propertyId: '',
      errorMessage: 'NIOS_GA4_PROPERTY_ID no está configurada.',
    } as unknown as GA4Snapshot;

    const diagnostics = generateNiosDiagnostics(gsc, ga4);
    const plan = generateRepairPlan(diagnostics);
    const status = generateCEOStatusReport('ACCESS_BLOCKED', 'CONFIG_REQUIRED', diagnostics, plan);

    expect(status.conversationReady).toBe(true);
    expect(status.canOperate).toBe(true);
    expect(status.health).toBe('critical');
    expect(status.data.find((d) => d.source === 'Facebook')).toEqual({
      source: 'Facebook',
      status: 'REAL',
      value: 23952,
      note: 'FACEBOOK_VIEWS aislado del site traffic.',
    });
    expect(status.observations.length).toBeGreaterThan(0);
    expect(status.recommendations.length).toBeGreaterThan(0);
    expect(status.recommendedNextAction).toContain('Agregar la cuenta de servicio');
  });

  it('CEO status report es healthy cuando GSC y GA4 son REAL', () => {
    const gsc = { status: 'REAL' } as unknown as GSCSnapshot;
    const ga4 = { status: 'REAL' } as unknown as GA4Snapshot;
    const diagnostics = generateNiosDiagnostics(gsc, ga4);
    const plan = generateRepairPlan(diagnostics);
    const status = generateCEOStatusReport('REAL', 'REAL', diagnostics, plan);

    expect(status.health).toBe('healthy');
    expect(status.canOperate).toBe(true);
    expect(status.criticalBlockers.length).toBe(0);
    expect(status.recommendations.every((r) => r.severity !== 'critical')).toBe(true);
  });

  it('data-merger diferencia REAL + 0 de ACCESS_BLOCKED', () => {
    const noticia: Noticia = {
      id: 'test-1',
      slug: 'test-article',
      titulo: 'Test',
      categoria: 'Nacionales',
      resumen: '',
      contenido: '',
      imagen: '',
      fecha: '2026-08-01T00:00:00.000Z',
      autor: 'Redacción',
      palabras: 300,
      scoreMeni: 95,
      tags: [],
      related_links: [],
      estado: 'publicado',
    } as Noticia;

    const realZeroGsc = {
      status: 'REAL',
      siteUrl: 'https://nicaraguainformate.com',
      date: '2026-08-23',
      collectedAt: '2026-08-23T00:00:00.000Z',
      dateRange: { start: '2026-08-16', end: '2026-08-23' },
      totalImpressions: 0,
      totalClicks: 0,
      avgCtr: 0,
      avgPosition: 0,
      pages: [{ url: 'https://nicaraguainformate.com/noticias/test-article', impressions: 0, clicks: 0, ctr: 0, position: 0 }],
      queries: [],
      countries: [],
      devices: [],
    } as unknown as GSCSnapshot;

    const blockedGsc = {
      status: 'ACCESS_BLOCKED',
      siteUrl: 'https://nicaraguainformate.com',
      date: '2026-08-23',
      collectedAt: '2026-08-23T00:00:00.000Z',
      dateRange: { start: '2026-08-16', end: '2026-08-23' },
      totalImpressions: 0,
      totalClicks: 0,
      avgCtr: 0,
      avgPosition: 0,
      pages: [],
      queries: [],
      countries: [],
      devices: [],
    } as unknown as GSCSnapshot;

    const [realZero] = mergeArticleData([noticia], realZeroGsc, null);
    expect(realZero.gscStatus).toBe('REAL');
    expect(realZero.hasGscData).toBe(true);
    expect(realZero.gscImpressions).toBe(0);

    const [blocked] = mergeArticleData([noticia], blockedGsc, null);
    expect(blocked.gscStatus).toBe('ACCESS_BLOCKED');
    expect(blocked.hasGscData).toBe(false);
    expect(blocked.gscImpressions).toBe(0);
  });
});
