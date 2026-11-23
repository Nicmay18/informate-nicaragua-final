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
 *   persistido en `cf_purge_jobs` y lo reintenta el drenado oportunista
 *   (cada mutación) o `/api/cron/cf-purge-retry` (1×/día, límite Hobby).
 *   Peor caso = el comportamiento actual (stale ≤ edge TTL).
 * - Idempotencia: jobId determinista = hash(operation + urls ordenadas).
 *   Una segunda mutación idéntica no duplica trabajo.
 * - Concurrencia: reclamo atómico vía transacción Firestore — estado
 *   `processing` + `claimedBy` (execId) + `leaseUntil`. Un ejecutor viejo
 *   no puede sobrescribir el resultado de uno más reciente.
 * - Límite: máx. 30 URLs por job (también es el máximo por llamada API);
 *   si se excediera, se priorizan superficies editoriales.
 */
import { createHash, randomUUID } from 'crypto';
import { getAdminDb } from './firebase-admin';
import { logger } from './logger';
import { categoryToSlug } from './types';
import { AUTHORS } from './authors';

const SITE_ORIGIN = 'https://nicaraguainformate.com';
const JOBS_COLLECTION = 'cf_purge_jobs';
const MAX_URLS_PER_JOB = 30;
const MAX_ATTEMPTS = 5;
const PURGE_TIMEOUT_MS = 8000;
function leaseMs(): number {
  return Number(process.env.CF_PURGE_LEASE_MS || 60_000);
}
const MAX_DRAIN_JOBS = 10;
const RESURRECT_AFTER_MS = 24 * 60 * 60_000;
const MAX_RESURRECTIONS = 1;
const DEAD_QUERY_LIMIT = 5;

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

export type AdminDb = ReturnType<typeof getAdminDb>;

function tsMs(v: unknown): number {
  const t = new Date(v as string).getTime();
  return Number.isFinite(t) ? t : 0;
}

const EMPTY_RESULT = { processed: 0, sent: 0, failed: 0, dead: 0, resurrected: 0 };

/**
 * Reclama un job de forma atómica mediante transacción Firestore.
 *
 * Un job es reclamable si:
 * - status 'pending'/'failed' con nextRetryAt vencido (o ausente), o
 * - status 'processing' con leaseUntil vencido (el ejecutor anterior
 *   murió a mitad de la llamada API — la reserva se recupera).
 *
 * Al reclamar: status='processing', claimedBy=execId, leaseUntil=now+LEASE_MS
 * y attempts+1 (cada reclamo cuenta como un intento de API; acota los
 * loops si un ejecutor muere repetidamente).
 *
 * Si attempts ya llegó a MAX_ATTEMPTS, el job pasa a 'dead' (terminal,
 * visible para revisión) en lugar de reclamarse.
 */
export async function claimJob(db: AdminDb, jobId: string, execId: string): Promise<{ claimed: boolean; dead?: boolean; skip?: string; attempts?: number }> {
  const ref = db.collection(JOBS_COLLECTION).doc(jobId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { claimed: false, skip: 'missing' };
    const j = snap.data() as Record<string, any>;
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const attempts = typeof j.attempts === 'number' ? j.attempts : 0;
    const st = j.status as string;
    const retryDue = (st === 'pending' || st === 'failed') && (!j.nextRetryAt || tsMs(j.nextRetryAt) <= now);
    const leaseExpired = st === 'processing' && !!j.leaseUntil && tsMs(j.leaseUntil) <= now;
    if (!retryDue && !leaseExpired) return { claimed: false, skip: `status_${st}` };
    if (attempts >= MAX_ATTEMPTS) {
      tx.set(ref, { status: 'dead', deadAt: nowIso, claimedBy: null, leaseUntil: null, nextRetryAt: null, updatedAt: nowIso }, { merge: true });
      return { claimed: false, dead: true };
    }
    tx.set(ref, {
      status: 'processing',
      claimedBy: execId,
      leaseUntil: new Date(now + leaseMs()).toISOString(),
      attempts: attempts + 1,
      updatedAt: nowIso,
    }, { merge: true });
    return { claimed: true, attempts: attempts + 1 };
  });
}

