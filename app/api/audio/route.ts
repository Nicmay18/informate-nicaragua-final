import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/ip';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

/** Rate limiter: máximo 5 generaciones de audio por IP por minuto */
const audioLimiter = new RateLimiter({ intervalMs: 60_000, maxRequests: 5 });

/** Control de métodos HTTP: solo POST permitido para generación */
export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting por IP
    const ip = getClientIp(req);
    const rateCheck = audioLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones de audio. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 2. Parseo seguro del body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
    }

    // 3. Validación estricta de inputs
    const text = body.text;
    const articleId = body.articleId;

    if (!text || typeof text !== 'string' || text.length < 5 || text.length > 4500) {
      return NextResponse.json({ error: 'Texto inválido (5-4500 caracteres)' }, { status: 400 });
    }

<<<<<<< HEAD
    if (!articleId || typeof articleId !== 'string' || articleId.length > 100) {
=======
    // Sanitizar texto: quitar cualquier HTML/script que venga del CMS
    const sanitizedText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!articleId || typeof articleId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(articleId) || articleId.length > 100) {
>>>>>>> be8cfa629ad08a4ed74a06dc98735479b61e6361
      return NextResponse.json({ error: 'articleId inválido' }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'undefined') {
      console.error('[Audio API] ELEVENLABS_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'API Key de ElevenLabs no configurada' },
        { status: 503 }
      );
    }

    console.log('[Audio API] Generando audio, texto length:', text.length, 'voiceId:', VOICE_ID);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: sanitizedText.slice(0, 4500),
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Audio API] ElevenLabs HTTP', response.status, errText);

      let userError = `Error de ElevenLabs (${response.status})`;
      if (response.status === 401) {
        userError = 'API Key de ElevenLabs inválida.';
      } else if (response.status === 429) {
        userError = 'Límite de uso de ElevenLabs alcanzado. Intenta más tarde.';
      } else if (response.status === 422) {
        userError = 'Texto no válido para ElevenLabs.';
      } else if (response.status >= 500) {
        userError = 'ElevenLabs está experimentando problemas. Intenta más tarde.';
      }

      return NextResponse.json(
<<<<<<< HEAD
        { error: userError, detail: errText, status: response.status, provider: 'elevenlabs' },
        { status: 502 } // Bad Gateway: error upstream
=======
        { error: userError, status: response.status, provider: 'elevenlabs' },
        { status: 502 }
>>>>>>> be8cfa629ad08a4ed74a06dc98735479b61e6361
      );
    }

    // Devolver audio como stream binario directo (33% más eficiente que base64 JSON)
    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
        'X-Article-Id': articleId,
      },
    });
  } catch (error) {
    console.error('[Audio API] Error interno:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
