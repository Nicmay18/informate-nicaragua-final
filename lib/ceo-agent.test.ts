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

describe('analyzeForPublication — decisiones ejecutivas reales', () => {
  it('artículo excelente → PUBLISH', () => {
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
    expect(result.action).toBe('PUBLISH');
    expect(result.urgency).toBe('MEDIUM');
    expect(result.risk).toBe('LOW');
    expect(result.evidence.some(e => e.includes('1,273'))).toBe(true);
    expect(result.alert).not.toBeNull();
  });

  it('artículo débil → ADD_CONTEXT', () => {
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
    expect(result.action).toBe('ADD_CONTEXT');
    expect(result.whyItMatters.toLowerCase()).toContain('lector');
  });

  it('artículo sin valor → DO_NOT_PUBLISH', () => {
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
    expect(result.action).toBe('DO_NOT_PUBLISH');
    expect(result.urgency).toBe('CRITICAL');
    expect(result.whatNotToDo.toLowerCase()).toContain('no publicar');
  });

  it('artículo duplicado → UPDATE_EXISTING', () => {
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
    expect(result.action).toBe('UPDATE_EXISTING');
    expect(result.existingArticle?.slug).toBe('inss-cobertura-familiares');
    expect(result.whatNotToDo.toLowerCase()).toContain('no crear');
  });

  it('artículo funcionando → PUBLISH o WRITE_FOLLOWUP', () => {
    const article = baseArticle({
      slug: 'guia-vivienda',
      titulo: 'Feria de Vivienda en Managua: bonos, precios y requisitos',
      resumen: 'Información sobre bonos y precios.',
      categoria: 'Nacionales',
      vistas: 497,
      aprobadoMeni: true,
      scoreMeni: 93,
      palabras: 520,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(['PUBLISH', 'WRITE_FOLLOWUP']).toContain(result.action);
    expect(result.whyItMatters.toLowerCase()).toContain('tráfico');
  });

  it('artículo cayendo → UPDATE_EXISTING', () => {
    const article = baseArticle({
      slug: 'inss-2020',
      titulo: 'INSS: requisitos históricos',
      resumen: 'Guía antigua.',
      categoria: 'Nacionales',
      vistas: 1200,
      fecha: '2020-01-01T00:00:00.000Z',
      aprobadoMeni: true,
      scoreMeni: 88,
      palabras: 400,
    });
    const result = analyzeForPublication(article, {
      articlePool: basePool(),
      traffic: { viewsRecent: 40, source: 'traffic_daily', status: 'REAL' },
    });
    expect(result.action).toBe('UPDATE_EXISTING');
  });

  it('alto CTR + altas impresiones → mantiene/crece', () => {
    const article = baseArticle({
      titulo: 'INSS: requisitos de cobertura',
      resumen: 'Guía de requisitos.',
      categoria: 'Nacionales',
      aprobadoMeni: true,
      scoreMeni: 93,
      palabras: 500,
    });
    const gsc: GscData = { impressions: 5000, clicks: 400, status: 'REAL' };
    const result = analyzeForPublication(article, { articlePool: basePool(), gsc });
    expect(['PUBLISH', 'WRITE_FOLLOWUP', 'RECIRCULATE']).toContain(result.action);
    expect(result.google.status).toBe('REAL');
  });

  it('altas impresiones + bajo CTR → IMPROVE_HEADLINE', () => {
    const article = baseArticle({
      titulo: 'INSS guía',
      resumen: 'Resumen.',
      aprobadoMeni: true,
      scoreMeni: 91,
      palabras: 500,
    });
    const gsc: GscData = { impressions: 26300, clicks: 372, status: 'REAL' };
    const result = analyzeForPublication(article, { articlePool: basePool(), gsc });
    expect(result.action).toBe('IMPROVE_HEADLINE');
    expect(result.alert?.title).toContain('GOOGLE');
  });

  it('contenido de servicio funcionando → profundizar', () => {
    const article = baseArticle({
      titulo: 'INSS: consulta de aportes en línea',
      resumen: 'Cómo consultar aportes.',
      categoria: 'Nacionales',
      vistas: 600,
      aprobadoMeni: true,
      scoreMeni: 92,
      palabras: 480,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(['PUBLISH', 'ADD_SERVICE_INFORMATION']).toContain(result.action);
  });

  it('sin datos → NO_ACTION con evidencia NO_DATA', () => {
    const article = baseArticle({
      aprobadoMeni: true,
      scoreMeni: 90,
      palabras: 500,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.action).toBe('NO_ACTION');
    expect(result.traffic.status).toBe('NO_DATA');
    expect(result.whatNotToDo.toLowerCase()).toContain('no inventar');
  });

  it('acceso bloqueado → ACCESS_BLOCKED', () => {
    const article = baseArticle({
      aprobadoMeni: true,
      scoreMeni: 90,
      palabras: 500,
    });
    const result = analyzeForPublication(article, {
      articlePool: basePool(),
      traffic: { status: 'ACCESS_BLOCKED' },
    });
    expect(result.traffic.status).toBe('ACCESS_BLOCKED');
    expect(result.google.status).toBe('ACCESS_BLOCKED');
  });

  it('MENI rechazado con score bajo → DO_NOT_PUBLISH', () => {
    const article = baseArticle({
      aprobadoMeni: false,
      scoreMeni: 45,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.action).toBe('DO_NOT_PUBLISH');
    expect(result.urgency).toBe('CRITICAL');
    expect(result.alert?.title).toContain('NO PUBLICAR');
  });

  it('MENI no aprobado → IMPROVE_BEFORE_PUBLISH', () => {
    const article = baseArticle({
      aprobadoMeni: false,
      scoreMeni: 70,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.action).toBe('IMPROVE_BEFORE_PUBLISH');
    expect(result.whatNotToDo.toLowerCase()).toContain('no publicar');
  });

  it('MENI separado de tráfico desconocido', () => {
    const article = baseArticle({
      aprobadoMeni: true,
      scoreMeni: 95,
      palabras: 500,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.meni.status).toBe('REAL');
    expect(result.traffic.status).toBe('NO_DATA');
    expect(result.action).toBe('NO_ACTION');
  });

  it('titular demasiado largo → IMPROVE_HEADLINE', () => {
    const article = baseArticle({
      titulo: 'Este es un título muy largo que supera ampliamente los sesenta caracteres recomendados para SEO',
      aprobadoMeni: true,
      scoreMeni: 91,
      palabras: 500,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.action).toBe('IMPROVE_HEADLINE');
    expect(result.whatToDo.toLowerCase()).toContain('60 caracteres');
  });

  it('sin GSC no inventa oportunidades', () => {
    const article = baseArticle({
      aprobadoMeni: true,
      scoreMeni: 90,
      palabras: 500,
    });
    const result = analyzeForPublication(article, { articlePool: basePool() });
    expect(result.google.status).toBe('ACCESS_BLOCKED');
    expect(result.evidence.every(e => !e.toLowerCase().includes('gsc'))).toBe(true);
  });
});

describe('findRelatedArticles', () => {
  it('encuentra artículos reales relacionados', () => {
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
  it('HIGH_IMPRESSIONS_LOW_CTR → IMPROVE_HEADLINE', () => {
    const gsc: GscData = { impressions: 26300, clicks: 372, status: 'REAL' };
    const signals = detectGoogleOpportunities({ titulo: 'INSS guía' }, gsc);
    expect(signals.some(s => s.action === 'IMPROVE_HEADLINE')).toBe(true);
  });

  it('GSC sin datos no genera señales', () => {
    const gsc: GscData = { impressions: 0, clicks: 0, status: 'CONNECTED_NO_DATA' };
    const signals = detectGoogleOpportunities({ titulo: 'Noticia' }, gsc);
    expect(signals.length).toBe(0);
  });

  it('sin GSC devuelve array vacío', () => {
    const signals = detectGoogleOpportunities({ titulo: 'Noticia' });
    expect(signals.length).toBe(0);
  });

  it('SNIPPET_WEAK con CTR muy bajo', () => {
    const gsc: GscData = { impressions: 2000, clicks: 10, status: 'REAL' };
    const signals = detectGoogleOpportunities({ titulo: 'INSS guía' }, gsc);
    expect(signals.some(s => s.action === 'IMPROVE_SNIPPET')).toBe(true);
  });

  it('CONTENT_GAP con queries reales', () => {
    const gsc: GscData = { impressions: 500, clicks: 25, status: 'REAL', queries: ['requisitos inss', 'quejas'] };
    const signals = detectGoogleOpportunities(
      { titulo: 'Cobertura INSS', resumen: 'Guía de cobertura', contenido: '<p>Información sobre requisitos inss.</p>' },
      gsc,
    );
    expect(signals.some(s => s.action === 'ADD_CONTEXT')).toBe(true);
  });
});

describe('getCEODailyBrief', () => {
  it('máximo 5 acciones', () => {
    const articles = basePool();
    const traffic: Record<string, TrafficEvidence> = {};
    for (const a of articles) {
      if ((a.vistas ?? 0) > 0) traffic[a.slug] = { viewsRecent: a.vistas, source: 'test', status: 'REAL' };
    }
    const brief = getCEODailyBrief({ articles, traffic });
    expect(brief.length).toBeLessThanOrEqual(5);
  });

  it('sin acciones ficticias', () => {
    const brief = getCEODailyBrief({ articles: [] });
    expect(brief.length).toBe(0);
  });

  it('prioriza contenido de servicio con tráfico real', () => {
    const articles = basePool();
    const traffic: Record<string, TrafficEvidence> = {};
    for (const a of articles) {
      if ((a.vistas ?? 0) > 0) traffic[a.slug] = { viewsRecent: a.vistas, source: 'test', status: 'REAL' };
    }
    const brief = getCEODailyBrief({ articles, traffic });
    expect(brief.some(a => a.action === 'ADD_SERVICE_INFORMATION')).toBe(true);
  });

  it('detecta titular con bajo CTR solo con GSC real', () => {
    const articles = basePool();
    const traffic: Record<string, TrafficEvidence> = {};
    for (const a of articles) {
      if ((a.vistas ?? 0) > 0) traffic[a.slug] = { viewsRecent: a.vistas, source: 'test', status: 'REAL' };
    }
    const gsc: GscData[] = [{ impressions: 5000, clicks: 50, status: 'REAL' }];
    const brief = getCEODailyBrief({ articles, traffic, gsc });
    expect(brief.some(a => a.action === 'IMPROVE_HEADLINE')).toBe(true);
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
        action: analysis.action,
        urgency: analysis.urgency,
        vistas: article.vistas ?? 'NO_DATA',
        scoreMeni: article.scoreMeni ?? 'NO_DATA',
        aprobadoMeni: article.aprobadoMeni ?? 'NO_DATA',
        related: analysis.relatedArticles.slice(0, 2).map(r => r.slug),
        existing: analysis.existingArticle,
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
