/**
 * Purga selectiva de Cloudflare Edge Cache para superficies editoriales.
 *
 * CONTEXTO: la Cache Rule "Cache HTML and all static assets" del dominio
 * ignora el Cache-Control del origen y cachea TODO el HTML público por PoP
 * durante ~2h. `revalidateTag`/`revalidatePath` solo purgan la caché de
 * Vercel — sin esta integración, una noticia publicada tarda hasta ~2h en
 * aparecer en el edge (frescura editorial rota).
 *
 * DISEÑO:
 * - Fail-safe: si CF_API_TOKEN/CF_ZONE_ID no existen o CF_PURGE_ENABLED != 'true',
 *   todo es no-op (el código puede desplegarse "apagado").
 * - La publicación NUNCA se bloquea por un fallo de purga: el job queda
 *   persistido en `cf_purge_jobs` y `/api/cron/cf-purge-retry` lo reintenta
 *   con backoff. Peor caso = el comportamiento actual (stale ≤ edge TTL).
 * - Idempotencia: jobId determinista = hash(operation + urls ordenadas).
 *   Una segunda mutación idéntica no duplica trabajo.
 * - Límite: máx. 30 URLs por job (también es el máximo por llamada API);
 *   si se excediera, se priorizan superficies editoriales.
 */
import { createHash } from 'crypto';
import { getAdminDb } from './firebase-admin';
import { logger } from './logger';
import { categoryToSlug } from './types';
import { AUTHORS } from './authors';

const SITE_ORIGIN = 'https://nicaraguainformate.com';
const JOBS_COLLECTION = 'cf_purge_jobs';
const MAX_URLS_PER_JOB = 30;
const MAX_ATTEMPTS = 5;
const PURGE_TIMEOUT_MS = 8000;

export interface PurgeContext {
  /** Slug actual del artículo (si aplica). */
  slug?: string;
  /** Slug anterior cuando cambió (edit con cambio de slug). */
  slugAnterior?: string;
  /** Nombre de categoría actual (ej. 'Sucesos'). */
  categoria?: string;
  /** Categoría anterior cuando cambió. */
  categoriaAnterior?: string;
  /** Slugs de tema actuales (campo `temas` del artículo). */
  temas?: string[];
  /** Slugs de tema anteriores cuando cambiaron. */
  temasAnteriores?: string[];
  /** Nombre del autor (se resuelve a slug vía AUTHORS). */
  autorNombre?: string;
  /**
   * Identificador único de ESTA mutación (p.ej. `dateModified` del doc o
   * attemptId). Sin él, dos mutaciones distintas que afectan las mismas
   * URLs generarían el mismo jobId y la segunda sería ignorada
   * incorrectamente. Los reintuses del MISMO job no pasan por aquí
   * (los maneja processPendingCloudflarePurges).
   */
  mutationKey?: string;
  /** Origen de la mutación para auditoría. */
  reason: 'publish' | 'edit' | 'delete' | 'unpublish' | 'bulk';
}

function isEnabled(): boolean {
  return process.env.CF_PURGE_ENABLED === 'true';
}

function authorSlugByName(nombre?: string): string | null {
  if (!nombre) return null;
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const target = norm(nombre);
  for (const a of Object.values(AUTHORS)) {
    if (norm(a.name) === target) return a.slug;
  }
  return null;
}

/**
 * Construye la lista de URLs públicas afectadas por una mutación editorial.
 *
 * Matriz de invalidación (ver docs/CF_PURGE_PROPOSAL.md):
 * - SIEMPRE: /, /noticias, feeds, sitemaps, mapa-del-sitio — el artículo
 *   aparece/desaparece en todos ellos.
 * - Artículo: /noticias/{slug} actual y anterior.
 * - Categorías: /categoria/{slug} de categoría actual y anterior — los
 *   listados por categoría cambian. Las páginas profundas ?page=N de
 *   /noticias y /categoria/* NO se purgan individualmente (demasiadas);
 *   su contenido deriva de los mismos datos y su deriva queda acotada
 *   por el Edge TTL — residual aceptado y documentado.
 * - Temas: /tema/{slug} por cada tema del artículo (antes y después).
 * - Autor: /autor/{slug} si el nombre resuelve contra AUTHORS.
 * - Entidades (/entidad/*): NO se purgan — sus páginas leen kb_* (pipeline
 *   de knowledge-base), no `noticias`; una publicación no las altera.
 */
export function buildPurgeUrls(ctx: PurgeContext): string[] {
  const urls = new Set<string>();
  const add = (path: string) => urls.add(`${SITE_ORIGIN}${path}`);

  // Superficies que siempre reflejan el estado del corpus.
  add('/');
  add('/noticias');
  add('/feed.xml');
  add('/feed.json');
  add('/rss');
  add('/rss.xml');
  add('/news-sitemap.xml');
  add('/sitemap.xml');
  add('/mapa-del-sitio');

  if (ctx.slug) add(`/noticias/${ctx.slug}`);
  if (ctx.slugAnterior && ctx.slugAnterior !== ctx.slug) add(`/noticias/${ctx.slugAnterior}`);

  for (const cat of new Set([ctx.categoria, ctx.categoriaAnterior].filter(Boolean) as string[])) {
    add(`/categoria/${categoryToSlug(cat)}`);
  }

  for (const t of new Set([...(ctx.temas ?? []), ...(ctx.temasAnteriores ?? [])])) {
    if (t) add(`/tema/${t}`);
  }

  const aSlug = authorSlugByName(ctx.autorNombre);
  if (aSlug) add(`/autor/${aSlug}`);

  return Array.from(urls).slice(0, MAX_URLS_PER_JOB);
}

