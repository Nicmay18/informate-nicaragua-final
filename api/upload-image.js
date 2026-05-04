export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const debug = process.env.DEBUG === '1';
    let body = req.body;
    if (Buffer.isBuffer(body)) body = body.toString('utf-8');
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    if (!body || typeof body !== 'object') body = {};

    const { imagen, nombre } = body;
    if (!imagen || typeof imagen !== 'string') {
      return res.status(400).json({ error: 'Falta imagen válida' });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (debug) console.log('[upload-image] Token exists:', !!GITHUB_TOKEN);
    if (!GITHUB_TOKEN) {
      return res.status(500).json({ error: 'GITHUB_TOKEN no configurado en Vercel' });
    }

    const REPO = 'Nicmay18/informate-nicaragua';
    const BRANCH = 'main';

    const base64 = imagen.includes(',') ? imagen.split(',').pop().trim() : imagen.trim();
    if (!base64) {
      return res.status(400).json({ error: 'Contenido de imagen inválido' });
    }

    const extMatch = imagen.match(/^data:image\/(\w+);base64,/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'webp';
    const safeName = String(nombre || 'img')
      .trim()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 32) || 'imagen';

    const filename = `public/images/${Date.now()}_${safeName}.${ext}`;
    const apiUrl = `https://api.github.com/repos/${REPO}/contents/${filename}`;

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'informate-nicaragua'
      },
      body: JSON.stringify({
        message: `img: subir ${filename}`,
        content: base64,
        branch: BRANCH
      })
    });

    const data = await response.json();
    if (debug) console.log('[upload-image] GitHub status:', response.status, 'ok:', response.ok);
    if (!response.ok) {
      if (debug) console.log('[upload-image] GitHub error:', data);
      return res.status(response.status || 500).json({ error: data.message || 'Error al subir imagen a GitHub' });
    }

    const cdnUrl = `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/${filename}`;
    const rawUrl = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${filename}`;

    return res.status(200).json({ success: true, url: cdnUrl, rawUrl, filename });
  } catch (error) {
    console.error('[upload-image] Error:', error);
    return res.status(500).json({ error: String(error) });
  }
}

// Nota: La compresión de imágenes se hace en el cliente (admin) antes de enviar
// para evitar usar Canvas en el servidor Node.js
