import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  };

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  try {
    const body = await request.json();
    const { noticia, config } = body;
    
    const TG_TOKEN = config?.telegram?.token || process.env.TG_TOKEN || '';
    const TG_CHAT_ID = config?.telegram?.chatId || process.env.TG_CHAT_ID || '';

    if (!TG_TOKEN) {
      return NextResponse.json({ error: 'Falta token de Telegram' }, { status: 400, headers });
    }
    if (!TG_CHAT_ID) {
      return NextResponse.json({ error: 'Falta chat ID de Telegram' }, { status: 400, headers });
    }
    if (!noticia?.titulo) {
      return NextResponse.json({ error: 'Falta título' }, { status: 400, headers });
    }

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
    const url = `https://www.nicaraguainformate.com/noticias/${slug}`;

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
          chat_id: TG_CHAT_ID,
          photo: imagen,
          caption: caption.slice(0, 1024),
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] }
        })
      });
    } else {
      respuesta = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: caption.slice(0, 4096),
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] }
        })
      });
    }

    let data = await respuesta.json();

    // Retry with text if photo fails
    if (!data.ok && imagenValida && data.description?.includes('wrong type')) {
      respuesta = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: caption.slice(0, 4096),
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] }
        })
      });
      data = await respuesta.json();
    }

    if (!data.ok) {
      return NextResponse.json({
        error: 'Telegram API error',
        details: data.description,
        suggestion: data.description?.includes('not found')
          ? 'Verifica que el bot esté en el canal/grupo como administrador'
          : 'Revisa el token y chat ID',
      }, { status: 400, headers });
    }

    return NextResponse.json({ success: true, messageId: data.result.message_id }, { headers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}
