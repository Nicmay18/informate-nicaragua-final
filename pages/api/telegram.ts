import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { noticia, config } = req.body;
    const TG_TOKEN = config?.telegram?.token || process.env.TG_TOKEN || '';
    const TG_CHAT_ID = config?.telegram?.chatId || process.env.TG_CHAT_ID || '';

    if (!TG_TOKEN) return res.status(400).json({ error: 'Falta token de Telegram' });
    if (!TG_CHAT_ID) return res.status(400).json({ error: 'Falta chat ID de Telegram' });
    if (!noticia?.titulo) return res.status(400).json({ error: 'Falta título' });

    const emoji: Record<string, string> = {
      'Sucesos': '🚨', 'Nacionales': '📌', 'Economía': '💰', 'Cultura': '🎭',
      'Espectáculos': '🎬', 'Deportes': '⚽', 'Tecnología': '💻', 'Internacionales': '🌍'
    };

    const catEmoji = emoji[noticia.categoria] || '📰';
    const titulo = (noticia.titulo || '').substring(0, 120);

    let resumen = (noticia.resumen || noticia.contenido || '').substring(0, 220).trim();
    const ultimoPunto = resumen.lastIndexOf('.');
    if (ultimoPunto > 60) resumen = resumen.substring(0, ultimoPunto + 1);
    resumen = resumen.replace(/\n+/g, ' ').trim();

    const slug = noticia.slug || noticia.titulo?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 60);
    const url = `https://nicaraguainformate.com/noticias/${slug}`;

    const hashtags: string[] = [];
    if (noticia.categoria && noticia.categoria !== 'Nacionales') {
      hashtags.push(`#${noticia.categoria.replace(/\s+/g, '')}`);
    }
    if (hashtags.length === 0) hashtags.push('#Nicaragua');

    const caption = `<b>${catEmoji} ${titulo}</b>\n\n${resumen}\n\n${hashtags.join(' ')}\n\n→ <a href="${url}">Leer más en nicaraguainformate.com</a>`;

    let imagen = noticia.imagenRedes || noticia.imagen;
    const imagenValida = imagen && !imagen.startsWith('data:') && imagen.startsWith('http');

    let respuesta;
    if (imagenValida) {
      respuesta = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID, photo: imagen,
          caption: caption.slice(0, 1024), parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] }
        })
      });
    } else {
      respuesta = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID, text: caption.slice(0, 4096), parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] }
        })
      });
    }

    let data = await respuesta.json();

    if (!data.ok && imagenValida && data.description?.includes('wrong type')) {
      respuesta = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID, text: caption.slice(0, 4096), parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] }
        })
      });
      data = await respuesta.json();
    }

    if (!data.ok) {
      return res.status(400).json({
        error: 'Telegram API error', details: data.description,
        suggestion: data.description?.includes('not found')
          ? 'Verifica que el bot esté en el canal/grupo como administrador'
          : 'Revisa el token y chat ID',
      });
    }

    return res.status(200).json({ success: true, messageId: data.result.message_id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return res.status(500).json({ error: msg });
  }
}
