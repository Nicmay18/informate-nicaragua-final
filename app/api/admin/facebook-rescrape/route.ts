import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FB_ACCESS_TOKEN = process.env.FB_PAGE_TOKEN || process.env.FB_ACCESS_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'url requerida' }, { status: 400 });
    }

    // Método 1: Usar Graph API para forzar re-scrape (requiere token)
    if (FB_ACCESS_TOKEN) {
      const graphUrl = `https://graph.facebook.com/?id=${encodeURIComponent(url)}&scrape=true&access_token=${FB_ACCESS_TOKEN}`;
      const res = await fetch(graphUrl, { method: 'POST' });
      const data = await res.json();
      return NextResponse.json({
        success: true,
        method: 'graph_api',
        url,
        facebookResponse: data,
      });
    }

    // Método 2: Sin token, devolver instrucciones manuales
    return NextResponse.json({
      success: false,
      manual: true,
      url,
      instructions: 'Abre https://developers.facebook.com/tools/debug/ y pega esta URL para hacer "Scrape Again"',
      error: 'Falta FB_PAGE_TOKEN o FB_ACCESS_TOKEN en variables de entorno',
    });
  } catch (err: any) {
    console.error('[admin/facebook-rescrape]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
