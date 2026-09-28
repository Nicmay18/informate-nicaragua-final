/**
 * Distribución Telegram — sender único compartido.
 * =====================================================
 * Única implementación autorizada de envío a Telegram.
 * La usan: publication-pipeline, /api/admin/distribuir y /api/telegram.
 *
 * Garantías:
 * - Escape HTML correcto para parse_mode:HTML (sin "can't parse entities").
 * - Resumen con fallback determinista (nunca inventa, nunca HTML crudo).
 * - Truncado seguro que no corta entidades ni tags.
 * - Timeout explícito (AbortSignal) en cada fetch.
 * - Idempotencia por claim atómico en Firestore (distribuciones_envios).
 * - Clasificación retryable/nonRetryable + resultado estructurado.
 *
 * La distribución normal NO depende de IA.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { getTelegramConfig } from '@/lib/telegram';
import { logger } from '@/lib/logger';

const TG_TIMEOUT_MS = 8000;
const CAPTION_LIMIT = 1024; // límite Telegram para sendPhoto
const MESSAGE_LIMIT = 4096; // límite Telegram para sendMessage
const RETRY_DELAY_MS = 1500;

const EMOJI_CAT: Record<string, string> = {
  Sucesos: '🚨',
  Nacionales: '🇳🇮',
  Deportes: '⚽',
  Internacionales: '🌍',
  Espectáculos: '🎬',
  Tecnología: '💻',
  Salud: '🏥',
  Economía: '💰',
  Cultura: '🎭',
  Política: '🏛️',
  Educación: '📚',
  General: '📰',
};

export interface TelegramArticleInput {
  slug: string;
  titulo: string;
  resumen?: string;
  metaDescription?: string;
  contenido?: string;
  categoria?: string;
  imagen?: string;
  imagenRedes?: string;
  articleId?: string;
}

export type TelegramErrorCode =
  | 'NO_CREDENTIALS'
  | 'VALIDATION'
  | 'TIMEOUT'
  | 'PARSE'
  | 'UNAUTHORIZED'
  | 'TELEGRAM_API'
  | 'NETWORK'
  | 'CLAIM_BUSY';

export interface TelegramSendResult {
  ok: boolean;
  channel: 'telegram';
  skipped?: boolean;
  reason?: string;
  error?: string;
  errorCode?: TelegramErrorCode;
  retryable: boolean;
  messageId?: number;
  distributionId?: string;
  sentAt: string;
}

// ── Limpieza / escape ───────────────────────────────────────

export function stripHtml(html: string): string {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    // Solo tags reales: exige letra tras '<' para no comerse "< pequeños >"
    .replace(/<\/?[a-zA-Z][^>]*?>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escape para Telegram parse_mode:HTML — solo &, <, >, " */
export function escTelegram(texto: string): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Resumen con fallback determinista ───────────────────────
// resumen → metaDescription → primer párrafo útil del cuerpo →
// título + primer párrafo. Nunca inventa información.

function primerParrafoUtil(contenidoHtml: string): string {
  const html = contenidoHtml || '';
  const parrafos = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  for (const p of parrafos) {
    const texto = stripHtml(p);
    if (texto.length >= 40) return texto;
  }
  const todo = stripHtml(html);
  return todo.length >= 40 ? todo : '';
}

export function resolveTelegramSummary(input: {
  resumen?: string;
  metaDescription?: string;
  contenido?: string;
  titulo?: string;
}): string {
  const candidatos = [
    input.resumen,
    input.metaDescription,
    undefined,
  ];
  const resumen = stripHtml(candidatos[0] || '');
  if (resumen.length >= 5) return resumen;
  const meta = stripHtml(candidatos[1] || '');
  if (meta.length >= 5) return meta;

  const primerP = primerParrafoUtil(input.contenido || '');
  if (primerP) {
    // Último recurso: si el párrafo ya contiene el título, no duplicar.
    const titulo = (input.titulo || '').trim();
    if (titulo && primerP.toLowerCase().startsWith(titulo.toLowerCase().slice(0, 40))) {
      return primerP;
    }
    return primerP;
  }
  // Sin texto suficiente: vacío (el caption queda sin contexto pero íntegro).
  return '';
}

/** Extrae 1-2 oraciones completas ≤ maxChars del resumen resuelto. */
export function extraerContexto(texto: string, maxChars = 180): string {
  const limpio = texto.replace(/\n+/g, ' ').trim();
  const oraciones = limpio.match(/[^.!?]+[.!?]+/g) || [];
  let resultado = '';
  for (const o of oraciones) {
    const limpia = o.trim();
    if (resultado.length + limpia.length + 1 > maxChars && resultado.length > 0) break;
    resultado += (resultado ? ' ' : '') + limpia;
    if (resultado.length >= maxChars) break;
  }
  if (!resultado) {
    resultado = limpio.substring(0, maxChars).trim();
    const esp = resultado.lastIndexOf(' ');
    if (esp > maxChars * 0.6) resultado = resultado.substring(0, esp);
  }
  return resultado;
}

