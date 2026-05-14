import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

// Endpoint GET para verificar configuración (usado por el cliente)
export async function GET() {
  const hasKey = !!ELEVENLABS_API_KEY && ELEVENLABS_API_KEY.length > 10 && ELEVENLABS_API_KEY !== 'undefined';

  // Si hay key, hacer una prueba real de conectividad
  let connectionTest: { ok: boolean; status?: number; message: string } = { ok: false, message: 'Sin API key' };
  if (hasKey) {
    try {
      const testRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: 'Hola',
            model_id: 'eleven_multilingual_v2',
          }),
        }
      );
      if (testRes.ok) {
        connectionTest = { ok: true, status: testRes.status, message: 'Conexión exitosa' };
      } else {
        const errText = await testRes.text().catch(() => '');
        connectionTest = { ok: false, status: testRes.status, message: errText };
      }
    } catch (e: any) {
      connectionTest = { ok: false, message: e.message };
    }
  }

  return NextResponse.json({
    configured: hasKey,
    voiceId: VOICE_ID,
    keyPreview: hasKey ? `${ELEVENLABS_API_KEY.slice(0, 4)}...${ELEVENLABS_API_KEY.slice(-4)}` : null,
    connectionTest,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { text, articleId } = await req.json();

    if (!text || text.length < 5) {
      return NextResponse.json({ error: 'Texto inválido' }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'undefined') {
      console.error('[Audio API] ELEVENLABS_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'API Key de ElevenLabs no configurada. Agrega ELEVENLABS_API_KEY en variables de entorno de Vercel.' },
        { status: 500 }
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
          text: text.slice(0, 4500),
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

      // Mapear errores comunes a mensajes claros
      let userError = `Error de ElevenLabs (${response.status})`;
      if (response.status === 401) {
        userError = 'API Key de ElevenLabs inválida. Verifica la clave en variables de entorno de Vercel.';
      } else if (response.status === 429) {
        userError = 'Límite de uso de ElevenLabs alcanzado. Intenta más tarde o actualiza tu plan.';
      } else if (response.status === 422) {
        userError = 'Texto no válido para ElevenLabs. Verifica que no esté vacío ni sea demasiado largo.';
      } else if (response.status >= 500) {
        userError = 'ElevenLabs está experimentando problemas. Intenta más tarde.';
      }

      return NextResponse.json(
        { error: userError, detail: errText, status: response.status, provider: 'elevenlabs' },
        { status: 200 } // Devolver 200 para que el frontend pueda leer el JSON fácilmente
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString('base64');

    console.log('[Audio API] Audio generado exitosamente, size:', audioBuffer.byteLength);

    return NextResponse.json({
      success: true,
      audioBase64: `data:audio/mpeg;base64,${base64}`,
      articleId,
    });
  } catch (error) {
    console.error('[Audio API] Error interno:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
