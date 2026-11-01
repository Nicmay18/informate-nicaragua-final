/**
 * Shortlink click guard — protección de métricas comerciales.
 *
 * Un GET a /l/[id] dispara hasta 2 escrituras Firestore (evento analytics +
 * incremento de contador). Sin controles, un bot o un refresh inflan los
 * clics que se reportan a patrocinadores y queman presupuesto de escrituras.
 *
 * Semántica que se protege:
 * - `requests`: cuántas veces se pidió el link (puede ser alto por previews,
 *   bots, refreshes) — NO se persiste por evento.
 * - `clicks`: intenciones de navegación únicas tras deduplicación — es la
 *   métrica que se cobra/reporta.
 *
 * Limitación honesta: los controles en memoria son POR INSTANCIA serverless
 * (mismo modelo que el rate limiter del newsletter). La deduplicación real
 * por visitante la aporta la cookie de primer nivel; la memoria cubre
 * clientes sin cookies dentro de la misma instancia.
 */

const WINDOW_MS = 6 * 60 * 60 * 1000; // dedup mismo cliente+link por 6 h
const RATE_LIMIT_PER_MINUTE = 30; // clics contables por IP por minuto
const MAX_ENTRIES = 50_000;

interface DedupEntry {
  at: number;
}
interface Bucket {
  count: number;
  resetAt: number;
}

const seen = new Map<string, DedupEntry>();
const buckets = new Map<string, Bucket>();

function prune(): void {
  if (seen.size <= MAX_ENTRIES) return;
  const cutoff = Date.now() - WINDOW_MS;
  for (const [k, v] of seen) {
    if (v.at < cutoff) seen.delete(k);
  }
  if (seen.size > MAX_ENTRIES) seen.clear();
}

/** User-Agents de bots y fetchers de preview que nunca son un clic real. */
const NON_CLICK_UA = /bot|crawler|spider|headless|preview|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|curl|wget|python-requests|go-http|postman/i;

export function isNonClickUserAgent(ua: string): boolean {
  return NON_CLICK_UA.test(ua);
}

/**
 * Deduplicación por instancia: ¿ya contamos a este cliente en este link
 * dentro de la ventana? La cookie del navegador es la dedup primaria; esta
 * cubre clientes que no la devuelven.
 */
export function alreadyCounted(key: string): boolean {
  prune();
  const e = seen.get(key);
  if (e && Date.now() - e.at < WINDOW_MS) return true;
  seen.set(key, { at: Date.now() });
  return false;
}

/** Rate limit por IP: si está saturada, la request NO cuenta (pero redirige). */
export function overRateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (b.count >= RATE_LIMIT_PER_MINUTE) return true;
  b.count += 1;
  return false;
}

/**
 * IP anonimizada para almacenamiento: se conserva la trazabilidad de origen
 * sin retener el identificador completo (v4: /24, v6: primeros 4 grupos).
 */
export function anonymizeIp(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    return 'unknown';
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 4).join(':')}::`;
  }
  return 'unknown';
}

/** Clave de dedup por instancia (IP anonimizada + link + hash corto de UA). */
export function dedupKey(linkId: string, ip: string, ua: string): string {
  let h = 0;
  for (let i = 0; i < ua.length; i++) h = (h * 31 + ua.charCodeAt(i)) | 0;
  return `${linkId}:${anonymizeIp(ip)}:${h}`;
}

/** Reset solo para tests. */
export function _resetShortlinkGuard(): void {
  seen.clear();
  buckets.clear();
}
