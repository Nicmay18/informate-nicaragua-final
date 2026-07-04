import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 5;

/**
 * HONEYPOT: Este endpoint fue eliminado permanentemente.
 *
 * El audio/TTS ahora se genera directamente en el navegador del usuario
 * usando Web Speech API nativa (ver components/AudioButton.tsx).
 *
 * Cualquier invocación a este endpoint viene de:
 * 1. Caché de navegadores con versión vieja del frontend
 * 2. Bots / scrapers que descubrieron la URL
 * 3. Scripts de terceros
 *
 * Devolvemos 410 Gone para que caches y bots dejen de intentarlo.
 */
async function logUnexpected(request: Request) {
  const headers = Object.fromEntries(request.headers);
  console.error('HONEYPOT /api/audio CALL:', {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    referer: headers.referer || '',
    origin: headers.origin || '',
    'user-agent': headers['user-agent'] || '',
    'x-forwarded-for': headers['x-forwarded-for'] || '',
    'cf-connecting-ip': headers['cf-connecting-ip'] || '',
  });
}

export async function GET(request: Request) {
  await logUnexpected(request);
  return NextResponse.json(
    { error: 'Gone. Audio disabled permanently.' },
    { status: 410 }
  );
}

export async function POST(request: Request) {
  await logUnexpected(request);
  return NextResponse.json(
    { error: 'Gone. Audio disabled permanently.' },
    { status: 410 }
  );
}
