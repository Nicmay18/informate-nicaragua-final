/**
 * Traffic Insights — agregación determinista de tráfico real.
 *
 * FUENTES DE DATOS (reales, producción):
 * - traffic_log: 1 doc por vista de artículo. Campos: slug, titulo, referrer,
 *   utmSource, userAgent, source, timestamp (serverTimestamp), expiresAt
 *   (TTL ~30 días), sessionId (instrumentado desde esta versión).
 * - traffic_daily/{YYYY-MM-DD}/articles/{slug}: {views, sources{}, devices{}}
 *   clave de día en UTC (así se escribe en incrementTrafficDaily).
 * - noticias.vistas: contador canónico lifetime por artículo.
 *
 * TIMEZONE: los buckets horarios se calculan en America/Managua (UTC-6 fijo,
 * Nicaragua no tiene DST). Las series diarias usan las claves UTC de
 * traffic_daily tal como se persisten (documentado en meta.tzDaily='UTC').
 *
 * Nada aquí fabrica datos: cualquier métrica sin base real devuelve
 * estructuras vacías o flags explícitos (p.ej. sessions: 'not_instrumented').
 */

export const MANAGUA_TZ = 'America/Managua';

export interface TrafficLogEvent {
  slug: string;
  titulo?: string;
  source?: string;
  referrer?: string;
  utmSource?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: Date;
}

export interface HourBucket {
  /** ISO aproximado del inicio del bucket en UTC (hora Managua truncada). */
  key: string;
  /** Etiqueta 'HH:00' en hora Managua. */
  label: string;
  views: number;
}

export interface DayPoint {
  date: string; // clave UTC tal como se persiste en traffic_daily
  views: number;
}

export interface ArticleWindowStats {
  slug: string;
  titulo: string;
  categoria: string;
  h1: number;
  h6: number;
  h24: number;
  total: number; // noticias.vistas (lifetime canónico) cuando se provee
  trend: 'acelerando' | 'perdiendo' | 'estable' | 'nuevo';
  deltaPct: number | null; // últimas 6h vs 6h previas
}

export type TrafficPeriod = '24h' | '7d' | '30d';

export const VALID_PERIODS: TrafficPeriod[] = ['24h', '7d', '30d'];

export function parsePeriod(raw: string | null): TrafficPeriod {
  if (raw === '7d' || raw === '30d') return raw;
  return '24h';
}

export function periodMs(period: TrafficPeriod): number {
  if (period === '7d') return 7 * 24 * 3600 * 1000;
  if (period === '30d') return 30 * 24 * 3600 * 1000;
  return 24 * 3600 * 1000;
}

// ---------- Timezone helpers (America/Managua, UTC-6 fijo, sin DST) ----------

const managuaPartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MANAGUA_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
});

function managuaParts(d: Date): { y: number; mo: number; da: number; h: number } {
  const parts = managuaPartsFormatter.formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value || '0';
  return {
    y: Number(get('year')),
    mo: Number(get('month')),
    da: Number(get('day')),
    h: Number(get('hour')) % 24,
  };
}