/**
 * Escribe el resultado de un job SOLO si el ejecutor sigue siendo el
 * dueño de la reserva (status='processing' y claimedBy=execId). Si otro
 * proceso reclamó el job tras expirar la reserva, esta escritura se
 * descarta — un ejecutor viejo nunca sobrescribe un estado más reciente.
 */
export async function completeClaimedJob(db: AdminDb, jobId: string, execId: string, patch: Record<string, unknown>): Promise<boolean> {
  const ref = db.collection(JOBS_COLLECTION).doc(jobId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const j = snap.data() as Record<string, any>;
    if (j.status !== 'processing' || j.claimedBy !== execId) return false;
    tx.set(ref, { ...patch, claimedBy: null, leaseUntil: null, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  });
}

/**
 * Resucita jobs 'dead' UNA sola vez si llevan >24h muertos.
 * resurrectionCount acota la resurrección a MAX_RESURRECTIONS — un token
 * inválido permanente no puede generar un ciclo infinito: tras la única
 * resurrección, si vuelve a agotar intentos queda 'dead' terminal.
 */
async function resurrectDeadJobs(db: AdminDb, out: { resurrected: number }): Promise<void> {
  const snap = await db.collection(JOBS_COLLECTION)
    .where('status', '==', 'dead')
    .limit(DEAD_QUERY_LIMIT)
    .get();
  const cutoff = Date.now() - RESURRECT_AFTER_MS;
  for (const doc of snap.docs) {
    const j = doc.data() as Record<string, any>;
    const count = typeof j.resurrectionCount === 'number' ? j.resurrectionCount : 0;
    const diedAt = tsMs(j.deadAt || j.updatedAt);
    if (count >= MAX_RESURRECTIONS || diedAt > cutoff) continue;
    const ref = db.collection(JOBS_COLLECTION).doc(doc.id);
    const ok = await db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      if (!s.exists) return false;
      const d = s.data() as Record<string, any>;
      const c = typeof d.resurrectionCount === 'number' ? d.resurrectionCount : 0;
      const deadSince = tsMs(d.deadAt || d.updatedAt);
      if (d.status !== 'dead' || c >= MAX_RESURRECTIONS || deadSince > cutoff) return false;
      const nowIso = new Date().toISOString();
      tx.set(ref, {
        status: 'pending',
        attempts: 0,
        resurrectionCount: c + 1,
        resurrectedAt: nowIso,
        claimedBy: null,
        leaseUntil: null,
        nextRetryAt: null,
        updatedAt: nowIso,
      }, { merge: true });
      return true;
    });
    if (ok) out.resurrected++;
  }
}