// ── Truncado seguro (no corta entidades ni tags) ────────────

/** Corta texto plano-escapado sin partir una entidad &...; */
function truncateEscaped(escaped: string, max: number): string {
  if (escaped.length <= max) return escaped;
  let cut = escaped.substring(0, max);
  // Si el corte cae dentro de &entidad; retrocede al '&' que la abre.
  const lastAmp = cut.lastIndexOf('&');
  const lastSemi = cut.lastIndexOf(';');
  if (lastAmp > lastSemi) cut = cut.substring(0, lastAmp);
  return cut;
}

/**
 * Construye el caption HTML final garantizando:
 * - título y contexto escapados (tags propios se mantienen),
 * - largo ≤ limit sin romper entidades ni el <a> de cierre,
 * - contexto siempre proviene del artículo (nunca inventado).
 */
export function buildTelegramCaption(input: TelegramArticleInput, url: string, limit = CAPTION_LIMIT): string {
  const emoji = EMOJI_CAT[input.categoria || ''] || '📰';
  const tituloEsc = escTelegram((input.titulo || '').substring(0, 140));
  const summary = resolveTelegramSummary(input);
  const contextoEsc = escTelegram(extraerContexto(summary, 180));

  const prefix = `<b>${emoji} ${tituloEsc}</b>\n\n`;
  // Telegram exige & escapado también dentro de atributos href.
  const link = `<a href="${url.replace(/&/g, '&amp;')}">Leer noticia completa</a>`;
  const suffix = `\n\n🔗 ${link}\n\n#NicaraguaInformate`;

  let cuerpo = contextoEsc ? `${contextoEsc}…` : '';
  let caption = `${prefix}${cuerpo}${suffix}`;

  if (caption.length > limit) {
    // Reducir solo el contexto: título y cierre quedan intactos.
    const presupuesto = limit - prefix.length - suffix.length - 1; // -1 por '…'
    if (presupuesto <= 0) {
      caption = `${prefix}${suffix}`; // sin contexto, pero válido
    } else {
      cuerpo = truncateEscaped(contextoEsc, presupuesto);
      caption = `${prefix}${cuerpo ? cuerpo + '…' : ''}${suffix}`;
    }
  }
  return caption;
}

// ── Idempotencia: claim atómico por (slug, canal) ───────────

const CLAIMS = 'distribuciones_envios';

type ClaimState = 'available' | 'already_sent' | 'busy' | 'claimed';

async function claimSend(db: Firestore | undefined, slug: string, forceRetry: boolean): Promise<{ state: ClaimState; ref?: FirebaseFirestore.DocumentReference }> {
  if (!db || !slug) return { state: 'available' };
  const ref = db.collection(CLAIMS).doc(`telegram_${slug}`);
  try {
    await ref.create({
      slug,
      channel: 'telegram',
      status: 'sending',
      claimedAt: new Date().toISOString(),
    });
    return { state: 'claimed', ref };
  } catch {
    // Ya existe → inspeccionar estado
    const snap = await ref.get();
    const data = snap.data() || {};
    if (data.status === 'sent') return { state: 'already_sent' };
    if (data.status === 'sending') return { state: 'busy' };
    if (data.status === 'failed' && forceRetry) {
      await ref.update({ status: 'sending', claimedAt: new Date().toISOString() });
      return { state: 'claimed', ref };
    }
    return { state: 'busy' };
  }
}

async function settleClaim(ref: FirebaseFirestore.DocumentReference | undefined, ok: boolean, extra: Record<string, unknown>) {
  if (!ref) return;
  try {
    await ref.update({
      status: ok ? 'sent' : 'failed',
      settledAt: new Date().toISOString(),
      ...extra,
    });
  } catch { /* best effort */ }
}

// ── Clasificación de errores ────────────────────────────────

function classifyTelegramError(status: number | undefined, description: string | undefined): { errorCode: TelegramErrorCode; retryable: boolean } {
  const desc = (description || '').toLowerCase();
  if (status === 401 || desc.includes('unauthorized')) return { errorCode: 'UNAUTHORIZED', retryable: false };
  if (desc.includes("can't parse") || desc.includes('can\'t parse') || desc.includes('parse entities')) return { errorCode: 'PARSE', retryable: false };
  if (status === 400 || status === 403 || status === 404) return { errorCode: 'TELEGRAM_API', retryable: false };
  if (status === 429 || (status !== undefined && status >= 500)) return { errorCode: 'TELEGRAM_API', retryable: true };
  return { errorCode: 'TELEGRAM_API', retryable: false };
}

function classifyFetchError(e: unknown): { errorCode: TelegramErrorCode; retryable: boolean } {
  const msg = e instanceof Error ? e.message : String(e);
  if (e instanceof Error && (e.name === 'AbortError' || e.name === 'TimeoutError' || msg.includes('timed out'))) {
    return { errorCode: 'TIMEOUT', retryable: true };
  }
  return { errorCode: 'NETWORK', retryable: true };
}

