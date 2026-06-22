import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'ni-indexnow-key-2026-x7k9m3p2q8r5t1u4';
const DOMAIN = 'nicaraguainformate.com';
const INDEXNOW_URL = 'https://api.indexnow.org/IndexNow';
const INDEXNOW_KEY_LOCATION = `https://${DOMAIN}/indexnow-key.txt`;

/**
 * ═══════════════════════════════════════════════════════════════
 * AGENTE DE INDEXACIÓN — Nicaragua Informate
 * Se ejecuta automáticamente al publicar una noticia
 * ═══════════════════════════════════════════════════════════════
 *
 * Qué hace:
 * 1. Envía URL a IndexNow (Bing/Yahoo/DuckDuckGo/Yandex) — GRATIS
 * 2. Si está configurado, envía a Google Indexing API
 * 3. Notifica resultado
 *
 * Configuración requerida:
 * - INDEXNOW_KEY: clave aleatoria de 64 chars (generar con openssl rand -hex 32)
 * - GOOGLE_INDEXING_CREDENTIALS_BASE64: JSON de service account en base64 (opcional)
 */

interface IndexPayload {
  url: string;
  slug?: string;
  title?: string;
}

/**
 * Enviar URL a IndexNow (Bing, Yahoo, DuckDuckGo, Yandex)
 * Cuota: 10,000 URLs/día
 */
async function submitIndexNow(url: string): Promise<{ success: boolean; message: string }> {
  if (!INDEXNOW_KEY) {
    return { success: false, message: 'INDEXNOW_KEY no configurada' };
  }

  try {
    const response = await fetch(INDEXNOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: DOMAIN,
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList: [url],
      }),
    });

    if (response.status === 200) {
      return { success: true, message: 'IndexNow: URL aceptada (Bing/Yahoo/DuckDuckGo)' };
    }
    if (response.status === 202) {
      return { success: true, message: 'IndexNow: URL en cola de procesamiento' };
    }

    const text = await response.text().catch(() => `HTTP ${response.status}`);
    return { success: false, message: `IndexNow error ${response.status}: ${text}` };
  } catch (err) {
    return { success: false, message: `IndexNow excepción: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * Enviar URL a Google Indexing API
 * Cuota: 200 URLs/día
 * Requiere: Google Cloud project + service account con permiso "Owner" en Search Console
 */
async function submitGoogleIndexing(url: string): Promise<{ success: boolean; message: string }> {
  const base64Credentials = process.env.GOOGLE_INDEXING_CREDENTIALS_BASE64;
  if (!base64Credentials) {
    return { success: false, message: 'Google Indexing API no configurado (GOOGLE_INDEXING_CREDENTIALS_BASE64)' };
  }

  try {
    // Decodificar credenciales desde base64
    const credentialsJson = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({ version: 'v3', auth });
    await indexing.urlNotifications.publish({
      requestBody: { url, type: 'URL_UPDATED' },
    });

    return { success: true, message: 'Google Indexing API: URL enviada' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Errores comunes de Google Indexing API
    if (msg.includes('Permission denied') || msg.includes('403')) {
      return { success: false, message: 'Google: Permiso denegado. Verifica que la service account tenga rol "Owner" en Search Console.' };
    }
    if (msg.includes('insufficient_quota') || msg.includes('429')) {
      return { success: false, message: 'Google: Cuota excedida (200 URLs/día). Reintentar mañana.' };
    }
    return { success: false, message: `Google Indexing API error: ${msg}` };
  }
}

/**
 * Auditoría rápida de calidad mínima antes de indexar
 */
function quickAudit(url: string, title?: string): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!url || !url.startsWith('https://')) {
    errors.push('URL inválida (debe empezar con https://)');
  }
  if (!url.includes(DOMAIN)) {
    errors.push(`URL debe pertenecer a ${DOMAIN}`);
  }
  if (title && title.length > 70) {
    errors.push('Título excede 70 caracteres');
  }

  return { passed: errors.length === 0, errors };
}

/**
 * POST /api/admin/index
 * Body: { url: string, slug?: string, title?: string }
 */
export async function POST(request: Request) {
  try {
    const body: IndexPayload = await request.json();
    const { url, title } = body;

    // ─── Auditoría previa ───
    const audit = quickAudit(url, title);
    if (!audit.passed) {
      return NextResponse.json(
        { success: false, status: 'AUDIT_FAILED', errors: audit.errors },
        { status: 400 }
      );
    }

    // ─── Enviar a IndexNow (siempre, es gratuito) ───
    const indexNowResult = await submitIndexNow(url);

    // ─── Enviar a Google (opcional, solo si configurado) ───
    const googleResult = await submitGoogleIndexing(url);

    // ─── Responder ───
    const allPassed = indexNowResult.success || googleResult.success;

    return NextResponse.json({
      success: allPassed,
      status: allPassed ? 'INDEXED' : 'PARTIAL_FAILURE',
      url,
      results: {
        indexNow: indexNowResult,
        google: googleResult,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, status: 'ERROR', error: message },
      { status: 500 }
    );
  }
}