/**
 * Encola y ejecuta la purga de las URLs afectadas por una mutación.
 * NUNCA lanza ni bloquea la publicación: los fallos quedan persistidos
 * para reintento por el drenado oportunista o /api/cron/cf-purge-retry.
 *
 * El drenado corre tras éxito Y tras fallo: la recuperación de la cola
 * no debe depender de que la purga de ESTA mutación haya funcionado.
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
  // (pending/processing/sent/done), no duplicar la llamada API. Un job
  // 'failed' o 'dead' SÍ permite re-encolar (la mutación se reintentó).
  try {
    const existing = await ref.get();
    if (existing.exists) {
      const st = existing.data()?.status;
      if (st === 'sent' || st === 'done' || st === 'pending' || st === 'processing') {
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

  // La purga propia pasa por el mismo reclamo atómico que el drenado:
  // si otro proceso ganó la reserva, no duplicamos la llamada API.
  const execId = randomUUID();
  const claim = await claimJob(db, jobId, execId);
  if (!claim.claimed) {
    await processPendingCloudflarePurges(MAX_DRAIN_JOBS).catch(() => ({ ...EMPTY_RESULT }));
    return { jobId, skipped: claim.skip || (claim.dead ? 'dead' : 'claimed_elsewhere') };
  }

  const result = await callCloudflarePurge(urls);
  if (result.ok) {
    await completeClaimedJob(db, jobId, execId, {
      status: 'sent', attempts: claim.attempts, lastError: null,
      sentAt: new Date().toISOString(), nextRetryAt: null,
    });
    await processPendingCloudflarePurges(MAX_DRAIN_JOBS).catch(() => ({ ...EMPTY_RESULT }));
    return { jobId, purged: urls.length };
  }

  const attempts = claim.attempts ?? 1;
  const dead = attempts >= MAX_ATTEMPTS;
  await completeClaimedJob(db, jobId, execId, {
    status: dead ? 'dead' : 'failed',
    attempts,
    lastError: result.error || 'unknown',
    deadAt: dead ? new Date().toISOString() : null,
    nextRetryAt: dead ? null : new Date(Date.now() + BACKOFF_MIN[Math.min(Math.max(attempts - 1, 0), BACKOFF_MIN.length - 1)] * 60_000).toISOString(),
  });
  logger.warn(`[cf-purge] purga falló (${ctx.reason} ${ctx.slug || ''}): ${result.error}`);
  // Drenado tras fallo: la recuperación de la cola no depende del
  // resultado de esta purga. Sin recursión: processPending no encola.
  await processPendingCloudflarePurges(MAX_DRAIN_JOBS).catch(() => ({ ...EMPTY_RESULT }));
  return { jobId, error: result.error };
}

const BACKOFF_MIN = [2, 10, 30, 60, 120]; // minutos por intento

/**
 * Procesa hasta `limit` jobs reclamables: resucita 'dead' elegibles,
 * respeta nextRetryAt y la reserva atómica con lease. Límite duro de
 * MAX_DRAIN_JOBS por ejecución (configurable solo por código, no por request).
 */
export async function processPendingCloudflarePurges(limit = MAX_DRAIN_JOBS): Promise<{ processed: number; sent: number; failed: number; dead: number; resurrected: number }> {
  const out = { ...EMPTY_RESULT };
  if (!isEnabled()) return out;
  const db = getAdminDb();
  const execId = randomUUID();

  await resurrectDeadJobs(db, out).catch(() => {});

  const snap = await db.collection(JOBS_COLLECTION)
    .where('status', 'in', ['pending', 'failed', 'processing'])
    .limit(limit)
    .get();

  const now = Date.now();
  for (const doc of snap.docs) {
    if (out.processed >= limit) break;
    const job = doc.data() as Record<string, any>;
    // Filtro barato antes de abrir transacción: respeta nextRetryAt.
    if (job.nextRetryAt && tsMs(job.nextRetryAt) > now) continue;
    const claim = await claimJob(db, doc.id, execId);
    if (!claim.claimed) {
      if (claim.dead) out.dead++;
      continue;
    }
    out.processed++;
    const result = await callCloudflarePurge((job.urls as string[]) || []);
    if (result.ok) {
      await completeClaimedJob(db, doc.id, execId, {
        status: 'sent', attempts: claim.attempts, lastError: null,
        sentAt: new Date().toISOString(), nextRetryAt: null,
      });
      out.sent++;
    } else {
      const attempts = claim.attempts ?? 1;
      const dead = attempts >= MAX_ATTEMPTS;
      await completeClaimedJob(db, doc.id, execId, {
        status: dead ? 'dead' : 'failed',
        attempts,
        lastError: result.error || 'unknown',
        deadAt: dead ? new Date().toISOString() : null,
        nextRetryAt: dead ? null : new Date(Date.now() + BACKOFF_MIN[Math.min(Math.max(attempts - 1, 0), BACKOFF_MIN.length - 1)] * 60_000).toISOString(),
      });
      if (dead) out.dead++; else out.failed++;
    }
  }
  return out;
}
