/**
 * Senders de distribución compartidos — ÚNICA implementación por canal.
 * Extraídos verbatim de app/api/admin/distribuir/route.ts para que el
 * consumidor de la cola de reintentos los reutilice sin duplicación.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

export interface Noticia {
  titulo: string;
  slug: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
  imagen?: string;
  imagenRedes?: string;
  fecha?: unknown;
}

export type ChannelResult = { ok: boolean; skipped?: boolean; error?: string };

/** Lee config de Telegram desde Firestore (igual que /api/admin/config) */
export async function getTelegramConfig(db: Firestore) {
  try {
    const snap = await db.collection('config').doc('admin').get();
    const data = snap.data() || {};
    return {
      token: process.env.TG_TOKEN || data.telegram?.token || '',
      chatId: process.env.TG_CHAT_ID || process.env.TG_CHAT || data.telegram?.chatId || '',
    };
  } catch {
    return {
      token: process.env.TG_TOKEN || '',
      chatId: process.env.TG_CHAT_ID || process.env.TG_CHAT || '',
    };
  }
}

/** Verifica si una noticia ya fue enviada a un canal en las ultimas N horas */
export async function yaDistribuido(
  db: Firestore,
  slug: string,
  canal: string,
  horas: number = 24,
): Promise<boolean> {
  const desde = new Date(Date.now() - horas * 60 * 60 * 1000);
  try {
    const snap = await db.collection('distribuciones').where('slug', '==', slug).limit(20).get();
    const docs = snap.docs
      .filter((d) => (d.data().resultados || {})[canal]?.ok === true)
      .sort((a, b) => new Date((b.data().fecha || 0)).getTime() - new Date((a.data().fecha || 0)).getTime());
    if (docs.length === 0) return false;
    const fecha = docs[0].data().fecha;
    return !!fecha && new Date(fecha) > desde;
  } catch {
    return false;
  }
}

/** Envía a Telegram */
export async function enviarTelegram(noticia: Noticia, db: Firestore): Promise<ChannelResult> {
  try {
    const { token: TG_TOKEN, chatId: TG_CHAT_ID } = await getTelegramConfig(db);
    if (!TG_TOKEN || !TG_CHAT_ID) return { ok: false, error: 'Faltan credenciales Telegram' };

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}?utm_source=telegram`;
    const emoji: Record<string, string> = {
      Sucesos: '🚨', Nacionales: '📌', Economía: '💰', Cultura: '🎭',
      Espectáculos: '🎬', Deportes: '⚽', Tecnología: '💻', Internacionales: '🌍',
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

    // Intentar con foto primero; si falla, fallback a mensaje de texto
    if (imagenValida) {
      const photoRes = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          photo: imagen,
          caption: caption.slice(0, 1024),
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] },
        }),
      });
      const photoData = await photoRes.json();
      if (photoData.ok) return { ok: true };

      // Si la foto falla por cualquier motivo, intentar mensaje de texto —
      // es preferible perder la imagen que perder la distribución completa.
      logger.info('[Telegram] sendPhoto falló, fallback a sendMessage:', photoData.description);
    }

    const msgRes = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: caption.slice(0, 4096),
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] },
      }),
    });
    const msgData = await msgRes.json();
    return { ok: msgData.ok, error: msgData.ok ? undefined : msgData.description };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Envía a Facebook (si hay token) */
export async function enviarFacebook(noticia: Noticia): Promise<ChannelResult> {
  try {
    const FB_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';
    const FB_PAGE_ID = process.env.FB_PAGE_ID || '';
    if (!FB_TOKEN || !FB_PAGE_ID) return { ok: false, error: 'Faltan credenciales Facebook' };

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}?utm_source=facebook`;
    const emoji: Record<string, string> = {
      Sucesos: '🚨', Nacionales: '📌', Economía: '💰', Cultura: '🎭',
      Espectáculos: '🎬', Deportes: '⚽', Tecnología: '💻', Internacionales: '🌍',
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
export async function enviarIndexNow(noticia: Noticia): Promise<ChannelResult> {
  try {
    const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
    if (!INDEXNOW_KEY) { return { ok: false, error: 'INDEXNOW_KEY no configurada' }; }
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
export async function enviarPush(noticia: Noticia): Promise<ChannelResult> {
  try {
    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
    const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY || '';
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
      return { ok: false, skipped: true, error: 'Push: ONESIGNAL_APP_ID o ONESIGNAL_REST_API_KEY no configuradas' };
    }

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}?utm_source=push`;

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
        chrome_web_image: (noticia.imagen && !noticia.imagen.startsWith('data:') && noticia.imagen.startsWith('http')) ? noticia.imagen : undefined,
      }),
    });
    const data = await res.json();
    return { ok: data.id ? true : false, error: data.errors?.[0] };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Notificación Twitter/X vía API v2 (requiere OAuth 2.0) */
export async function enviarTwitter(noticia: Noticia): Promise<ChannelResult> {
  try {
    const token = process.env.TWITTER_ACCESS_TOKEN || '';
    if (!token) {
      return { ok: false, skipped: true, error: 'Twitter requiere TWITTER_ACCESS_TOKEN (OAuth 2.0). Configurar o desactivar este canal.' };
    }

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}?utm_source=twitter`;
    const emoji: Record<string, string> = {
      Sucesos: '🚨', Nacionales: '📌', Economía: '💰', Cultura: '🎭',
      Espectáculos: '🎬', Deportes: '⚽', Tecnología: '💻', Internacionales: '🌍',
    };
    const catEmoji = emoji[noticia.categoria || ''] || '📰';
    const hashtags = '#Nicaragua #Noticias';
    const contexto = (noticia.resumen || '').substring(0, 100);
    const text = `${catEmoji} ${noticia.titulo}\n\n${contexto}...\n\n${url}\n\n${hashtags}`;

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: text.slice(0, 280) }),
    });
    const data = await res.json();
    if (data.data?.id) return { ok: true };
    return { ok: false, error: data.detail || JSON.stringify(data.errors) };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
