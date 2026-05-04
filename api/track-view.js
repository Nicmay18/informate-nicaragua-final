export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString('utf-8');
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const { noticiaId } = body;
  if (!noticiaId || typeof noticiaId !== 'string') {
    return res.status(400).json({ error: 'Falta noticiaId' });
  }

  // Log view without Firestore write (API key lacks write permissions)
  console.log('[track-view] View logged for:', noticiaId);
  
  res.status(200).json({ success: true, logged: true });
};
