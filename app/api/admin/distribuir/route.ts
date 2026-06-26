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

/** Envía a Telegram (único canal activo para reducir consumo) */
async function enviarTelegram(noticia: Noticia): Promise<{ ok: boolean; error?: string }> {
  try {
    const TG_TOKEN = process.env.TG_TOKEN || '';
    const TG_CHAT_ID = process.env.TG_CHAT_ID || '';
    if (!TG_TOKEN || !TG_CHAT_ID) return { ok: false, error: 'Faltan credenciales Telegram' };

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;
    const catEmoji = noticia.categoria === 'Sucesos' ? '🚨'
      : noticia.categoria === 'Nacionales' ? '📌'
      : noticia.categoria === 'Deportes' ? '⚽'
      : noticia.categoria === 'Espectaculos' ? '🎬'
      : noticia.categoria === 'Tecnologia' ? '💻'
      : noticia.categoria === 'Internacionales' ? '🌍'
      : '📰';

    let contexto = '';
    const texto = (noticia.resumen || noticia.contenido || '').replace(/\n+/g, ' ').trim();
    const oraciones = texto.match(/[^.!?]+[.!?]+/g) || [];
    for (const o of oraciones) {
      const limpia = o.trim();
      if (contexto.length + limpia.length + 1 > 180 && contexto.length > 0) break;
      contexto += (contexto ? ' ' : '') + limpia;
    }
    if (!contexto) contexto = texto.substring(0, 120);

    const caption = `<b>${catEmoji} ${noticia.titulo}</b>\n\n${contexto}...\n\n<a href="${url}">Leer noticia completa</a>\n\n#NicaraguaInformate`;

    const imagen = noticia.imagenRedes || noticia.imagen;
    const imagenValida = imagen && !imagen.startsWith('data:') && imagen.startsWith('http');

    const endpoint = imagenValida
      ? `https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`
      : `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

    const body = imagenValida
      ? { chat_id: TG_CHAT_ID, photo: imagen, caption: caption.slice(0, 1024), parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: 'Leer noticia completa', url }]] } }
      : { chat_id: TG_CHAT_ID, text: caption.slice(0, 4096), parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: 'Leer noticia completa', url }]] } };

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

/** Notifica a IndexNow (Bing + Yandex) — sin costo de función */
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
    const [bing] = await Promise.allSettled([
      fetch('https://www.bing.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      }),
    ]);
    return { ok: true, error: `Bing:${bing.status}` };
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

    if (canales.includes('telegram')) {
      resultados.telegram = await enviarTelegram(noticia);
    }
    if (canales.includes('indexnow')) {
      resultados.indexnow = await enviarIndexNow(noticia);
    }

    // Guardar registro de distribución
    await db.collection('distribuciones').add({
      slug,
      titulo: noticia.titulo,
      canales,
      resultados,
      fecha: new Date().toISOString(),
    });

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
