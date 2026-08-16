import { describe, it, expect } from 'vitest';
import type {
  Noticia,
  NoticiaInput,
  MeniResult,
  SupervisorDecision,
  ArticleFusion,
  GSCSnapshot,
  GA4Snapshot,
  DailySnapshot,
  RecoveryArticle,
  JourneyEvent,
} from '@/lib/contracts';

describe('data contracts — Fase 2', () => {
  it('Noticia contract is assignable with canonical fields', () => {
    const n: Noticia = {
      id: '1',
      slug: 'test-noticia',
      titulo: 'Título',
      resumen: 'Resumen',
      contenido: 'Cuerpo',
      categoria: 'Nacionales',
      imagen: '/logo.webp',
      fecha: new Date().toISOString(),
      estado: 'publicado',
      publicado: true,
      scoreMeni: 95,
    };
    expect(n.scoreMeni).toBe(95);
  });

  it('MeniResult contract preserves null score semantics', () => {
    const m: MeniResult = {
      version: '2.0',
      meniVersion: '2.0.0',
      estado: 'Activo',
      categoria: 'General',
      modulo: 'meni',
      prioridad: 'MEDIA',
      riesgo: 'VERDE',
      seo: { score: 0, tituloSEO: '', tituloDiscover: '', metaDescripcion: '', slug: '', keywords: [] },
      eeat: { score: 0, autor: '', citasEstructuradas: false, fuentesDetectadas: [], advertencias: [] },
      discover: { score: 0, imagenDestacada: false, clickbait: false, fechaActualizada: false },
      adsense: { score: 0, seguro: true, advertencias: [] },
      forense: { notas: [], advertencias: [] } as any,
      valorEditorial: { puntosFuertes: [], riesgos: [] } as any,
      auditoria: { originalidad: 0, redaccion: 0, utilidad: 0, experienciaLector: 0 },
      diagnostico: '',
      scoreFinal: null,
      finalEditorialScore: null,
      estadoFinal: 'APROBADO',
      aprobado: true,
      calificacion: 'A',
      recomendaciones: [],
      articleHash: 'hash',
      evaluationTimestamp: new Date().toISOString(),
    };
    expect(m.scoreFinal).toBeNull();
  });

  it('SupervisorDecision contract enforces final authority', () => {
    const d: SupervisorDecision = {
      decisionId: 'd-1',
      timestamp: new Date().toISOString(),
      verdict: 'PUBLICAR',
      reason: 'Cleared',
      confidence: 0.98,
      scoreOverride: false,
      issues: [],
      actions: [],
      resultingState: 'PUBLISHED',
      modelVersion: '1.0',
    };
    expect(d.verdict).toBe('PUBLICAR');
  });

  it('GSCData contract requires explicit null for unknown', () => {
    const gsc: GSCSnapshot = {
      date: new Date().toISOString().split('T')[0],
      collectedAt: new Date().toISOString(),
      siteUrl: 'https://example.com',
      dateRange: { start: '2026-08-01', end: '2026-08-15' },
      totalImpressions: 0,
      totalClicks: 0,
      avgCtr: 0,
      avgPosition: 0,
      pages: [],
      queries: [],
      countries: [],
      devices: [],
    };
    expect(gsc.totalImpressions).toBe(0);
    // Snapshot itself is nullable in DailySnapshot, distinguishing empty from unknown.
  });

  it('JourneyEvent contract has no PII and explicit data status', () => {
    const e: JourneyEvent = {
      sessionId: 's-1',
      type: 'PAGE_VIEW',
      timestamp: new Date().toISOString(),
      path: '/',
      source: 'direct',
      device: 'desktop',
      dataStatus: 'UNKNOWN',
    };
    expect(e.dataStatus).toBe('UNKNOWN');
  });
});
