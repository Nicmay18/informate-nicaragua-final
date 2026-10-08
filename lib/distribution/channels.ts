/**
 * Senders de distribución compartidos — ÚNICA implementación por canal.
 * Extraídos verbatim de app/api/admin/distribuir/route.ts para que el
 * consumidor de la cola de reintentos los reutilice sin duplicación.
 */
import type { Firestore } from 'firebase-admin/firestore';

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

/**
 * Telegram — delega al sender unico endurecido (lib/distribution/telegram):
 * escape HTML correcto para parse_mode:HTML, resumen con fallback
 * (resumen -> metaDescription -> 1er parrafo), timeout 8s, 1 retry en
 * errores retryables e idempotencia por claim atomico. La firma publica
 * (Noticia -> ChannelResult) se conserva para todos los callers.
 */
export async function enviarTelegram(noticia: Noticia, db: Firestore): Promise<ChannelResult> {
  const { sendTelegramArticle } = await import('@/lib/distribution/telegram');
  const r = await sendTelegramArticle(
    {
      slug: noticia.slug,
      titulo: noticia.titulo,
      resumen: noticia.resumen,
      metaDescription: (noticia as { metaDescription?: string }).metaDescription,
      contenido: noticia.contenido,
      categoria: noticia.categoria,
      imagen: noticia.imagen,
      imagenRedes: noticia.imagenRedes,
    },
    { db },
  );
  return { ok: r.ok, skipped: r.skipped, error: r.error };
}
/**
 * Envía a Facebook (si hay token). Copy generado por la capa editorial
 * común (social-copy): ángulo + contexto real + pregunta natural + CTA.
 * Tras publicar, deja el enlace como primer comentario (best-effort).
 */
export async function enviarFacebook(noticia: Noticia): Promise<ChannelResult> {
  try {
    const FB_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';
    const FB_PAGE_ID = process.env.FB_PAGE_ID || '';
    if (!FB_TOKEN || !FB_PAGE_ID) return { ok: false, error: 'Faltan credenciales Facebook' };

    const { buildFacebookCopy } = await import('@/lib/distribution/social-copy');
    const copy = buildFacebookCopy(noticia);

    const res = await fetch(`https://graph.facebook.com/v18.0/${FB_PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: copy.text,
        link: copy.url,
        access_token: FB_TOKEN,
      }),
    });
    const data = await res.json();
    if (data.error) return { ok: false, error: data.error?.message };

    // Primer comentario con el enlace (best-effort: el post ya tiene link card)
    if (data.id) {
      try {
        await fetch(`https://graph.facebook.com/v18.0/${data.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: copy.firstComment, access_token: FB_TOKEN }),
        });
      } catch { /* best effort */ }
    }
    return { ok: true };
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

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}?utm_source=push&utm_medium=social`;

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

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}?utm_source=twitter&utm_medium=social`;
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
