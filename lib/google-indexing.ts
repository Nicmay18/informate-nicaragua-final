/**
 * Google Indexing API - Notifica a Google cuando se publica/actualiza una URL
 * Usa el mismo service account de Firebase Admin
 */

import { logger } from './logger';
import { adminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const SCOPES = ['https://www.googleapis.com/auth/indexing'];
const INDEXING_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const DEDUP_HOURS = 24;

async function getAccessToken(): Promise<string | null> {
  try {
    // Usar las credenciales de Firebase Admin (ya están en variables de entorno)
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';

    if (!privateKey || !clientEmail) {
      logger.warn('[google-indexing] Credenciales de Firebase no configuradas');
      return null;
    }

    const { google } = await import('googleapis');
    const jwtClient = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: SCOPES,
    });

    const tokens = await jwtClient.authorize();
    return tokens.access_token || null;
  } catch (err) {
    logger.error('[google-indexing] Error obteniendo token:', err);
    return null;
  }
}

/**
 * Verifica si la URL ya fue notificada en las últimas N horas para evitar duplicados.
 */
async function isRecentlyNotified(url: string): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000);
    const snap = await adminDb
      .collection('indexing_log')
      .where('url', '==', url)
      .where('timestamp', '>=', cutoff)
      .limit(1)
      .get();
    return !snap.empty;
  } catch (err) {
    logger.warn('[google-indexing] Error consultando dedup:', err);
    return false; // En caso de fallo, permitir el envío
  }
}

/**
 * Registra el envío de notificación en Firestore para deduplicación futura.
 */
async function logIndexing(url: string, status: 'success' | 'failed', error?: string): Promise<void> {
  try {
    await adminDb.collection('indexing_log').add({
      url,
      status,
      error: error || null,
      timestamp: Timestamp.now(),
    });
  } catch (err) {
    logger.warn('[google-indexing] Error guardando log:', err);
  }
}

/**
 * Notifica a Google que una URL fue actualizada o publicada.
 * Llamar esto SIEMPRE después de crear o actualizar una noticia.
 */
export async function notifyGoogleIndexing(url: string): Promise<boolean> {
  try {
    const token = await getAccessToken();
    if (!token) {
      logger.warn('[google-indexing] No se pudo obtener token, saltando notificación');
      return false;
    }

    const res = await fetch(INDEXING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        url,
        type: 'URL_UPDATED',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      // 429 = quota exceeded, no es error crítico
      if (res.status === 429) {
        logger.warn('[google-indexing] Cuota excedida para:', url);
        return false;
      }
      logger.error(`[google-indexing] Error HTTP ${res.status}: ${text}`);
      return false;
    }

    logger.info('[google-indexing] Notificación enviada para:', url);
    return true;
  } catch (err) {
    logger.error('[google-indexing] Error enviando notificación:', err);
    return false;
  }
}

/**
 * Notifica a Google con deduplicación y registro de logs.
 * Ideal para ser llamada desde el flujo editorial de publicación.
 */
export async function notifyGoogleIndexingDeduped(url: string): Promise<{ ok: boolean; status: 'sent' | 'duplicate' | 'error' | 'skipped' }> {
  try {
    const recently = await isRecentlyNotified(url);
    if (recently) {
      logger.info('[google-indexing] URL ya notificada recientemente:', url);
      return { ok: true, status: 'duplicate' };
    }

    const token = await getAccessToken();
    if (!token) {
      logger.warn('[google-indexing] No se pudo obtener token, saltando notificación');
      return { ok: false, status: 'skipped' };
    }

    const res = await fetch(INDEXING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        url,
        type: 'URL_UPDATED',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) {
        logger.warn('[google-indexing] Cuota excedida para:', url);
      } else {
        logger.error(`[google-indexing] Error HTTP ${res.status}: ${text}`);
      }
      await logIndexing(url, 'failed', text);
      return { ok: false, status: 'error' };
    }

    logger.info('[google-indexing] Notificación enviada para:', url);
    await logIndexing(url, 'success');
    return { ok: true, status: 'sent' };
  } catch (err) {
    logger.error('[google-indexing] Error enviando notificación:', err);
    await logIndexing(url, 'failed', err instanceof Error ? err.message : String(err));
    return { ok: false, status: 'error' };
  }
}

/**
 * Envia TODAS las URLs de noticias activas a Google Indexing API.
 * Útil para re-indexar masivamente después de cambios.
 * ATENCIÓN: Google tiene límite de 200 requests por día.
 */
export async function notifyGoogleBulk(urls: string[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const url of urls) {
    const ok = await notifyGoogleIndexing(url);
    if (ok) sent++;
    else failed++;
    // Delay 1s para no saturar la API
    await new Promise(r => setTimeout(r, 1000));
  }

  return { sent, failed };
}
