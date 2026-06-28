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

/** Lee config de Telegram desde Firestore (igual que /api/admin/config) */
async function getTelegramConfig(db: FirebaseFirestore.Firestore) {
  try {
    const snap = await db.collection('config').doc('admin').get();
    const data = snap.data() || {};
    return {
      token: data.telegram?.token || process.env.TG_TOKEN || '',
      chatId: data.telegram?.chatId || process.env.TG_CHAT_ID || '',
    };
  } catch {
    return {
      token: process.env.TG_TOKEN || '',
      chatId: process.env.TG_CHAT_ID || '',
    };
  }
}

/** Verifica si una noticia ya fue enviada a un canal en las ultimas N horas */
async function yaDistribuido(
  db: FirebaseFirestore.Firestore,
  slug: string,
  canal: string,
  horas: number = 24
): Promise<boolean> {
  const desde = new Date(Date.now() - horas * 60 * 60 * 1000);
  try {
    const snap = await db.collection('distribuciones').where('slug', '==', slug).limit(20).get();
    const docs = snap.docs
      .filter((d) => (d.data().resultados || {})[canal]?.ok === true)
      .sort((a, b) => new Date((b.data().fecha || 0)).getTime() - new Date((a.data().fecha || 0)).getTime());
    if (docs.length === 0) return false;
    const fecha = docs[0].data().fecha;
    return fecha && new Date(fecha) > desde;
  } catch {
    return false;
  }
}

/** Envía a Telegram */
async function enviarTelegram(noticia: Noticia, db: FirebaseFirestore.Firestore): Promise<{ ok: boolean; error?: string }> {
  try {
    const { token: TG_TOKEN, chatId: TG_CHAT_ID } = await getTelegramConfig(db);
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
    const resultados: Record<string, { ok: boolean; skipped?: boolean; error?: string }> = {};

    const promises: Promise<void>[] = [];

    if (canales.includes('telegram')) {
      if (await yaDistribuido(db, slug, 'telegram')) {
        resultados.telegram = { ok: true, skipped: true };
      } else {
        promises.push(
          enviarTelegram(noticia, db).then(r => { resultados.telegram = r; })
        );
      }
    }
    if (canales.includes('facebook')) {
      if (await yaDistribuido(db, slug, 'facebook')) {
        resultados.facebook = { ok: true, skipped: true };
      } else {
        promises.push(
          enviarFacebook(noticia).then(r => { resultados.facebook = r; })
        );
      }
    }
    if (canales.includes('indexnow')) {
      if (await yaDistribuido(db, slug, 'indexnow')) {
        resultados.indexnow = { ok: true, skipped: true };
      } else {
        promises.push(
          enviarIndexNow(noticia).then(r => { resultados.indexnow = r; })
        );
      }
    }
    if (canales.includes('push')) {
      if (await yaDistribuido(db, slug, 'push')) {
        resultados.push = { ok: true, skipped: true };
      } else {
        promises.push(
          enviarPush(noticia).then(r => { resultados.push = r; })
        );
      }
    }

    // Delegar canales adicionales a sus endpoints
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const extras = [
      { name: 'twitter', path: '/api/admin/twitter' },
      { name: 'linkedin', path: '/api/admin/linkedin' },
      { name: 'medium', path: '/api/admin/medium' },
      { name: 'whatsapp', path: '/api/admin/whatsapp' },
    ];

    for (const extra of extras) {
      if (canales.includes(extra.name)) {
        promises.push(
          fetch(`${baseUrl}${extra.path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ noticia }),
          })
            .then(r => r.json().catch(() => ({ success: false })))
            .then(data => { resultados[extra.name] = { ok: data.success || false, error: data.error }; })
            .catch(e => { resultados[extra.name] = { ok: false, error: e.message }; })
        );
      }
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
