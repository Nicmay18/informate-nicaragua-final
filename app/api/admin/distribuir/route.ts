import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

interface Noticia {
  titulo: string;
  slug: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
  imagen?: string;
  imagenRedes?: string;
  fecha?: any;
}

/** Envía a Telegram */
async function enviarTelegram(noticia: Noticia): Promise<{ ok: boolean; error?: string }> {
  try {
    const TG_TOKEN = process.env.TG_TOKEN || '';
    const TG_CHAT_ID = process.env.TG_CHAT_ID || '';
    if (!TG_TOKEN || !TG_CHAT_ID) return { ok: false, error: 'Faltan credenciales Telegram' };

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;
    const emoji: Record<string, string> = {
      Sucesos: '🚨', Nacionales: '📌', Economía: '💰', Cultura: '🎭',
      Espectáculos: '🎬', Deportes: '⚽', Tecnología: '💻', Internacionales: '🌍'
    };
    const catEmoji = emoji[noticia.categoria || ''] || '📰';

    // Extraer 1-2 oraciones
    let contexto = '';
    const texto = (noticia.resumen || noticia.contenido || '').replace(/\n+/g, ' ').trim();
    const oraciones = texto.match(/[^.!?]+[.!?]+/g) || [];
    for (const o of oraciones) {
      const limpia = o.trim();
      if (contexto.length + limpia.length + 1 > 180 && contexto.length > 0) break;
      contexto += (contexto ? ' ' : '') + limpia;
    }
    if (!contexto) contexto = texto.substring(0, 120);

    const caption = `<b>${catEmoji} ${noticia.titulo}</b>\n\n${contexto}...\n\n🔗 <a href="${url}">Leer noticia completa</a>\n\n#NicaraguaInformate`;

    const imagen = noticia.imagenRedes || noticia.imagen;
    const imagenValida = imagen && !imagen.startsWith('data:') && imagen.startsWith('http');

    const endpoint = imagenValida
      ? `https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`
      : `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

    const body = imagenValida
      ? { chat_id: TG_CHAT_ID, photo: imagen, caption: caption.slice(0, 1024), parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] } }
      : { chat_id: TG_CHAT_ID, text: caption.slice(0, 4096), parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] } };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { ok: data.ok, error: data.ok ? undefined : data.description };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Envía a Facebook (si hay token) */
async function enviarFacebook(noticia: Noticia): Promise<{ ok: boolean; error?: string }> {
  try {
    const FB_TOKEN = process.env.FB_PAGE_TOKEN || '';
    const FB_PAGE_ID = process.env.FB_PAGE_ID || '';
    if (!FB_TOKEN || !FB_PAGE_ID) return { ok: false, error: 'Faltan credenciales Facebook' };

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;
    const emoji: Record<string, string> = {
      Sucesos: '🚨', Nacionales: '📌', Economía: '💰', Cultura: '🎭',
      Espectáculos: '🎬', Deportes: '⚽', Tecnología: '💻', Internacionales: '🌍'
    };
    const catEmoji = emoji[noticia.categoria || ''] || '📰';

    let contexto = '';
    const texto = (noticia.resumen || noticia.contenido || '').replace(/\n+/g, ' ').trim();
    const oraciones = texto.match(/[^.!?]+[.!?]+/g) || [];
    for (const o of oraciones) {
      const limpia = o.trim();
      if (contexto.length + limpia.length + 1 > 200 && contexto.length > 0) break;
      contexto += (contexto ? ' ' : '') + limpia;
    }
    if (!contexto) contexto = texto.substring(0, 140);

    const mensaje = `${catEmoji} ${noticia.titulo}\n\n${contexto}...\n\n👉 ${url}\n\n#NicaraguaInformate`;

    const res = await fetch(`https://graph.facebook.com/v18.0/${FB_PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: mensaje,
        link: url,
        access_token: FB_TOKEN,
      }),
    });
    const data = await res.json();
    return { ok: !data.error, error: data.error?.message };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Notifica a IndexNow (Bing + Yandex) */
async function enviarIndexNow(noticia: Noticia): Promise<{ ok: boolean; error?: string }> {
  try {
    const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'ni-indexnow-key-2026-x7k9m3p2q8r5t1u4';
    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;
    const payload = {
      host: 'nicaraguainformate.com',
      key: INDEXNOW_KEY,
      keyLocation: `https://nicaraguainformate.com/${INDEXNOW_KEY}.txt`,
      urlList: [url],
    };
    const [bing, yandex] = await Promise.allSettled([
      fetch('https://www.bing.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      }),
      fetch('https://yandex.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      }),
    ]);
    return { ok: true, error: `Bing:${bing.status} Yandex:${yandex.status}` };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Notificación Push vía OneSignal */
async function enviarPush(noticia: Noticia): Promise<{ ok: boolean; error?: string }> {
  try {
    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '608354d3-fd2a-4c97-b055-5c14b57bbe9b';
    const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY || '';
    if (!ONESIGNAL_REST_KEY) return { ok: false, error: 'Falta ONESIGNAL_REST_API_KEY' };

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['Subscribed Users'],
        headings: { en: noticia.titulo, es: noticia.titulo },
        contents: { en: noticia.resumen || 'Nueva noticia de Nicaragua Informate', es: noticia.resumen || 'Nueva noticia de Nicaragua Informate' },
        url,
        web_buttons: [{ id: 'read-more', text: 'Leer más', icon: '', url }],
        chrome_web_image: noticia.imagen || undefined,
      }),
    });
    const data = await res.json();
    return { ok: data.id ? true : false, error: data.errors?.[0] };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, canales = ['telegram', 'indexnow'] } = body;

    if (!slug) {
      return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
    }

    const db = getAdminDb();
    const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
    if (snap.empty) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    const noticia = snap.docs[0].data() as Noticia;
    const resultados: Record<string, { ok: boolean; error?: string }> = {};

    const promises: Promise<void>[] = [];

    if (canales.includes('telegram')) {
      promises.push(
        enviarTelegram(noticia).then(r => { resultados.telegram = r; })
      );
    }
    if (canales.includes('facebook')) {
      promises.push(
        enviarFacebook(noticia).then(r => { resultados.facebook = r; })
      );
    }
    if (canales.includes('indexnow')) {
      promises.push(
        enviarIndexNow(noticia).then(r => { resultados.indexnow = r; })
      );
    }
    if (canales.includes('push')) {
      promises.push(
        enviarPush(noticia).then(r => { resultados.push = r; })
      );
    }

    await Promise.all(promises);

    // Guardar registro de distribución
    await db.collection('distribuciones').add({
      slug,
      titulo: noticia.titulo,
      canales,
      resultados,
      fecha: new Date().toISOString(),
    });

    // Marcar noticia como distribuida
    await snap.docs[0].ref.update({ distribuida: true, fechaDistribucion: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      slug,
      titulo: noticia.titulo,
      resultados,
    });
  } catch (err) {
    console.error('[admin/distribuir]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/** GET: devuelve últimas distribuciones */
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('distribuciones').orderBy('fecha', 'desc').limit(50).get();
    const registros = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, registros });
  } catch (err) {
    console.error('[admin/distribuir] GET', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
