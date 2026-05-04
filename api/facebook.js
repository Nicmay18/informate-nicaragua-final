// api/facebook.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString('utf-8');
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const { noticia, config } = body;
  
  // Usar tokens del config (desde admin) o del .env (fallback)
  const FB_PAGE_ACCESS_TOKEN = config?.facebook?.page1?.token || process.env.FB_PAGE_ACCESS_TOKEN;
  const FB_PAGE_ID = config?.facebook?.page1?.id || process.env.FB_PAGE_ID || '741453509043658';
  const FB_PAGE_2_TOKEN = config?.facebook?.page2?.token || process.env.FB_PAGE_ACCESS_TOKEN;
  const FB_PAGE_2_ID = config?.facebook?.page2?.id || '';

  const debug = process.env.DEBUG === '1';

  if (!FB_PAGE_ACCESS_TOKEN) {
    return res.status(200).json({ 
      success: true, 
      skipped: true,
      message: 'Facebook no configurado - publicación local solamente'
    });
  }

  try {
    const https = require('https');
    
    const mensaje = `${noticia.titulo}\n\n${noticia.resumen || noticia.contenido?.substring(0, 500) || ''}\n\n#${(noticia.categoria || 'Noticias').replace(/\s+/g, '')} #Nicaragua #InformateAlInstante`;
    const esBase64 = (noticia.imagen || '').startsWith('data:');
    const tieneUrl = noticia.imagen && !esBase64;
    
    const results = [];

    // Función helper para hacer peticiones HTTPS
    const makeRequest = (url, body) => {
      return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(body);
        
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              reject(new Error('Invalid JSON response'));
            }
          });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
      });
    };

    // Publicar en Página 1
    const fbUrl1 = tieneUrl
      ? `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/photos`
      : `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/feed`;
    const body1 = tieneUrl
      ? { url: noticia.imagen, caption: mensaje, access_token: FB_PAGE_ACCESS_TOKEN }
      : { message: mensaje, access_token: FB_PAGE_ACCESS_TOKEN };
    
    const response1 = await makeRequest(fbUrl1, body1);
    const data1 = response1.body;

    if (debug) console.log('[FB Page 1] Respuesta:', JSON.stringify(data1));

    if (data1.id) {
      results.push({ pageId: FB_PAGE_ID, postId: data1.id, status: 'published' });
    } else {
      results.push({ pageId: FB_PAGE_ID, status: 'error', details: data1 });
    }

    // Publicar en Página 2 si está configurada
    if (FB_PAGE_2_ID && FB_PAGE_2_TOKEN) {
      const fbUrl2 = tieneUrl
        ? `https://graph.facebook.com/v18.0/${FB_PAGE_2_ID}/photos`
        : `https://graph.facebook.com/v18.0/${FB_PAGE_2_ID}/feed`;
      const body2 = tieneUrl
        ? { url: noticia.imagen, caption: mensaje, access_token: FB_PAGE_2_TOKEN }
        : { message: mensaje, access_token: FB_PAGE_2_TOKEN };
      
      const response2 = await makeRequest(fbUrl2, body2);
      const data2 = response2.body;

      if (debug) console.log('[FB Page 2] Respuesta:', JSON.stringify(data2));

      if (data2.id) {
        results.push({ pageId: FB_PAGE_2_ID, postId: data2.id, status: 'published' });
      } else {
        results.push({ pageId: FB_PAGE_2_ID, status: 'error', details: data2 });
      }
    }

    return res.json({ success: true, results });
  } catch (error) {
    console.error('[FB] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
