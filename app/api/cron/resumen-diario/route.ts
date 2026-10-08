import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { isRenderableArticle } from '@/lib/editorial/canonical';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';
import { logger } from '@/lib/logger';
import { getTelegramConfig } from '@/lib/telegram';
import { fetchPublishedDocs } from '@/lib/data';
import {
  buildTelegramDigest,
  buildTelegramItem,
  selectDigestNews,
} from '@/lib/distribution/social-copy';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TG_TIMEOUT_MS = 10000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 2000;
const VENTANA_MS = 30 * 60 * 60 * 1000; // últimas 30h

interface NoticiaRow {
  id: string;
  slug: string;
  titulo: string;
  resumen?: string;
  contenido?: string;
  metaDescription?: string;
  categoria?: string;
  fecha?: unknown;
  publishedAt?: unknown;
  fechaPublicacion?: unknown;
  vistas?: number;
  estado?: string;
  publicado?: boolean;
  archived?: boolean;
  noindex?: boolean;
  aprobadoMeni?: boolean;
}

/** Fecha legible en español, zona Nicaragua (UTC-6). */
function fechaNicaragua(): { iso: string; legible: string } {
  const ni = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const iso = ni.toISOString().slice(0, 10);
  const legible = `${dias[ni.getUTCDay()][0].toUpperCase() + dias[ni.getUTCDay()].slice(1)} ${ni.getUTCDate()} de ${meses[ni.getUTCMonth()]} de ${ni.getUTCFullYear()}`;
  return { iso, legible };
}

/** Timestamp canónico: publishedAt → fechaPublicacion → fecha (cualquier tipo). */
function docTs(n: NoticiaRow): number {
  for (const f of [n.publishedAt, n.fechaPublicacion, n.fecha]) {
    if (!f) continue;
    if (typeof f === 'number') return f;
    if (typeof f === 'string') { const t = Date.parse(f); if (!isNaN(t)) return t; }
    const a = f as { toDate?: () => Date; _seconds?: number; seconds?: number };
    if (typeof a.toDate === 'function') return a.toDate().getTime();
    if (typeof a._seconds === 'number') return a._seconds * 1000;
    if (typeof a.seconds === 'number') return a.seconds * 1000;
  }
  return 0;
}

function esRetryable(status: number | undefined, description?: string): boolean {
  if (status === 429 || (status !== undefined && status >= 500)) return true;
  const d = (description || '').toLowerCase();
  return d.includes('timeout') || d.includes('timed out');
}