/** Clave de bucket horario en Managua: 'YYYY-MM-DDTHH' */
export function managuaHourKey(d: Date): string {
  const p = managuaParts(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.y}-${pad(p.mo)}-${pad(p.da)}T${pad(p.h)}`;
}

// ---------- Agregaciones puras ----------

/**
 * Bucketiza eventos en 24 horas Managua terminando en la hora actual.
 * Buckets sin eventos devuelven views=0 (honesto: 0 real, no estimado).
 */
export function bucketViewsByHour(events: TrafficLogEvent[], now: Date = new Date()): HourBucket[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    const key = managuaHourKey(e.timestamp);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const buckets: HourBucket[] = [];
  // Generar las 24 llaves terminando en la hora Managua actual.
  const cursor = new Date(now.getTime());
  const keys: string[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(cursor.getTime() - i * 3600 * 1000);
    keys.push(managuaHourKey(d));
  }
  for (const key of keys) {
    const h = key.split('T')[1];
    buckets.push({ key, label: `${h}:00`, views: counts.get(key) || 0 });
  }
  return buckets;
}

/** Ventanas por artículo: última 1h, 6h y 24h desde `now`. */
export function windowedArticleCounts(
  events: TrafficLogEvent[],
  now: Date = new Date(),
): Map<string, { h1: number; h6: number; h24: number; titulo: string }> {
  const t1 = now.getTime() - 3600 * 1000;
  const t6 = now.getTime() - 6 * 3600 * 1000;
  const t24 = now.getTime() - 24 * 3600 * 1000;
  const map = new Map<string, { h1: number; h6: number; h24: number; titulo: string }>();

  for (const e of events) {
    if (!e.slug) continue;
    const t = e.timestamp.getTime();
    if (t < t24) continue;
    const cur = map.get(e.slug) || { h1: 0, h6: 0, h24: 0, titulo: e.titulo || e.slug };
    cur.h24 += 1;
    if (t >= t6) cur.h6 += 1;
    if (t >= t1) cur.h1 += 1;
    if (!cur.titulo && e.titulo) cur.titulo = e.titulo;
    map.set(e.slug, cur);
  }
  return map;
}

/**
 * Tendencia determinista: compara últimas 6h vs las 6h previas.
 * Reglas documentadas:
 * - sin base en ventana previa y con actividad actual → 'nuevo'
 * - delta >= +30% → 'acelerando'
 * - delta <= -30% → 'perdiendo'
 * - resto → 'estable'
 */
export function classifyTrend(last6: number, prev6: number): { trend: ArticleWindowStats['trend']; deltaPct: number | null } {
  if (prev6 === 0 && last6 === 0) return { trend: 'estable', deltaPct: null };
  if (prev6 === 0 && last6 > 0) return { trend: 'nuevo', deltaPct: null };
  const deltaPct = Math.round(((last6 - prev6) / prev6) * 100);
  if (deltaPct >= 30) return { trend: 'acelerando', deltaPct };
  if (deltaPct <= -30) return { trend: 'perdiendo', deltaPct };
  return { trend: 'estable', deltaPct };
}

export function split6hWindows(
  events: TrafficLogEvent[],
  now: Date = new Date(),
): { last6: Map<string, number>; prev6: Map<string, number> } {
  const t6 = now.getTime() - 6 * 3600 * 1000;
  const t12 = now.getTime() - 12 * 3600 * 1000;
  const last6 = new Map<string, number>();
  const prev6 = new Map<string, number>();
  for (const e of events) {
    if (!e.slug) continue;
    const t = e.timestamp.getTime();
    if (t >= t6) last6.set(e.slug, (last6.get(e.slug) || 0) + 1);
    else if (t >= t12) prev6.set(e.slug, (prev6.get(e.slug) || 0) + 1);
  }
  return { last6, prev6 };
}

/**
 * Normalización de fuentes a canales canónicos del dashboard.
 * traffic_log.source ya viene clasificado por detectarFuente(); aquí solo
 * se agrupa a los canales de visualización. 'google' incluye tráfico de
 * Discover cuando el referrer es genérico de Google (no distinguible — ver
 * meta.limitaciones).
 */
export function normalizeSource(raw?: string | null): string {
  const s = (raw || '').trim().toLowerCase();
  switch (s) {
    case 'facebook': case 'fb':
      return 'facebook';
    case 'telegram': case 'tg': case 't.me':
      return 'telegram';
    case 'whatsapp': case 'wa':
      return 'whatsapp';
    case 'google': case 'discover': case 'google-discover': case 'bing': case 'yahoo':
      return 'google';
    case 'twitter': case 'x': case 'x.com': case 't.co':
      return 'twitter';
    case 'direct': case 'directo': case 'none': case '':
      return 'directo';
    case 'otro': case 'other': case 'referral':
      return 'otro';
    case 'unknown': case 'desconocido':
      return 'desconocido';
    default:
      return s ? 'otro' : 'directo';
  }
}

export function aggregateSources(events: TrafficLogEvent[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of events) {
    const s = normalizeSource(e.source || e.utmSource);
    out[s] = (out[s] || 0) + 1;
  }
  return out;
}

/** Actividad "ahora": eventos en los últimos `windowMin` minutos. */
export function realtimeSnapshot(
  events: TrafficLogEvent[],
  now: Date = new Date(),
  windowMin = 15,
): { events: number; distinctSlugs: number; distinctSessions: number | null } {
  const cutoff = now.getTime() - windowMin * 60 * 1000;
  const slugs = new Set<string>();
  const sessions = new Set<string>();
  let sawSessionField = false;
  let count = 0;
  for (const e of events) {
    if (e.timestamp.getTime() < cutoff) continue;
    count += 1;
    if (e.slug) slugs.add(e.slug);
    if (e.sessionId) {
      sawSessionField = true;
      sessions.add(e.sessionId);
    }
  }
  return {
    events: count,
    distinctSlugs: slugs.size,
    // honesto: null cuando la instrumentación de sesión aún no produjo datos
    distinctSessions: sawSessionField ? sessions.size : null,
  };
}

/** Pico/valle/promedio sobre buckets horarios. */
export function hourSummary(buckets: HourBucket[]): {
  peakHour: string | null;
  lowHour: string | null;
  avgPerHour: number;
} {
  if (buckets.length === 0) return { peakHour: null, lowHour: null, avgPerHour: 0 };
  let peak = buckets[0];
  let low = buckets[0];
  let total = 0;
  for (const b of buckets) {
    total += b.views;
    if (b.views > peak.views) peak = b;
    if (b.views < low.views) low = b;
  }
  const hasTraffic = total > 0;
  return {
    peakHour: hasTraffic ? peak.label : null,
    lowHour: hasTraffic ? low.label : null,
    avgPerHour: Math.round((total / buckets.length) * 10) / 10,
  };
}

/** Serie diaria ordenada asc, zero-fill sobre el rango solicitado (claves UTC). */
export function dailySeries(
  dailyTotals: Record<string, number>,
  days: number,
  now: Date = new Date(),
): DayPoint[] {
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const key = d.toISOString().split('T')[0];
    out.push({ date: key, views: dailyTotals[key] || 0 });
  }
  return out;
}

/**
 * Heatmap honesto: distingue tres estados por día.
 * - hasDoc=true  → el día existe en traffic_daily → views es REAL (incluye 0).
 * - hasDoc=false → no hay doc medido → 'sin datos' (nunca dibujar como 0).
 * Cubre todo el histórico disponible (availableDates = doc IDs reales de
 * traffic_daily), no solo la serie visible del gráfico diario.
 */
export interface HeatmapDay {
  date: string;
  views: number;
  hasData: boolean; // false = sin datos medidos, true = medido (0 es valor real)
}

export function buildHeatmapDays(
  dailyTotals: Record<string, number>,
  availableDates: string[],
  days: number,
  now: Date = new Date(),
): HeatmapDay[] {
  const available = new Set(availableDates);
  const out: HeatmapDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const key = d.toISOString().split('T')[0];
    const measured = available.has(key) || key in dailyTotals;
    out.push({
      date: key,
      views: measured ? (dailyTotals[key] || 0) : 0,
      hasData: measured,
    });
  }
  return out;
}

/** Tendencia sitewide: últimos `days/2` días vs la mitad previa. */
export function siteTrend(series: DayPoint[]): { direction: 'up' | 'down' | 'flat' | 'insufficient'; deltaPct: number | null } {
  if (series.length < 4) return { direction: 'insufficient', deltaPct: null };
  const half = Math.floor(series.length / 2);
  const prev = series.slice(0, half).reduce((s, p) => s + p.views, 0);
  const last = series.slice(-half).reduce((s, p) => s + p.views, 0);
  if (prev === 0 && last === 0) return { direction: 'flat', deltaPct: null };
  if (prev === 0) return { direction: 'up', deltaPct: null };
  const deltaPct = Math.round(((last - prev) / prev) * 100);
  if (deltaPct >= 15) return { direction: 'up', deltaPct };
  if (deltaPct <= -15) return { direction: 'down', deltaPct };
  return { direction: 'flat', deltaPct };
}

/**
 * Insights deterministas en español. Solo se emiten cuando los datos
 * lo demuestran; nunca inventan interpretación.
 */
export function buildInsights(input: {
  articles: ArticleWindowStats[];
  categories: { categoria: string; views: number }[];
  hours: { peakHour: string | null; lowHour: string | null };
  site: { direction: string; deltaPct: number | null };
}): string[] {
  const out: string[] = [];
  const accel = input.articles
    .filter(a => a.trend === 'acelerando' || a.trend === 'nuevo')
    .sort((a, b) => b.h6 - a.h6)
    .slice(0, 3);
  for (const a of accel) {
    out.push(`"${a.titulo}" está recibiendo tráfico ahora (${a.h6} visitas en 6h${a.deltaPct !== null ? `, ${a.deltaPct > 0 ? '+' : ''}${a.deltaPct}% vs 6h previas` : ''}).`);
  }
  const losing = input.articles.filter(a => a.trend === 'perdiendo').sort((a, b) => a.h6 - b.h6)[0];
  if (losing) {
    out.push(`"${losing.titulo}" pierde tráfico (${losing.deltaPct}% vs 6h previas).`);
  }
  const topCat = input.categories[0];
  if (topCat && topCat.views > 0) {
    const totalCat = input.categories.reduce((s, c) => s + c.views, 0);
    const pct = totalCat > 0 ? Math.round((topCat.views / totalCat) * 100) : 0;
    out.push(`${topCat.categoria} concentra el ${pct}% del tráfico del período.`);
  }
  if (input.hours.peakHour) {
    out.push(`Hora pico: ${input.hours.peakHour} (hora Nicaragua). Hora más baja: ${input.hours.lowHour}.`);
  }
  if (input.site.direction === 'up' && input.site.deltaPct !== null) {
    out.push(`El tráfico del sitio creció ${input.site.deltaPct}% en la segunda mitad del período.`);
  } else if (input.site.direction === 'down' && input.site.deltaPct !== null) {
    out.push(`El tráfico del sitio cayó ${input.site.deltaPct}% en la segunda mitad del período.`);
  }
  return out;
}
