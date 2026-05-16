import { NextResponse } from 'next/server';

const RADIOS_NICARAGUA: Record<string, string> = {
  'radioya': 'https://stream.ecmdigital.net:8010/radioya',
  'buenisima': 'https://stream.zeno.fm/f24tdg9bq68uv',
  'pachanguera': 'https://stream.zeno.fm/8qhxqhx2gg0uv',
  'futura': 'https://stream.zeno.fm/nqhxqhx2gg0uv',
  'vivafm': 'https://stream.zeno.fm/aqf8fnx2gg0uv'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const radio = searchParams.get('radio');
  const url = searchParams.get('url');

  let streamUrl: string;
  if (url) {
    streamUrl = decodeURIComponent(url);
  } else if (radio && RADIOS_NICARAGUA[radio]) {
    streamUrl = RADIOS_NICARAGUA[radio];
  } else {
    return NextResponse.json({
      error: 'Radio no encontrada. Usa ?radio=nombre o ?url=encodeURIComponent(streamUrl)',
      available: Object.keys(RADIOS_NICARAGUA)
    }, { status: 400 });
  }
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(streamUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'audio/*, */*',
        'Icy-MetaData': '1',
        'Connection': 'keep-alive',
      },
      redirect: 'follow'
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Crear stream response con headers correctos
    const headers = new Headers({
      'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Pasar icy-metaint si existe (metadata de la canción)
    const icyMetaInt = response.headers.get('icy-metaint');
    if (icyMetaInt) {
      headers.set('icy-metaint', icyMetaInt);
    }

    return new Response(response.body, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Error streaming:', error);
    return NextResponse.json({ 
      error: 'Error al conectar con la radio',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Manejar OPTIONS para CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
