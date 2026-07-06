import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export const maxDuration = 30;
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { ensureUniqueSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-token') || request.headers.get('x-admin-key');
  const expected = process.env.ADMIN_API_KEY;
  return !!expected && key === expected;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();
    const news = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        slug: data.slug || d.id,
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        contenido: data.contenido || '',
        categoria: data.categoria || 'General',
        imagen: data.imagen || '',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || new Date().toISOString(),
        autor: data.autor || 'Nicaragua Informate',
        destacada: !!data.destacada,
        vistas: data.vistas || 0,
        publicado: data.publicado !== false,
        puntosClave: data.puntosClave || [],
      };
    });
    return NextResponse.json({ success: true, news }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (err) {
    console.error('[admin/news GET]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

async function notifyTelegram(titulo: string, resumen: string, slug: string, categoria: string, imagen: string, customToken?: string, customChat?: string) {
  const token = customToken || process.env.TG_TOKEN;
  const chatId = customChat || process.env.TG_CHAT;
  if (!token || !chatId) return;
  const url = `https://nicaraguainformate.com/noticias/${slug}/`;
  const catEmojis: Record<string, string> = {
    Sucesos: '🚨', Nacionales: '🇳🇮', Deportes: '⚽', Internacionales: '🌍',
    Espectáculos: '🎬', Tecnología: '💻', Economía: '📈', Cultura: '🎭',
  };
  const emoji = catEmojis[categoria] || '📰';
  const text = `${emoji} *${titulo}*\n\n${resumen}\n\n🔗 [Leer noticia completa](${url})`;
  try {
    if (imagen) {
      await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo: imagen, caption: text, parse_mode: 'Markdown' }),
      });
    } else {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: false }),
      });
    }
  } catch (e) {
    console.error('[Telegram notify]', e);
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { titulo, resumen, contenido, categoria, imagen, autor, destacada, publicado, notificarTelegram } = body;

    if (!titulo || !resumen || !contenido || !categoria) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const db = getAdminDb();
    const slug = await ensureUniqueSlug(titulo, async (s) => {
      const existing = await db.collection('noticias').where('slug', '==', s).limit(1).get();
      return !existing.empty;
    });
    const docRef = await db.collection('noticias').add({
      titulo,
      resumen,
      contenido,
      categoria,
      imagen: imagen || '',
      slug,
      autor: autor || 'Nicaragua Informate',
      destacada: !!destacada,
      vistas: 0,
      fecha: Timestamp.now(),
      publicado: publicado !== false,
    });

    if (notificarTelegram !== false && publicado !== false) {
      await notifyTelegram(titulo, resumen, slug, categoria, imagen || '', body.telegramToken, body.telegramChat);
    }

    revalidateTag('latest-news');
    revalidateTag('trending-news');
    revalidateTag('news-sitemap');
    revalidateTag('sitemap-news');

    // Invalidar cache en memoria de Firestore (CRÍTICO: evita esperar 5 min)
    try {
      const { invalidateFirestoreCache } = await import('@/lib/data');
      invalidateFirestoreCache();
    } catch (e) { /* noop */ }

    // Revalidar paginas afectadas
    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath(`/noticias/${slug}`);
    revalidatePath('/news-sitemap.xml');
    revalidatePath('/sitemap.xml');

    return NextResponse.json({ success: true, id: docRef.id, slug });
  } catch (err) {
    console.error('[admin/news POST]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
