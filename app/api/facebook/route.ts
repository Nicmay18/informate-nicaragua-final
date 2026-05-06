import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { noticia, config } = body;

    const FB_PAGE_ACCESS_TOKEN = config?.facebook?.page1?.token || process.env.FB_PAGE_ACCESS_TOKEN || '';
    const FB_PAGE_ID = config?.facebook?.page1?.id || process.env.FB_PAGE_ID || '';
    const FB_PAGE_2_TOKEN = config?.facebook?.page2?.token || '';
    const FB_PAGE_2_ID = config?.facebook?.page2?.id || '';

    if (!FB_PAGE_ACCESS_TOKEN) {
      return NextResponse.json({ success: true, skipped: true, message: 'Facebook no configurado' }, { headers: CORS_HEADERS });
    }

    const mensaje = `${noticia.titulo}\n\n${noticia.resumen || (noticia.contenido || '').substring(0, 500)}\n\n#${(noticia.categoria || 'Noticias').replace(/\s+/g, '')} #Nicaragua #InformateAlInstante`;
    const tieneUrl = noticia.imagen && !noticia.imagen.startsWith('data:');

    const results: Array<{ pageId: string; postId?: string; status: string; details?: unknown }> = [];

    // Page 1
    const fbUrl1 = tieneUrl
      ? `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/photos`
      : `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/feed`;
    const body1 = tieneUrl
      ? { url: noticia.imagen, caption: mensaje, access_token: FB_PAGE_ACCESS_TOKEN }
      : { message: mensaje, access_token: FB_PAGE_ACCESS_TOKEN };

    const resp1 = await fetch(fbUrl1, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body1),
    });
    const data1 = await resp1.json();

    if (data1.id) {
      results.push({ pageId: FB_PAGE_ID, postId: data1.id, status: 'published' });
    } else {
      results.push({ pageId: FB_PAGE_ID, status: 'error', details: data1 });
    }

    // Page 2
    if (FB_PAGE_2_ID && FB_PAGE_2_TOKEN) {
      const fbUrl2 = tieneUrl
        ? `https://graph.facebook.com/v18.0/${FB_PAGE_2_ID}/photos`
        : `https://graph.facebook.com/v18.0/${FB_PAGE_2_ID}/feed`;
      const body2 = tieneUrl
        ? { url: noticia.imagen, caption: mensaje, access_token: FB_PAGE_2_TOKEN }
        : { message: mensaje, access_token: FB_PAGE_2_TOKEN };

      const resp2 = await fetch(fbUrl2, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body2),
      });
      const data2 = await resp2.json();

      if (data2.id) {
        results.push({ pageId: FB_PAGE_2_ID, postId: data2.id, status: 'published' });
      } else {
        results.push({ pageId: FB_PAGE_2_ID, status: 'error', details: data2 });
      }
    }

    return NextResponse.json({ success: true, results }, { headers: CORS_HEADERS });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS_HEADERS });
  }
}
