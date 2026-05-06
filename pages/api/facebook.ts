import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { noticia, config } = req.body;

    const FB_PAGE_ACCESS_TOKEN = config?.facebook?.page1?.token || process.env.FB_PAGE_ACCESS_TOKEN || '';
    const FB_PAGE_ID = config?.facebook?.page1?.id || process.env.FB_PAGE_ID || '';
    const FB_PAGE_2_TOKEN = config?.facebook?.page2?.token || '';
    const FB_PAGE_2_ID = config?.facebook?.page2?.id || '';

    if (!FB_PAGE_ACCESS_TOKEN) {
      return res.status(200).json({ success: true, skipped: true, message: 'Facebook no configurado' });
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

    return res.status(200).json({ success: true, results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return res.status(500).json({ error: msg });
  }
}
