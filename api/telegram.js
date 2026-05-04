export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Parse body manually for Vercel
    let body = req.body;
    if (Buffer.isBuffer(body)) body = body.toString('utf-8');
    if (typeof body === 'string') body = JSON.parse(body);
    if (!body || typeof body !== 'object') body = {};
    
    const { noticia, config } = body;
    const TG_TOKEN = config?.telegram?.token || process.env.TG_TOKEN;
    let TG_CHAT_ID = config?.telegram?.chatId || process.env.TG_CHAT_ID;
    
    // Telegram acepta chat_id como string o número. No convertir a número para evitar overflow en IDs grandes.
    
    const debug = true; // Forzar logs para diagnostico
    console.log('[TELEGRAM DEBUG] Request body keys:', Object.keys(body));
    console.log('[TELEGRAM DEBUG] Config recibida:', JSON.stringify(config));
    console.log('[TELEGRAM DEBUG] tokenExists:', !!TG_TOKEN, '| chatId:', TG_CHAT_ID, '| chatIdType:', typeof TG_CHAT_ID);

    if (!TG_TOKEN) {
      console.log('[TELEGRAM DEBUG] ERROR: Token vacío');
      return res.status(400).json({ error: 'Falta token de Telegram', details: 'config.telegram.token está vacío' });
    }
    if (!TG_CHAT_ID) {
      console.log('[TELEGRAM DEBUG] ERROR: Chat ID vacío');
      return res.status(400).json({ error: 'Falta chat ID de Telegram', details: 'config.telegram.chatId está vacío' });
    }
    if (!noticia?.titulo) return res.status(400).json({ error: 'Falta título' });

    const emoji = {
      'Sucesos': '🚨', 'Nacionales': '📌', 'Economía': '💰', 'Cultura': '�',
      'Espectáculos': '🎬', 'Deportes': '⚽', 'Tecnología': '�', 'Internacionales': '�'
    };

    const catEmoji = emoji[noticia.categoria] || '📰';
    const titulo = (noticia.titulo || '').substring(0, 120);
    
    // Resumen profesional: corto, directo, máximo 200 chars (estilo La Prensa)
    const resumenCompleto = noticia.resumen || noticia.contenido || '';
    let resumen = resumenCompleto.substring(0, 220).trim();
    const ultimoPunto = resumen.lastIndexOf('.');
    if (ultimoPunto > 60) resumen = resumen.substring(0, ultimoPunto + 1);
    // Quitar saltos de línea excesivos
    resumen = resumen.replace(/\n+/g, ' ').trim();
    
    // Generar URL directa a la noticia - siempre usar slug para SEO y legibilidad
    const slug = noticia.slug || noticia.titulo?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 60);
    const noticiaId = noticia.id || Date.now().toString(36);
    const url = `https://nicaraguainformate.com/noticia.html?id=${noticiaId}&slug=${encodeURIComponent(slug)}`;

    // Hashtags limitados: máximo 1-2, discretos (no saturar como TN8)
    const hashtags = [];
    if (noticia.categoria && noticia.categoria !== 'Nacionales') {
      hashtags.push(`#${noticia.categoria.replace(/\s+/g, '')}`);
    }
    if (hashtags.length === 0) hashtags.push('#Nicaragua');

    // Formato profesional estilo La Prensa:
    // - Título destacado pero no gigante
    // - Resumen corto y directo
    // - Link elegante sin URLs visibles
    // - Botón claro de CTA
    const caption = `<b>${catEmoji} ${titulo}</b>\n\n${resumen}\n\n${hashtags.join(' ')}\n\n→ <a href="${url}">Leer más en nicaraguainformate.com</a>`;

    // Imagen válida (no base64)
    let imagen = noticia.imagenRedes || noticia.imagen;
    // Aceptar cualquier URL HTTP/HTTPS (GitHub raw, jsDelivr, Unsplash, etc.)
    const imagenValida = imagen && !imagen.startsWith('data:') && imagen.startsWith('http');

    let respuesta;
    let usedMethod = 'none';
    let errorDetail = '';

    if (imagenValida) {
      usedMethod = 'sendPhoto';
      respuesta = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          photo: imagen,
          caption: caption.slice(0, 1024),
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: "📰 Leer noticia completa →", url }]] }
        })
      });
    } else {
      usedMethod = 'sendMessage';
      // Sin imagen, solo texto
      respuesta = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: caption.slice(0, 4096),
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: "📰 Leer noticia completa →", url }]] }
        })
      });
    }

    let data = await respuesta.json();
    
    // Si falla por imagen inválida, reintentar solo con texto
    if (!data.ok && imagenValida && data.description?.includes('wrong type')) {
      if (debug) console.log('Image failed, retrying with text only');
      respuesta = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: caption.slice(0, 4096),
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: "📰 Leer noticia completa →", url }]] }
        })
      });
      data = await respuesta.json();
    }
    
    if (!data.ok) {
      console.error('Telegram API error:', data.description, '| chat_id:', TG_CHAT_ID, '| method:', usedMethod, '| imagenValida:', imagenValida, '| imagen:', (imagen || '').substring(0, 60));
      return res.status(400).json({ 
        error: 'Telegram API error', 
        details: data.description,
        chatId: TG_CHAT_ID,
        method: usedMethod,
        imagenValida: imagenValida,
        imagenType: imagen ? (imagen.startsWith('data:') ? 'base64' : (imagen.startsWith('http') ? 'url' : 'other')) : 'none',
        suggestion: data.description?.includes('not found') ? 'Verifica que el bot esté en el canal/grupo como administrador' : 'Revisa el token y chat ID',
        debug: {
          tokenReceived: !!TG_TOKEN,
          tokenLength: TG_TOKEN ? TG_TOKEN.length : 0,
          tokenPrefix: TG_TOKEN ? TG_TOKEN.substring(0, 20) + '...' : 'none',
          chatIdUsed: TG_CHAT_ID,
          chatIdType: typeof TG_CHAT_ID
        }
      });
    }
    return res.status(200).json({ success: true, messageId: data.result.message_id });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
