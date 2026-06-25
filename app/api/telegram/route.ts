import { NextRequest, NextResponse } from 'next/server';

/** Escape para Telegram HTML parse_mode: solo < > & " ' */
function escTelegram(texto: string): string {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Quitar acentos para hashtags y slugs */
function sinAcentos(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export async function POST(request: NextRequest) {
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

    if (!TG_TOKEN) return NextResponse.json({ error: 'Falta token de Telegram' }, { status: 400, headers });
    if (!TG_CHAT_ID) return NextResponse.json({ error: 'Falta chat ID de Telegram' }, { status: 400, headers });
    if (!noticia?.titulo) return NextResponse.json({ error: 'Falta título' }, { status: 400, headers });

    const emoji: Record<string, string> = {
      'Sucesos': '🚨', 'Nacionales': '📌', 'Economía': '💰', 'Cultura': '🎭',
      'Espectáculos': '🎬', 'Deportes': '⚽', 'Tecnología': '💻', 'Internacionales': '🌍'
    };

    const catEmoji = emoji[noticia.categoria] || '📰';
    const tituloRaw = (noticia.titulo || '').substring(0, 120);
    const tituloEsc = escTelegram(tituloRaw);

    // ── CONTEXTO: 1-2 oraciones cortas del resumen, sin spoiler ──
    function extraerContexto(texto: string, maxChars: number = 160): string {
      const limpio = texto.replace(/\n+/g, ' ').trim();
      const oraciones = limpio.match(/[^.!?]+[.!?]+/g) || [];
      let resultado = '';
      for (const oracion of oraciones) {
        const limpia = oracion.trim();
        if (resultado.length + limpia.length + 1 > maxChars && resultado.length > 0) break;
        resultado += (resultado ? ' ' : '') + limpia;
        if (resultado.length >= maxChars) break;
      }
      if (!resultado) {
        resultado = limpio.substring(0, maxChars).trim();
        const ultEspacio = resultado.lastIndexOf(' ');
        if (ultEspacio > maxChars * 0.6) resultado = resultado.substring(0, ultEspacio);
      }
      return resultado;
    }

    const contextoRaw = extraerContexto(noticia.resumen || noticia.contenido || '', 180);
    const contextoEsc = escTelegram(contextoRaw);

    // Slug seguro
    let slug = noticia.slug || '';
    if (!slug) {
      slug = sinAcentos(tituloRaw.toLowerCase())
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60);
    }
    const url = `https://nicaraguainformate.com/noticias/${encodeURIComponent(slug)}`;

    // Hashtags
    const htEsc = escTelegram('#NicaraguaInformate');

    // ── CAPTION NUEVO FORMATO PROFESIONAL ──
    const caption = `<b>${catEmoji} ${tituloEsc}</b>\n\n${contextoEsc}...\n\n🔗 <a href="${url}">Leer noticia completa</a>\n\n${htEsc}`;

    const imagen = noticia.imagenRedes || noticia.imagen;
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

    // Fallback si la imagen falla
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
