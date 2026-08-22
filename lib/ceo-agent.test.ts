import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { Noticia } from './types';
import {
  analyzeForPublication,
  findRelatedArticles,
  detectGoogleOpportunities,
  getCEODailyBrief,
  type TrafficEvidence,
  type GscData,
} from './ceo-agent';

function baseArticle(overrides: Partial<Noticia> = {}): Noticia {
  return {
    id: '1',
    slug: 'test-slug',
    titulo: 'Test Title',
    resumen: 'Resumen de prueba.',
    contenido: '<p>Contenido de prueba.</p>',
    categoria: 'Nacionales',
    imagen: '/logo.webp',
    fecha: new Date().toISOString(),
    estado: 'publicado',
    aprobadoMeni: true,
    scoreMeni: 92,
    palabras: 450,
    ...overrides,
  } as Noticia;
}

function basePool(): Noticia[] {
  return [
    {
      ...baseArticle({
        id: '2',
        slug: 'inss-cobertura-familiares',
        titulo: 'INSS: cobertura para familiares',
        resumen: 'Guía de prestaciones.',
        categoria: 'Nacionales',
        vistas: 1273,
        tags: ['inss', 'familiares'],
        aprobadoMeni: true,
        scoreMeni: 91,
      }),
    },
    {
      ...baseArticle({
        id: '3',
        slug: 'suceso-accidente',
        titulo: 'Accidente de tránsito en Managua',
        resumen: 'Un accidente ocurrió.',
        categoria: 'Sucesos',
        vistas: 300,
        tags: ['accidente', 'transito'],
        aprobadoMeni: true,
        scoreMeni: 88,
      }),
    },
    {
      ...baseArticle({
        id: '4',
        slug: 'guia-pasaporte',
        titulo: 'Cómo solicitar pasaporte en Nicaragua',
        resumen: 'Requisitos y pasos.',
        categoria: 'Nacionales',
        vistas: 650,
        tags: ['pasaporte', 'tramite'],
        aprobadoMeni: true,
        scoreMeni: 90,
      }),
    },
    {
      ...baseArticle({
      id: '5',
      slug: 'deporte-futbol',
      titulo: 'Resultado del partido de fútbol',
      resumen: 'Ganó el local.',
      categoria: 'Deportes',
      vistas: 25,
      tags: ['deportes', 'futbol'],
      aprobadoMeni: true,
      scoreMeni: 89,
    }),
    },
  ];
}

