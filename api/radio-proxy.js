// API de Radios de Nicaragua
// Devuelve la URL directa del stream y verifica disponibilidad
// NO hace proxy del audio — el cliente se conecta directamente

const RADIOS_NICARAGUA = {
  'radioya': { nombre: 'Radio YA', url: 'https://stream.ecmdigital.net:8010/radioya' },
  'buenisima': { nombre: 'Radio La Buenísima', url: 'https://stream.zeno.fm/f24tdg9bq68uv' },
  'pachanguera': { nombre: 'La Pachanguera', url: 'https://stream.zeno.fm/8qhxqhx2gg0uv' },
  'futura': { nombre: 'Radio Futura', url: 'https://stream.zeno.fm/nqhxqhx2gg0uv' },
  'vivafm': { nombre: 'Viva FM', url: 'https://stream.zeno.fm/aqf8fnx2gg0uv' }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { radio } = req.query;

  // Si no se especifica radio, devolver lista de todas
  if (!radio) {
    return res.status(200).json({
      radios: Object.entries(RADIOS_NICARAGUA).map(([id, r]) => ({
        id, nombre: r.nombre, url: r.url
      }))
    });
  }

  const radioData = RADIOS_NICARAGUA[radio];
  if (!radioData) {
    return res.status(400).json({ error: 'Radio no encontrada', disponibles: Object.keys(RADIOS_NICARAGUA) });
  }

  // Verificar que la radio responde (HEAD request rápido, 3s timeout)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const check = await fetch(radioData.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RadioCheck/1.0)' }
    });
    clearTimeout(timeout);

    return res.status(200).json({
      id: radio,
      nombre: radioData.nombre,
      url: radioData.url,
      online: true,
      status: check.status
    });
  } catch (e) {
    // Aunque no responda al HEAD, la URL puede funcionar para audio directo
    return res.status(200).json({
      id: radio,
      nombre: radioData.nombre,
      url: radioData.url,
      online: false,
      error: e.message || 'Timeout al verificar'
    });
  }
}