function jobIdFor(urls: string[], reason: string, mutationKey?: string): string {
  const sorted = [...urls].sort().join('|');
  return createHash('sha256').update(`${reason}:${mutationKey || ''}:${sorted}`).digest('hex').slice(0, 32);
}

interface PurgeApiResult {
  ok: boolean;
  status?: number;
  error?: string;
}

/** Llama a la API de purga de Cloudflare. Nunca lanza; sanitiza errores. */
async function callCloudflarePurge(files: string[]): Promise<PurgeApiResult> {
  const zone = process.env.CF_ZONE_ID;
  const token = process.env.CF_API_TOKEN;
  if (!zone || !token) return { ok: false, error: 'missing_env' };
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files }),
      signal: AbortSignal.timeout(PURGE_TIMEOUT_MS),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && (json as any)?.success === true) return { ok: true, status: res.status };
    const errs = (json as any)?.errors;
    const msg = Array.isArray(errs) ? errs.map((e: any) => e?.message).join('; ') : `HTTP ${res.status}`;
    return { ok: false, status: res.status, error: String(msg).slice(0, 300) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message.slice(0, 300) : 'network_error' };
  }
}

async function markJob(jobId: string, patch: Record<string, unknown>) {
  try {
    await getAdminDb().collection(JOBS_COLLECTION).doc(jobId).set(
      { ...patch, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  } catch (err) {
    logger.warn('[cf-purge] no se pudo actualizar job:', err instanceof Error ? err.message : String(err));
  }
}

/**
 * Encola y ejecuta la purga de las URLs afectadas por una mutación.
 * NUNCA lanza ni bloquea la publicación: los fallos quedan persistidos
 * para reintento por /api/cron/cf-purge-retry.
 */
export async function enqueueAndPurgeCloudflare(ctx: PurgeContext): Promise<{ skipped?: string; jobId?: string; purged?: number; error?: string }> {
  if (!isEnabled()) return { skipped: 'disabled' };
  const urls = buildPurgeUrls(ctx);
  if (urls.length === 0) return { skipped: 'no_urls' };

  const jobId = jobIdFor(urls, ctx.reason, ctx.mutationKey);
  const db = getAdminDb();
  const ref = db.collection(JOBS_COLLECTION).doc(jobId);
  const now = new Date().toISOString();

  // Idempotencia: si ya existe un job para ESTA mutación que sigue vivo
  // (pending/sent/done), no duplicar la llamada API. Un job 'failed' o
  // 'dead' SÍ permite re-encolar (la mutación se reintentó).
  try {
    const existing = await ref.get();
    if (existing.exists) {
      const st = existing.data()?.status;
      if (st === 'sent' || st === 'done' || st === 'pending') {
        return { skipped: `already_${st}`, jobId };
      }
    }
  } catch { /* si la lectura falla, seguimos e intentamos igual */ }

  await ref.set({
    jobId,
    urls,
    reason: ctx.reason,
    slug: ctx.slug || null,
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  const result = await callCloudflarePurge(urls);
  if (result.ok) {
    await markJob(jobId, { status: 'sent', lastError: null, sentAt: new Date().toISOString() });
    return { jobId, purged: urls.length };
  }
  await markJob(jobId, { status: 'failed', attempts: 1, lastError: result.error || 'unknown' });
  logger.warn(`[cf-purge] purga falló (${ctx.reason} ${ctx.slug || ''}): ${result.error}`);
  return { jobId, error: result.error };
}

const BACKOFF_MIN = [2, 10, 30, 60, 120]; // minutos por intento

/**
 * Reintenta jobs pendientes/fallidos. Diseñado para /api/cron/cf-purge-retry
 * (barato: 1 query indexada, máx. 20 jobs por corrida).
 */
export async function processPendingCloudflarePurges(limit = 20): Promise<{ processed: number; sent: number; failed: number; dead: number }> {
  const out = { processed: 0, sent: 0, failed: 0, dead: 0 };
  if (!isEnabled()) return out;
  const db = getAdminDb();
  const snap = await db.collection(JOBS_COLLECTION)
    .where('status', 'in', ['pending', 'failed'])
    .limit(limit)
    .get();

  for (const doc of snap.docs) {
    const job = doc.data();
    const attempts = typeof job.attempts === 'number' ? job.attempts : 0;
    // Backoff: respetar nextRetryAt si aún no vence.
    if (job.nextRetryAt && new Date(job.nextRetryAt).getTime() > Date.now()) continue;
    if (attempts >= MAX_ATTEMPTS) {
      await markJob(doc.id, { status: 'dead' });
      out.dead++;
      continue;
    }
    out.processed++;
    const result = await callCloudflarePurge(job.urls || []);
    if (result.ok) {
      await markJob(doc.id, { status: 'sent', attempts: attempts + 1, lastError: null, sentAt: new Date().toISOString() });
      out.sent++;
    } else {
      const nextAttempts = attempts + 1;
      const dead = nextAttempts >= MAX_ATTEMPTS;
      await markJob(doc.id, {
        status: dead ? 'dead' : 'failed',
        attempts: nextAttempts,
        lastError: result.error || 'unknown',
        nextRetryAt: new Date(Date.now() + (BACKOFF_MIN[Math.min(nextAttempts, BACKOFF_MIN.length - 1)] ?? 120) * 60_000).toISOString(),
      });
      if (dead) out.dead++; else out.failed++;
    }
  }
  return out;
}