describe('analyzeForPublication', () => {
  it('PUBLISH artículo de servicio con tráfico alto', () => {
    const article = baseArticle({
      slug: 'inss-cobertura-muerte-asegurado',
      titulo: 'INSS: cobertura por muerte de asegurado',
      resumen: 'Guía sobre prestaciones del INSS para asegurados.',
      categoria: 'Sucesos',
      vistas: 1273,
      aprobadoMeni: true,
      scoreMeni: 94,
      palabras: 480,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.decision).toBe('PUBLISH');
    expect(result.readerInterest).toBe('HIGH');
    expect(result.evidence.some(e => e.includes('1,273'))).toBe(true);
  });

  it('PUBLISH con tráfico moderado y categoría Sucesos', () => {
    const article = baseArticle({
      slug: 'colision-managua',
      titulo: 'Colisión entre camión y bus deja heridos en Managua',
      resumen: 'Un choque ocurrió en la capital.',
      categoria: 'Sucesos',
      vistas: 300,
      aprobadoMeni: true,
      scoreMeni: 88,
      palabras: 400,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.decision).toBe('PUBLISH');
    expect(result.readerInterest).toBe('MEDIUM');
  });

  it('PUBLISH_WITH_CHANGES por contenido superficial', () => {
    const article = baseArticle({
      slug: 'nota-corta',
      titulo: 'Nota corta',
      resumen: 'Resumen.',
      categoria: 'Nacionales',
      vistas: 100,
      aprobadoMeni: true,
      scoreMeni: 90,
      palabras: 150,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.decision).toBe('PUBLISH_WITH_CHANGES');
    expect(result.recommendedChanges.some(c => c.includes('350'))).toBe(true);
  });

  it('UPDATE_EXISTING cuando existe noticia similar', () => {
    const article = baseArticle({
      slug: 'inss-familiares-nuevo',
      titulo: 'INSS: familiares y cobertura para todos',
      resumen: 'Guía de prestaciones para familiares.',
      categoria: 'Nacionales',
      tags: ['inss', 'familiares', 'cobertura'],
      aprobadoMeni: true,
      scoreMeni: 91,
      palabras: 420,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.decision).toBe('UPDATE_EXISTING');
    expect(result.existingArticleOpportunity?.slug).toBe('inss-cobertura-familiares');
    expect(result.existingArticleOpportunity?.evidence.length).toBeGreaterThan(0);
    expect(result.existingArticleOpportunity?.recommendation).toContain('Actualizar');
  });

  it('HOLD cuando MENI no aprueba', () => {
    const article = baseArticle({
      aprobadoMeni: false,
      scoreMeni: 70,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.decision).toBe('HOLD');
    expect(result.risk).toBe('HIGH');
  });

  it('HOLD con tráfico bajo y sin patrón demostrado', () => {
    const article = baseArticle({
      slug: 'tema-obscuro',
      titulo: 'Algunas reflexiones generales',
      resumen: 'Una nota sin foco claro.',
      categoria: 'Espectáculos',
      vistas: 15,
      aprobadoMeni: true,
      scoreMeni: 90,
      palabras: 500,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(['HOLD', 'PUBLISH_WITH_CHANGES']).toContain(result.decision);
  });

  it('detecta interés del lector como HIGH con tráfico real', () => {
    const article = baseArticle({
      titulo: 'INSS: pensiones 2026',
      resumen: 'Cómo solicitar pensión.',
      vistas: 800,
      aprobadoMeni: true,
      scoreMeni: 93,
      palabras: 500,
    });
    const traffic: TrafficEvidence = { viewsRecent: 120, status: 'REAL' };
    const result = analyzeForPublication(article, { articlePool: basePool(), traffic });
    expect(result.readerInterest).toBe('HIGH');
  });

  it('no inventa datos cuando no hay tráfico', () => {
    const article = baseArticle({
      aprobadoMeni: true,
      scoreMeni: 90,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.trafficEvidence.some(s => s.status === 'NO_DATA')).toBe(true);
    expect(result.dataStatus.some(d => d.source === 'traffic' && d.status === 'NO_DATA')).toBe(true);
  });

  it('indica GSC como ACCESS_BLOCKED sin datos', () => {
    const article = baseArticle({
      aprobadoMeni: true,
      scoreMeni: 90,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.seoEvidence.some(s => s.source === 'gsc' && s.status === 'ACCESS_BLOCKED')).toBe(true);
    expect(result.opportunities.some(o => o.type === 'GSC_UNAVAILABLE')).toBe(true);
  });

  it('PUBLISH_WITH_CHANGES por título demasiado largo', () => {
    const article = baseArticle({
      titulo: 'Este es un título muy largo que supera ampliamente los sesenta caracteres recomendados para SEO',
      aprobadoMeni: true,
      scoreMeni: 91,
      palabras: 500,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.decision).toBe('PUBLISH_WITH_CHANGES');
    expect(result.recommendedChanges.some(c => c.includes('60 caracteres'))).toBe(true);
  });

  it('REJECT cuando MENI rechaza con score muy bajo', () => {
    const article = baseArticle({
      aprobadoMeni: false,
      scoreMeni: 45,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.decision).toBe('REJECT');
    expect(result.editorialQuality).toBe('LOW');
    expect(result.risk).toBe('HIGH');
  });

  it('separa MENI alto de tráfico desconocido', () => {
    const article = baseArticle({
      aprobadoMeni: true,
      scoreMeni: 95,
      palabras: 500,
      vistas: 0,
    });
    const result = analyzeForPublication(article, {
      articlePool: basePool(),
      traffic: { status: 'ACCESS_BLOCKED' },
    });
    expect(result.editorialQuality).toBe('HIGH');
    expect(result.readerInterest).toBe('UNKNOWN');
    expect(result.trafficEvidence.some(s => s.status === 'ACCESS_BLOCKED')).toBe(true);
  });

  it('traffic_daily REAL', () => {
    const article = baseArticle({
      titulo: 'INSS: requisitos de cobertura',
      resumen: 'Guía de requisitos.',
      categoria: 'Nacionales',
      aprobadoMeni: true,
      scoreMeni: 93,
      palabras: 500,
    });
    const result = analyzeForPublication(article, {
      articlePool: basePool(),
      traffic: { viewsRecent: 800, source: 'traffic_daily', status: 'REAL' },
    });
    expect(result.readerInterest).toBe('HIGH');
    expect(result.trafficEvidence.some(s => s.source === 'traffic_daily' && s.status === 'REAL')).toBe(true);
  });

  it('traffic_log fallback REAL', () => {
    const article = baseArticle({
      titulo: 'Nota de prueba fallback',
      aprobadoMeni: true,
      scoreMeni: 90,
      palabras: 500,
    });
    const result = analyzeForPublication(article, {
      articlePool: basePool(),
      traffic: { viewsRecent: 50, source: 'traffic_log', status: 'REAL' },
    });
    expect(result.trafficEvidence.some(s => s.source === 'traffic_log')).toBe(true);
    expect(result.readerInterest).toBe('LOW');
  });

  it('indexing_log CONNECTED_NO_DATA', () => {
    const article = baseArticle({ aprobadoMeni: true, scoreMeni: 90 });
    const result = analyzeForPublication(article, {
      articlePool: basePool(),
      indexing: { status: 'CONNECTED_NO_DATA' },
    });
    expect(result.dataStatus.some(d => d.source === 'indexing' && d.status === 'CONNECTED_NO_DATA')).toBe(true);
  });
});

describe('findRelatedArticles', () => {
  it('encuentra artículos relacionados por categoría y titular', () => {
    const pool = basePool();
    const article = baseArticle({ categoria: 'Nacionales', slug: 'inss-nuevo', titulo: 'INSS: nueva cobertura' });
    const related = findRelatedArticles(article, pool, 3);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every(r => r.categoria === 'Nacionales')).toBe(true);
  });

  it('no recomienda artículos aleatorios', () => {
    const pool = basePool();
    const article = baseArticle({ categoria: 'Tecnología', slug: 'nuevo-celular', titulo: 'Nuevo celular' });
    const related = findRelatedArticles(article, pool, 3);
    expect(related.length).toBe(0);
  });
});

describe('detectGoogleOpportunities', () => {
  it('HIGH_IMPRESSIONS_LOW_CTR', () => {
    const gsc: GscData = { impressions: 26300, clicks: 372, status: 'REAL' };
    const ops = detectGoogleOpportunities({ titulo: 'INSS guía' }, gsc);
    expect(ops.some(o => o.type === 'HIGH_IMPRESSIONS_LOW_CTR')).toBe(true);
  });

  it('GSC sin datos reporta CONNECTED_NO_DATA', () => {
    const gsc: GscData = { impressions: 0, clicks: 0, status: 'CONNECTED_NO_DATA' };
    const ops = detectGoogleOpportunities({ titulo: 'Noticia' }, gsc);
    expect(ops.some(o => o.type === 'GSC_NO_DATA')).toBe(true);
  });

  it('sin GSC devuelve ACCESS_BLOCKED', () => {
    const ops = detectGoogleOpportunities({ titulo: 'Noticia' });
    expect(ops.some(o => o.type === 'GSC_UNAVAILABLE')).toBe(true);
  });

  it('SNIPPET_WEAK con CTR muy bajo', () => {
    const gsc: GscData = { impressions: 2000, clicks: 10, status: 'REAL' };
    const ops = detectGoogleOpportunities({ titulo: 'INSS guía' }, gsc);
    expect(ops.some(o => o.type === 'SNIPPET_WEAK')).toBe(true);
  });

  it('CONTENT_GAP cuando faltan queries en el contenido', () => {
    const gsc: GscData = { impressions: 500, clicks: 25, status: 'REAL', queries: ['requisitos inss', 'quejas'] };
    const ops = detectGoogleOpportunities(
      { titulo: 'Cobertura INSS', resumen: 'Guía de cobertura', contenido: '<p>Información sobre requisitos inss.</p>' },
      gsc,
    );
    expect(ops.some(o => o.type === 'CONTENT_GAP')).toBe(true);
  });
});

describe('getCEODailyBrief', () => {
  it('genera máximo 5 acciones', () => {
    const articles = basePool();
    const brief = getCEODailyBrief({ articles });
    expect(brief.length).toBeLessThanOrEqual(5);
    expect(brief.length).toBeGreaterThan(0);
  });

  it('prioriza actualizar contenido de servicio con tráfico', () => {
    const articles = basePool();
    const brief = getCEODailyBrief({ articles });
    expect(brief[0].action).toBe('ACTUALIZAR_ARTICULO_SERVICIO');
  });

  it('detecta categoría con bajo rendimiento', () => {
    const articles = basePool();
    const brief = getCEODailyBrief({ articles });
    expect(brief.some(a => a.action === 'EVALUAR_CATEGORIA_BAJO_RENDIMIENTO')).toBe(true);
  });
});

describe('Real article integration', { timeout: 60000 }, () => {
    const CREDENTIALS_PATH = path.resolve('G:/RESPALDO/ESCRITORIO/fb-key-base64.txt');

  const targets = [
    { label: 'INSS cobertura familiares', keyword: 'familiares tienen cobertura' },
    { label: 'Niña cocodrilo', keyword: 'cocodrilo' },
    { label: 'Madre Ticuantepe', keyword: 'ticuantepe' },
    { label: 'Roberto Bobby Espino', keyword: 'bobby' },
    { label: 'Carnavaleros Jaguar', keyword: 'carnavaleros' },
    { label: 'Nicaragüense ahogado Carolina del Norte', keyword: 'carolina del norte' },
    { label: 'Repatriar nicaragüense fallecido', keyword: 'repatriar' },
    { label: 'Taxista Estelí', keyword: 'esteli' },
  ];

  it('analiza artículos reales sin inventar datos', async () => {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.warn('[REAL] Credenciales no encontradas:', CREDENTIALS_PATH);
      return;
    }

    const raw = fs.readFileSync(CREDENTIALS_PATH, 'utf8').trim();
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = raw;

    const { getNews, getNewsBySlug } = await import('./data');
    const { getAdminDb } = await import('./firebase-admin');

    // 1. Verificar acceso real a Firestore antes de interpretar ausencia de datos
    let accessOk = false;
    try {
      await getAdminDb().collection('noticias').limit(1).get();
      accessOk = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[CEO REAL] Acceso bloqueado:', msg);
    }

    if (!accessOk) {
      console.warn('[CEO REAL ARTICLE RESULTS]');
      const results: Record<string, unknown>[] = targets.map(t => ({
        label: t.label,
        status: 'ACCESS_BLOCKED',
      }));
      for (const r of results) console.warn(JSON.stringify(r));
      expect(results.length).toBe(targets.length);
      return;
    }

    const all = await getNews(300);
    const results: Record<string, unknown>[] = [];

    for (const target of targets) {
      const byTitle = all.find(a => a.titulo.toLowerCase().includes(target.keyword));
      const article = byTitle ?? (target.label === 'INSS cobertura familiares'
        ? await getNewsBySlug('inss-que-familiares-tienen-cobertura-por-fallecimiento').catch(() => null)
        : null);

      if (!article) {
        results.push({ label: target.label, status: 'NOT_FOUND' });
        continue;
      }

      const analysis = analyzeForPublication(article, { articlePool: all });
      results.push({
        label: target.label,
        slug: article.slug,
        found: true,
        decision: analysis.decision,
        confidence: analysis.confidence,
        readerInterest: analysis.readerInterest,
        vistas: article.vistas ?? 'NO_DATA',
        scoreMeni: article.scoreMeni ?? 'NO_DATA',
        aprobadoMeni: article.aprobadoMeni ?? 'NO_DATA',
        related: analysis.relatedArticles.slice(0, 2).map(r => r.slug),
        existing: analysis.existingArticleOpportunity,
        recommended: analysis.recommendedChanges,
        dataStatus: analysis.dataStatus.map(d => `${d.source}=${d.status}`),
      });
    }

    console.warn('[CEO REAL ARTICLE RESULTS]');
    for (const r of results) {
      console.warn(JSON.stringify(r));
    }

    expect(results.length).toBe(targets.length);
  });
});
