import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getTrafficForDate, getTrafficPerformance } from '@/lib/analytics/traffic-reader';
import {
  aggregateSources,
  bucketViewsByHour,
  buildHeatmapDays,
  buildInsights,
  classifyTrend,
  dailySeries,
  hourSummary,
  normalizeSource,
  parsePeriod,
  realtimeSnapshot,
  siteTrend,
  split6hWindows,
  windowedArticleCounts,
  MANAGUA_TZ,
  type ArticleWindowStats,
  type HeatmapDay,
  type TrafficLogEvent,
} from '@/lib/analytics/traffic-insights';
import { logger } from '@/lib/logger';

export const revalidate = 0;

function verificarAuth(request: NextRequest): boolean {
  return verifyAdminOrCronToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

/** Máximo de documentos traffic_log leídos por request (control de costo). */
const LOG_LIMIT_24H = 5000;
const RECENT_LIMIT = 20;
const CATMAP_SLUG_CAP = 90;

interface NoticiaMeta { titulo: string; categoria: string; vistas: number; }

async function fetchNoticiaMeta(
  db: FirebaseFirestore.Firestore,
  slugs: string[],
): Promise<Map<string, NoticiaMeta>> {
  const map = new Map<string, NoticiaMeta>();
  const unique = Array.from(new Set(slugs.filter(Boolean))).slice(0, CATMAP_SLUG_CAP);
  for (let i = 0; i < unique.length; i += 30) {
    const chunk = unique.slice(i, i + 30);
    try {
      const snap = await db.collection('noticias').where('slug', 'in', chunk).get();
      for (const doc of snap.docs) {
        const d = doc.data();
        if (d.slug) {
          map.set(d.slug, {
            titulo: d.titulo || d.title || d.slug,
            categoria: d.categoria || 'General',
            vistas: typeof d.vistas === 'number' ? d.vistas : 0,
          });
        }
      }
    } catch (err) {
      logger.warn('[admin/traffic] noticias meta chunk failed:', err);
    }
  }
  return map;
}

/**
 * Cobertura real del heatmap: lista los doc IDs de traffic_daily (las fechas
 * medidas de verdad) y suma vistas por día. Días más allá de la ventana de
 * `dailyGrowth` se leen directamente (acotado a los últimos 70 días).
 * Se cachea 5 min para controlar lecturas.
 */
const HEATMAP_MAX_DAYS = 70;

async function fetchHeatmapData(
  db: FirebaseFirestore.Firestore,
  now: Date,
  baseTotals: Record<string, number>,
): Promise<{ days: HeatmapDay[]; first: string | null; last: string | null }> {
  let dayIds: string[] = [];
  try {
    const docs = await db.collection('traffic_daily').listDocuments();
    dayIds = docs.map(d => d.id).sort();
  } catch (err) {
    logger.warn('[admin/traffic] listDocuments traffic_daily falló:', err);
  }

  const totals: Record<string, number> = { ...baseTotals };
  // Leer totales de días cubiertos por traffic_daily pero fuera de dailyGrowth
  const missing = dayIds.filter(d => !(d in totals));
  const toRead = missing.slice(-HEATMAP_MAX_DAYS);
  for (let i = 0; i < toRead.length; i += 10) {
    const chunk = toRead.slice(i, i + 10);
    await Promise.all(chunk.map(async (date) => {
      try {
        const snap = await db.collection('traffic_daily').doc(date).collection('articles').get();
        let v = 0;
        for (const doc of snap.docs) v += (doc.data().views as number) || 0;
        totals[date] = v;
      } catch {
        // si falla un día, queda fuera de totals → hasData solo si el doc existe
      }
    }));
  }

  const first = dayIds[0] || null;
  const last = dayIds[dayIds.length - 1] || null;

  // Cobertura: desde el día medido más antiguo hasta hoy, acotada.
  let days = 30;
  if (first) {
    const span = Math.floor((now.getTime() - new Date(`${first}T00:00:00Z`).getTime()) / 86400000) + 1;
    days = Math.min(Math.max(span, 7), HEATMAP_MAX_DAYS);
  }

  return { days: buildHeatmapDays(totals, dayIds, days, now), first, last };
}

function toEvent(data: FirebaseFirestore.DocumentData): TrafficLogEvent | null {
  const ts = data.timestamp;
  const date = ts?.toDate ? ts.toDate() : (typeof ts === 'string' ? new Date(ts) : null);
  if (!date || isNaN(date.getTime())) return null;
  return {
    slug: typeof data.slug === 'string' ? data.slug : '',
    titulo: typeof data.titulo === 'string' ? data.titulo : '',
    source: typeof data.source === 'string' ? data.source : '',
    referrer: typeof data.referrer === 'string' ? data.referrer : '',
    utmSource: typeof data.utmSource === 'string' ? data.utmSource : '',
    userAgent: typeof data.userAgent === 'string' ? data.userAgent : '',
    sessionId: typeof data.sessionId === 'string' ? data.sessionId : undefined,
    timestamp: date,
  };
}

export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('periodo'));
    const filterFuente = (searchParams.get('fuente') || '').trim().toLowerCase();
    const filterCategoria = (searchParams.get('categoria') || '').trim();
    const filterArticulo = (searchParams.get('articulo') || '').trim();
    const now = new Date();

    // ---- Lectura 1: traffic_log últimas 24h (acotada) ---------------------
    const since24 = new Date(now.getTime() - 24 * 3600 * 1000);
    const logSnap = await db
      .collection('traffic_log')
      .where('timestamp', '>=', since24)
      .orderBy('timestamp', 'desc')
      .limit(LOG_LIMIT_24H)
      .get();
    const events24h = logSnap.docs
      .map(d => toEvent(d.data()))
      .filter((e): e is TrafficLogEvent => e !== null);
    const logTruncated = logSnap.docs.length >= LOG_LIMIT_24H;

    // ---- Lectura 2: series diarias + agregados del período (cache 5min) ---
    const periodDays = period === '30d' ? 30 : period === '7d' ? 7 : 1;
    const perf = await getTrafficPerformance(db, periodDays, 50);
    const daily = dailySeries(perf.performance?.dailyGrowth || {}, Math.max(periodDays, 7), now);
    const heatmapData = await fetchHeatmapData(db, now, perf.performance?.dailyGrowth || {});

    // ---- Mapa slug → noticia (título/categoría/vistas) --------------------
    const slugFreq = new Map<string, number>();
    for (const e of events24h) if (e.slug) slugFreq.set(e.slug, (slugFreq.get(e.slug) || 0) + 1);
    for (const a of perf.performance?.topArticles || []) {
      slugFreq.set(a.slug, (slugFreq.get(a.slug) || 0) + a.views);
    }
    if (filterArticulo) slugFreq.set(filterArticulo, (slugFreq.get(filterArticulo) || 0) + 1);
    const slugsByFreq = Array.from(slugFreq.entries()).sort((a, b) => b[1] - a[1]).map(([s]) => s);
    const metaMap = await fetchNoticiaMeta(db, slugsByFreq);

    const categoriaOf = (slug: string) => metaMap.get(slug)?.categoria || 'Sin categoría';

    // ---- Filtros (post-fetch, in-memory) ----------------------------------
    let filteredEvents = events24h;
    if (filterFuente) {
      filteredEvents = filteredEvents.filter(e => normalizeSource(e.source || e.utmSource) === filterFuente);
    }
    if (filterArticulo) {
      filteredEvents = filteredEvents.filter(e => e.slug === filterArticulo);
    }
    if (filterCategoria) {
      filteredEvents = filteredEvents.filter(e => categoriaOf(e.slug) === filterCategoria);
    }

    // ---- Módulos ----------------------------------------------------------
    const hourly = bucketViewsByHour(filteredEvents, now);
    const windows = windowedArticleCounts(filteredEvents, now);
    const { last6, prev6 } = split6hWindows(filteredEvents, now);
    const realtime = realtimeSnapshot(events24h, now, 15);
    const hours = hourSummary(hourly);

    // Fuentes del período: 24h desde eventos; 7d/30d desde traffic_daily
    const sources24h = aggregateSources(filteredEvents);
    const sourcesPeriod: Record<string, number> = {};
    if (period === '24h') {
      Object.assign(sourcesPeriod, sources24h);
    } else {
      for (const [k, v] of Object.entries(perf.performance?.topSources || {})) {
        const canon = normalizeSource(k);
        sourcesPeriod[canon] = (sourcesPeriod[canon] || 0) + v;
      }
    }

    // Artículos del período: union de ventanas 24h + top del período
    const articleMap = new Map<string, ArticleWindowStats>();
    const periodViews = new Map<string, { views: number; sources: Record<string, number> }>();
    for (const a of perf.performance?.topArticles || []) {
      periodViews.set(a.slug, { views: a.views, sources: a.sources });
    }
    const allSlugs = new Set<string>([...windows.keys(), ...periodViews.keys()]);
    for (const slug of allSlugs) {
      if (filterArticulo && slug !== filterArticulo) continue;
      const cat = categoriaOf(slug);
      if (filterCategoria && cat !== filterCategoria) continue;
      const w = windows.get(slug) || { h1: 0, h6: 0, h24: 0, titulo: '' };
      const pv = periodViews.get(slug);
      if (filterFuente) {
        if (period === '24h') {
          if (w.h24 === 0) continue;
        } else {
          const src = Object.entries(pv?.sources || {}).reduce((s, [k, v]) => s + (normalizeSource(k) === filterFuente ? v : 0), 0);
          if (src === 0 && w.h24 === 0) continue;
        }
      }
      const { trend, deltaPct } = classifyTrend(last6.get(slug) || 0, prev6.get(slug) || 0);
      const meta = metaMap.get(slug);
      articleMap.set(slug, {
        slug,
        titulo: meta?.titulo || w.titulo || slug,
        categoria: cat,
        h1: w.h1,
        h6: w.h6,
        h24: w.h24,
        total: meta?.vistas ?? 0,
        trend,
        deltaPct,
      });
    }
    const articulos = Array.from(articleMap.values())
      .sort((a, b) => (period === '24h' ? b.h24 - a.h24 : (periodViews.get(b.slug)?.views || 0) - (periodViews.get(a.slug)?.views || 0)))
      .slice(0, 50);

    // Categorías del período
    const catTotals = new Map<string, number>();
    if (period === '24h') {
      for (const e of filteredEvents) catTotals.set(categoriaOf(e.slug), (catTotals.get(categoriaOf(e.slug)) || 0) + 1);
    } else {
      for (const a of perf.performance?.topArticles || []) {
        const cat = categoriaOf(a.slug);
        if (filterCategoria && cat !== filterCategoria) continue;
        if (filterArticulo && a.slug !== filterArticulo) continue;
        let v = a.views;
        if (filterFuente) {
          v = Object.entries(a.sources || {}).reduce((s, [k, n]) => s + (normalizeSource(k) === filterFuente ? n : 0), 0);
        }
        catTotals.set(cat, (catTotals.get(cat) || 0) + v);
      }
    }
    const catTotalSum = Array.from(catTotals.values()).reduce((s, v) => s + v, 0);
    const categorias = Array.from(catTotals.entries())
      .map(([categoria, views]) => ({ categoria, views, pct: catTotalSum > 0 ? Math.round((views / catTotalSum) * 100) : 0 }))
      .sort((a, b) => b.views - a.views);

    // Tendencias + insights deterministas
    const site = siteTrend(daily);
    const insights = buildInsights({ articles: articulos, categories: categorias, hours, site });

    // ---- Shape legacy (compatibilidad con panel existente) ----------------
    const today = now.toISOString().split('T')[0];
    const read = await getTrafficForDate(db, today, 10);
    const topPaginas = articulos.slice(0, 10).map(a => ({ slug: a.slug, titulo: a.titulo, vistas: period === '24h' ? a.h24 : (periodViews.get(a.slug)?.views || a.h24) }));
    const ultimosEventos = events24h.slice(0, RECENT_LIMIT).map(e => ({
      slug: e.slug,
      titulo: metaMap.get(e.slug)?.titulo || e.titulo || e.slug,
      source: normalizeSource(e.source),
      timestamp: e.timestamp.toISOString(),
    }));

    const sessionsInstrumented = events24h.some(e => e.sessionId);

    const stats = {
      // legacy
      vistas24h: read.views24h,
      fuentes: sources24h,
      topPaginas,
      ultimosEventos,
      source: read.source,
      migrationHealth: read.migrationHealth,
      // extended
      period,
      hourly,
      daily,
      heatmap: heatmapData.days,
      sourcesPeriod,
      categorias,
      articulos,
      realtime,
      insights,
      tendencias: { site },
      horarios: hours,
      meta: {
        generatedAt: now.toISOString(),
        tzHourly: MANAGUA_TZ,
        tzDaily: 'UTC (clave de día tal como persiste traffic_daily)',
        logLimit: LOG_LIMIT_24H,
        logTruncated: logTruncated,
        sessions: sessionsInstrumented ? 'available' : 'not_instrumented',
        dailyCoverage: { first: heatmapData.first, last: heatmapData.last, days: heatmapData.days.length },
        filters: {
          periodo: period,
          fuente: filterFuente || null,
          categoria: filterCategoria || null,
          articulo: filterArticulo || null,
        },
      },
    };

    logger.info('[admin/traffic] response', { period, vistas24h: stats.vistas24h, events: events24h.length, articles: articulos.length });

    return NextResponse.json({ ok: true, stats }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[admin/traffic] exception', { error: msg });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Cloudflare no cachea POST: lecturas admin via POST para no exponer datos en CDN
export { GET as POST };