async function sendDigestMessage(token: string, chatId: string, mensaje: string) {
  let lastError: { status?: number; description?: string } = {};
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * i));
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: mensaje.slice(0, 4096),
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(TG_TIMEOUT_MS),
      });
      const data = await res.json();
      if (data.ok) return { ok: true as const, messageId: data.result?.message_id as number | undefined };
      lastError = { status: res.status, description: data.description };
      if (!esRetryable(res.status, data.description)) break;
    } catch (e) {
      lastError = { description: e instanceof Error ? e.message : 'Error de red' };
      // Errores de red/timeout → reintenta
    }
  }
  return { ok: false as const, error: lastError.description || 'Telegram API error', status: lastError.status };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const force = searchParams.get('force') === '1';
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.replace(/^Bearer\s+/i, '');
  if (!verifyAdminOrCronToken(secret) && !verifyAdminOrCronToken(bearer)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const cronPath = '/api/cron/resumen-diario';
  // Log de ejecución: TODA salida (skip/error/success) deja rastro.
  const runLog = async (estado: string, extra: Record<string, unknown>) => {
    try {
      await getAdminDb().collection('distribuciones_runs').add({
        job: 'resumen-diario',
        canal: 'telegram',
        estado,
        durationMs: Date.now() - startedAt,
        fecha: new Date().toISOString(),
        ...extra,
      });
    } catch (e) {
      logger.warn('[resumen-diario] no se pudo escribir run log', e);
    }
  };

  try {
    const db = getAdminDb();
    const { iso, legible } = fechaNicaragua();

    // ── IDEMPOTENCIA: un solo boletín por día (salvo ?force=1) ──
    // Solo 'sent' bloquea: docs skipped/failed NO consumen el día,
    // el cron puede reintentar si el ciclo anterior falló a medias.
    const docRef = db.collection('resumenes_diarios').doc(iso);
    if (!force) {
      const existe = await docRef.get();
      if (existe.exists && existe.data()?.status === 'sent') {
        await runLog('skipped', { reason: `Ya se envió el resumen de ${iso}` });
        await recordCronHeartbeat(cronPath, { status: 'healthy', durationMs: Date.now() - startedAt, note: `Resumen ${iso} ya enviado` });
        return NextResponse.json({ success: true, skipped: true, reason: `Ya se envió el resumen de ${iso}` });
      }
    }

    // ── Selección: pool canónico de publicadas (maneja fecha de tipo mixto)
    const docs = await fetchPublishedDocs(
      ['slug', 'titulo', 'resumen', 'contenido', 'metaDescription', 'metaDescripcion', 'categoria', 'vistas', 'imagen', 'imagenRedes'],
      200,
    );
    const ahora = Date.now();
    const candidatas = docs
      .map((d) => ({ id: d.id, ...d.data() }) as NoticiaRow)
      .filter((n) => {
        if (!isRenderableArticle(n as any)) return false;
        const t = docTs(n);
        return t > 0 && ahora - t <= VENTANA_MS;
      })
      .sort((a, b) => (b.vistas || 0) - (a.vistas || 0) || docTs(b) - docTs(a));

    const seleccionadas = selectDigestNews(candidatas, 6);

    if (seleccionadas.length === 0) {
      await runLog('skipped', { reason: 'No hay noticias recientes para el resumen', candidatas: candidatas.length });
      await recordCronHeartbeat(cronPath, { status: 'degraded', durationMs: Date.now() - startedAt, note: `Sin candidatas para ${iso}` });
      return NextResponse.json({ success: true, skipped: true, reason: 'No hay noticias recientes para el resumen' });
    }

    // ── Construir boletín editorial por secciones ──
    const items = seleccionadas.map((n) =>
      buildTelegramItem({
        slug: n.slug,
        titulo: n.titulo,
        resumen: n.resumen,
        contenido: n.contenido,
        metaDescription: n.metaDescription || (n as { metaDescripcion?: string }).metaDescripcion,
        categoria: n.categoria,
      }),
    );
    const mensaje = buildTelegramDigest(items, legible);

    // ── Claim atómico del día (solo si va a enviarse) ──
    if (!force) {
      try {
        await docRef.create({ fecha: iso, status: 'sending', claimedAt: new Date().toISOString() });
      } catch {
        await runLog('skipped', { reason: 'Claim concurrente: otro proceso ya está enviando/envió' });
        return NextResponse.json({ success: true, skipped: true, reason: 'Resumen en progreso o ya enviado' });
      }
    }

    // ── Enviar con reintentos controlados ──
    const { token: TG_TOKEN, chatId: TG_CHAT_ID } = await getTelegramConfig(db);
    if (!TG_TOKEN || !TG_CHAT_ID) {
      await runLog('error', { reason: 'Faltan credenciales de Telegram' });
      await recordCronHeartbeat(cronPath, { status: 'down', durationMs: Date.now() - startedAt, note: 'Sin credenciales Telegram' });
      return NextResponse.json({ error: 'Faltan credenciales de Telegram' }, { status: 400 });
    }

    const sent = await sendDigestMessage(TG_TOKEN, TG_CHAT_ID, mensaje);

    if (!sent.ok) {
      await docRef.set(
        { fecha: iso, status: 'failed', error: sent.error, enviadoEn: new Date().toISOString(), cantidad: seleccionadas.length, slugs: seleccionadas.map((n) => n.slug) },
        { merge: true },
      ).catch(() => {});
      await runLog('error', { reason: sent.error, status: sent.status, candidatas: seleccionadas.length });
      await recordCronHeartbeat(cronPath, { status: 'down', durationMs: Date.now() - startedAt, note: `Telegram falló: ${sent.error}` });
      return NextResponse.json({ error: 'Telegram API error', details: sent.error }, { status: 502 });
    }

    await docRef.set({
      fecha: iso,
      status: 'sent',
      enviadoEn: new Date().toISOString(),
      cantidad: seleccionadas.length,
      slugs: seleccionadas.map((n) => n.slug),
      messageId: sent.messageId || null,
    });

    await runLog('sent', { cantidad: seleccionadas.length, slugs: seleccionadas.map((n) => n.slug), messageId: sent.messageId });
    await recordCronHeartbeat(cronPath, { status: 'healthy', durationMs: Date.now() - startedAt, note: `Resumen ${iso} enviado (${seleccionadas.length} noticias)` });

    return NextResponse.json({
      success: true,
      fecha: iso,
      enviadas: seleccionadas.length,
      messageId: sent.messageId,
      titulares: seleccionadas.map((n) => n.titulo),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    logger.error('[cron/resumen-diario]', msg);
    await runLog('error', { reason: msg });
    await recordCronHeartbeat(cronPath, { status: 'down', durationMs: Date.now() - startedAt, note: `Error: ${msg}` });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
