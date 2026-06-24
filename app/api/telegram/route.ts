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

    // ── GANCHO: primera oración del resumen como tensión, no como spoiler ──
    let resumenCompleto = (noticia.resumen || noticia.contenido || '').replace(/\n+/g, ' ').trim();
    const primerPunto = resumenCompleto.search(/[.!?]/);
    let gancho = primerPunto > 20
      ? resumenCompleto.substring(0, primerPunto + 1)
      : resumenCompleto.substring(0, 100).trim();

    // Si el gancho es igual al título, usar segunda oración
    if (gancho.toLowerCase().trim() === tituloRaw.toLowerCase().trim()) {
      const restoInicial = resumenCompleto.substring(primerPunto + 1).trim();
      const segundoPunto = restoInicial.search(/[.!?]/);
      if (segundoPunto > 0) {
        const resto = restoInicial.substring(segundoPunto + 1).trim();
        const tercerPunto = resto.search(/[.!?]/);
        gancho = tercerPunto > 10 ? resto.substring(0, tercerPunto + 1) : resto.substring(0, 120);
      }
    }
    const ganchoEsc = escTelegram(gancho);

    // Línea de cierre según categoría
    const cierres: Record<string, string> = {
      'Sucesos': 'Los detalles completos en la nota.',
      'Deportes': 'Todos los detalles en la nota.',
      'Nacionales': 'Lee la nota completa.',
      'Economía': 'Análisis completo en la nota.',
      'Internacionales': 'Contexto completo en la nota.',
    };
    const cierreEsc = escTelegram(cierres[noticia.categoria] || 'Nota completa en el sitio.');

    // Slug seguro
    let slug = noticia.slug || '';
    if (!slug) {
      slug = sinAcentos(tituloRaw.toLowerCase())
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60);
    }
    const url = `https://nicaraguainformate.com/noticias/${encodeURIComponent(slug)}`;

    // Hashtags limpios
    const hashtags: string[] = [];
    if (noticia.categoria && noticia.categoria !== 'Nacionales') {
      hashtags.push(`#${sinAcentos(noticia.categoria).replace(/\s+/g, '')}`);
    }
    if (hashtags.length === 0) hashtags.push('#Nicaragua');
    hashtags.push('#NicaraguaInformate');
    const htEsc = escTelegram(hashtags.join(' '));

    // ── CAPTION SEGURO ──
    const caption = `<b>${catEmoji} ${tituloEsc}</b>\n\n${ganchoEsc}\n\n${cierreEsc}\n\n${htEsc}\n\n→ <a href="${url}">nicaraguainformate.com</a>`;

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