// ── Sender único ────────────────────────────────────────────

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  result?: { message_id?: number };
}

async function tgCall(token: string, method: 'sendPhoto' | 'sendMessage', payload: Record<string, unknown>): Promise<{ res: TelegramApiResponse; status: number }> {
  const http = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TG_TIMEOUT_MS),
  });
  return { res: (await http.json()) as TelegramApiResponse, status: http.status };
}

async function attemptSend(
  token: string,
  chatId: string,
  caption: string,
  url: string,
  imagen: string | undefined,
): Promise<{ ok: boolean; messageId?: number; errorCode?: TelegramErrorCode; retryable: boolean; error?: string }> {
  const markup = { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] };
  try {
    if (imagen) {
      const { res, status } = await tgCall(token, 'sendPhoto', {
        chat_id: chatId,
        photo: imagen,
        caption: caption.slice(0, CAPTION_LIMIT),
        parse_mode: 'HTML',
        reply_markup: markup,
      });
      if (res.ok) return { ok: true, messageId: res.result?.message_id, retryable: false };
      const desc = res.description || '';
      // La imagen es lo que falló (tipo/URL inalcanzable) → probar texto plano.
      if (desc.includes('wrong type') || desc.includes('failed to get HTTP URL') || desc.includes('wrong file identifier')) {
        logger.warn('[telegram] sendPhoto falló por imagen, fallback a sendMessage');
      } else {
        const c = classifyTelegramError(status, desc);
        return { ok: false, error: desc, ...c };
      }
    }
    const { res, status } = await tgCall(token, 'sendMessage', {
      chat_id: chatId,
      text: caption.slice(0, MESSAGE_LIMIT),
      parse_mode: 'HTML',
      reply_markup: markup,
    });
    if (res.ok) return { ok: true, messageId: res.result?.message_id, retryable: false };
    const c = classifyTelegramError(status, res.description);
    return { ok: false, error: res.description, ...c };
  } catch (e) {
    const c = classifyFetchError(e);
    return { ok: false, error: e instanceof Error ? e.message : 'Error', ...c };
  }
}

/**
 * Envía el artículo a Telegram. Idempotente por (slug,'telegram'):
 * si ya se envió con éxito, devuelve skipped. Un solo reintento
 * automático para errores recuperables (timeout/red/5xx/429).
 */
export async function sendTelegramArticle(
  input: TelegramArticleInput,
  options?: { db?: Firestore; forceRetry?: boolean },
): Promise<TelegramSendResult> {
  const sentAt = new Date().toISOString();
  const base: Omit<TelegramSendResult, 'ok'> = { channel: 'telegram', retryable: false, sentAt, distributionId: input.slug ? `telegram_${input.slug}` : undefined };

  if (!input.slug || !input.titulo) {
    return { ...base, ok: false, error: 'Faltan slug o título', errorCode: 'VALIDATION' };
  }

  const db = options?.db;
  const { token, chatId } = await getTelegramConfig(db);
  if (!token || !chatId) {
    return { ...base, ok: false, error: 'Faltan credenciales Telegram', errorCode: 'NO_CREDENTIALS' };
  }

  const url = `https://nicaraguainformate.com/noticias/${encodeURIComponent(input.slug)}?utm_source=telegram&utm_medium=social`;
  const caption = buildTelegramCaption(input, url);
  const imagen = input.imagenRedes || input.imagen;
  const imagenValida = imagen && !imagen.startsWith('data:') && imagen.startsWith('http') ? imagen : undefined;

  // Claim atómico: create() falla si el doc ya existe → no hay doble envío.
  const claim = await claimSend(db, input.slug, options?.forceRetry === true);
  if (claim.state === 'already_sent') {
    return { ...base, ok: true, skipped: true, reason: 'already_sent' };
  }
  if (claim.state === 'busy') {
    return { ...base, ok: false, skipped: true, reason: 'in_progress_or_failed', errorCode: 'CLAIM_BUSY' };
  }

  let attempt = await attemptSend(token, chatId, caption, url, imagenValida);
  if (!attempt.ok && attempt.retryable) {
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    attempt = await attemptSend(token, chatId, caption, url, imagenValida);
  }

  await settleClaim(claim.ref, attempt.ok, {
    error: attempt.ok ? undefined : attempt.error,
    errorCode: attempt.ok ? undefined : attempt.errorCode,
    messageId: attempt.messageId,
  });

  if (!attempt.ok) {
    logger.error('[telegram] envío falló', { slug: input.slug, error: attempt.error, errorCode: attempt.errorCode });
  }
  return { ...base, ok: attempt.ok, messageId: attempt.messageId, error: attempt.error, errorCode: attempt.errorCode, retryable: attempt.retryable };
}
