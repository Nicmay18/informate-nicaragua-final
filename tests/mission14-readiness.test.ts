import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateNiosDiagnostics } from '@/lib/nios/intelligence/diagnostics';
import { checkFirebaseHealth } from '@/lib/nios/intelligence/firebase-health';
import { buildCeoVerdict } from '@/lib/nios/ceo-verdict';
import { DATA_STATUS_LABELS } from '@/lib/nios/intelligence/types';
import * as firebaseAdmin from '@/lib/firebase-admin';

describe('Mission 14 — NIOS Production Readiness', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('1. GSC TIMEOUT produce diagnóstico explícito con acción de reintento', () => {
    const ds = generateNiosDiagnostics(
      {
        status: 'TIMEOUT',
        collectedAt: new Date().toISOString(),
        siteUrl: 'https://nicaraguainformate.com',
        errorMessage: 'timeout',
      } as any,
      null,
    );
    const gsc = ds.find((d) => d.source === 'GSC');
    expect(gsc?.id).toBe('gsc-timeout');
    expect(gsc?.status).toBe('TIMEOUT');
    expect(gsc?.action).toBe('RETRY_LATER');
    expect(gsc?.severity).toBe('high');
  });

  it('2. GSC NETWORK_ERROR produce diagnóstico explícito', () => {
    const ds = generateNiosDiagnostics(
      {
        status: 'NETWORK_ERROR',
        collectedAt: new Date().toISOString(),
        siteUrl: 'https://nicaraguainformate.com',
        errorMessage: 'ENOTFOUND',
      } as any,
      null,
    );
    const gsc = ds.find((d) => d.source === 'GSC');
    expect(gsc?.id).toBe('gsc-network-error');
    expect(gsc?.status).toBe('NETWORK_ERROR');
    expect(gsc?.action).toBe('RETRY_LATER');
  });

  it('3. GSC ACCESS_BLOCKED mantiene acción de autorización', () => {
    const ds = generateNiosDiagnostics(
      {
        status: 'ACCESS_BLOCKED',
        collectedAt: new Date().toISOString(),
        siteUrl: 'sc-domain:nicaraguainformate.com',
        errorMessage: 'permission denied',
      } as any,
      null,
    );
    const gsc = ds.find((d) => d.source === 'GSC');
    expect(gsc?.id).toBe('gsc-access-blocked');
    expect(gsc?.action).toBe('REQUIRES_HUMAN_AUTHORIZATION');
    expect(gsc?.severity).toBe('critical');
  });

  it('4. GSC CONFIG_REQUIRED identifica NIOS_GSC_SITE_URL', () => {
    const ds = generateNiosDiagnostics(
      {
        status: 'CONFIG_REQUIRED',
        collectedAt: new Date().toISOString(),
        siteUrl: '',
      } as any,
      null,
    );
    const gsc = ds.find((d) => d.source === 'GSC');
    expect(gsc?.id).toBe('gsc-config-required');
    expect(gsc?.variable).toBe('NIOS_GSC_SITE_URL');
  });

  it('5. DATA_STATUS_LABELS incluye TIMEOUT y NETWORK_ERROR', () => {
    expect(DATA_STATUS_LABELS.TIMEOUT).toBe('Tiempo de espera agotado');
    expect(DATA_STATUS_LABELS.NETWORK_ERROR).toBe('Error de red');
  });

  it('6. Firebase health reporta CREDENTIALS_MISSING sin env', async () => {
    vi.stubEnv('FIREBASE_PROJECT_ID', '');
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', '');
    vi.stubEnv('FIREBASE_PRIVATE_KEY', '');
    const health = await checkFirebaseHealth();
    expect(health.status).toBe('CREDENTIALS_MISSING');
    expect(health.clientEmail).toBe('NOT_SET');
    expect(health.confidence).toBe(0);
    expect(health.recommendedAction).toContain('FIREBASE_PROJECT_ID');
  });

  it('7. Firebase health reporta AUTH_FAILED si getAdminDb falla', async () => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'test-project');
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', 'sa@test.iam.gserviceaccount.com');
    vi.stubEnv('FIREBASE_PRIVATE_KEY', '-----BEGIN PRIVATE KEY-----\nfoo\n-----END PRIVATE KEY-----');
    vi.spyOn(firebaseAdmin, 'getAdminDb').mockImplementation(() => {
      throw new Error('auth/revoked');
    });
    const health = await checkFirebaseHealth();
    expect(health.status).toBe('AUTH_FAILED');
    expect(health.clientEmail).toContain('***@');
    expect(health.note).toContain('No se pudo inicializar');
  });

  it('8. Firebase health reporta CONNECTED con lectura de colecciones', async () => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'test-project');
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', 'sa@test.iam.gserviceaccount.com');
    vi.stubEnv('FIREBASE_PRIVATE_KEY', '-----BEGIN PRIVATE KEY-----\nfoo\n-----END PRIVATE KEY-----');
    const fakeSnap = { empty: true, docs: [] } as any;
    const fakeGet = vi.fn().mockResolvedValue(fakeSnap);
    const fakeLimit = { get: fakeGet } as any;
    const fakeQuery = { limit: () => fakeLimit } as any;
    const fakeCollection = { orderBy: () => fakeQuery } as any;
    const fakeDb = { collection: vi.fn().mockReturnValue(fakeCollection) } as any;
    vi.spyOn(firebaseAdmin, 'getAdminDb').mockReturnValue(fakeDb as any);
    const health = await checkFirebaseHealth();
    expect(health.status).toBe('CONNECTED');
    expect(health.readCount).toBeGreaterThan(0);
    expect(health.collectionsChecked.length).toBeGreaterThan(0);
  });

  it('9. CEO verdict no usa lenguaje dramático ni lenguaje ofensivo', () => {
    const v = buildCeoVerdict({
      articlesCount: 10,
      trafficIntelligence: { hasData: false, message: 'Sin datos', sources: [] },
      alerts: [],
      gsc: { status: 'NO_DATA' } as any,
      ga4: { status: 'NO_DATA' } as any,
      trust: null,
      socialConversion: { status: 'EVIDENCIA_INSUFICIENTE', mainProblem: 'NONE', confidence: 25, actions: [], doNotDo: [], facebook: { status: 'NOT_CONFIGURED' }, web: { sessions: 0, articleViews: 0, summary: '' }, conversion: { point: 'NONE', attributionConfidence: 'UNAVAILABLE' } } as any,
      snapshot: null,
      snapshotDate: null,
      google: null,
      adsense: null,
      traffic: null,
      meniLearning: null,
      learningPatterns: [],
      reliability: null,
      weekly: null,
      telemetry: null,
      telemetryHistory: [],
      ttlStatus: 'pendiente',
      contentOpportunity: null,
      categoryIntelligence: null,
      editorCEOReport: null,
      snapshotHistory: [],
      trends: null,
    });
    const combined = [v.status, v.statusLabel, v.whatIsHappening, ...v.whatMatters, ...v.whatToDoToday, ...v.doNotDo].join(' ');
    expect(combined).not.toMatch(/LA ESTÁS CAGANDO|LA CAGASTE|EL NEGOCIO ESTÁ FRACASANDO|TODO ESTÁ MAL|NO SIRVE/i);
    expect(['SALUDABLE', 'REQUIERE_ATENCION', 'RIESGO_CRITICO', 'EVIDENCIA_INSUFICIENTE']).toContain(v.status);
  });

  it('10. NO_DATA no se confunde con ZERO en evidencia', () => {
    const v = buildCeoVerdict({
      articlesCount: 10,
      trafficIntelligence: { hasData: false, message: 'Sin datos', sources: [] },
      alerts: [],
      gsc: { status: 'NO_DATA' } as any,
      ga4: { status: 'NO_DATA' } as any,
      trust: null,
      socialConversion: { status: 'EVIDENCIA_INSUFICIENTE', mainProblem: 'NONE', confidence: 25, actions: [], doNotDo: [], facebook: { status: 'NOT_CONFIGURED' }, web: { sessions: 0, articleViews: 0, summary: '' }, conversion: { point: 'NONE', attributionConfidence: 'UNAVAILABLE' } } as any,
      snapshot: null,
      snapshotDate: null,
      google: null,
      adsense: null,
      traffic: null,
      meniLearning: null,
      learningPatterns: [],
      reliability: null,
      weekly: null,
      telemetry: null,
      telemetryHistory: [],
      ttlStatus: 'pendiente',
      contentOpportunity: null,
      categoryIntelligence: null,
      editorCEOReport: null,
      snapshotHistory: [],
      trends: null,
    });
    const gscEvidence = v.evidence.find((e) => e.source === 'GSC');
    expect(gscEvidence?.status).toBe('NO_DATA');
    expect(gscEvidence?.note).toContain('Sin datos');
  });
});
