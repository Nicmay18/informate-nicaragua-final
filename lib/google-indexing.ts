/**
 * Google Indexing API - Notifica a Google cuando se publica/actualiza una URL
 * Usa el mismo service account de Firebase Admin
 */

import { google } from 'googleapis';
import { logger } from './logger';

const SCOPES = ['https://www.googleapis.com/auth/indexing'];
const INDEXING_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

async function getAccessToken(): Promise<string | null> {
  try {
    // Usar las credenciales de Firebase Admin (ya están en variables de entorno)
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';

    if (!privateKey || !clientEmail) {
      logger.warn('[google-indexing] Credenciales de Firebase no configuradas');
      return null;
    }

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
