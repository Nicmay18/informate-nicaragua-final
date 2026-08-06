import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { revalidateTag, revalidatePath } from 'next/cache';
import { notifyGoogleIndexingDeduped } from '@/lib/google-indexing';

export const maxDuration = 30;
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp, Firestore } from 'firebase-admin/firestore';
import { ensureUniqueSlug } from '@/lib/slug';
import { normalizarTitulo } from '@/lib/meni/titulo';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
      if (snap.empty) {
        return NextResponse.json({ success: false, error: 'Noticia no encontrada' }, { status: 404 });
      }
      const d = snap.docs[0];
      const data = d.data();
      const news = {
        id: d.id,
        slug: data.slug || d.id,
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        contenido: data.contenido || '',
        categoria: data.categoria || 'General',
        departamento: data.departamento || '',
        autor: data.autor || 'Nicaragua Informate',
        imagen: data.imagen || '',
        imagenDestacada: data.imagenDestacada || '',
        keywords: data.keywords || '',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || new Date().toISOString(),
        fechaActualizacion: data.fechaActualizacion?.toDate ? data.fechaActualizacion.toDate().toISOString() : data.fechaActualizacion || null,
        publicado: data.publicado !== false,
      };
      return NextResponse.json({ success: true, news }, {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
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
        palabras: data.palabras || 0,
        nivel: data.nivel || null,
        nivelScore: data.nivelScore || 0,
        departamento: data.departamento || '',
        keywords: data.keywords || '',
      };
    });
    return NextResponse.json({ success: true, news }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error('[admin/news GET]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

async function getTelegramConfig(db: Firestore) {
  try {
    const snap = await db.collection('config').doc('admin').get();
    const data = snap.data() || {};
    return {
      token: data.telegram?.token || process.env.TG_TOKEN || '',
      chatId: data.telegram?.chatId || process.env.TG_CHAT_ID || process.env.TG_CHAT || '',
    };
  } catch {
    return { token: process.env.TG_TOKEN || '', chatId: process.env.TG_CHAT_ID || process.env.TG_CHAT || '' };
  }
}

async function getRelatedLinks(db: any, categoriaLinks: string, excludeId: string) {
  try {
    const snap = await db.collection('noticias').where('categoria', '==', categoriaLinks).orderBy('fecha', 'desc').limit(4).get();
    return snap.docs.filter((d: any) => d.id !== excludeId).slice(0, 3).map((d: any) => {
      const data = d.data();
      return { url: `/noticias/${data.slug || d.id}`, anchor: (data.titulo || 'Leer mas').substring(0, 70), type: 'relacionada' };
    });
  } catch (e) {
    console.warn('[admin/news] getRelatedLinks error:', e);
    return [];
  }
}

async function notifyTelegram(titulo: string, resumen: string, slug: string, categoria: string, imagen: string, customToken?: string, customChat?: string) {
  const token = customToken || process.env.TG_TOKEN;
  const chatId = customChat || process.env.TG_CHAT;
  if (!token || !chatId) return;
  const url = `https://nicaraguainformate.com/noticias/${slug}/?utm_source=telegram`;
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

    const tituloLimpio = normalizarTitulo(titulo);

    const db = getAdminDb();
    const slug = await ensureUniqueSlug(tituloLimpio, async (s) => {
      const existing = await db.collection('noticias').where('slug', '==', s).limit(1).get();
      return !existing.empty;
    });
    const docRef = db.collection('noticias').doc();
    const relatedLinks = await getRelatedLinks(db, categoria, docRef.id);
    await docRef.set({
      id: docRef.id,
      titulo: tituloLimpio,
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
      estado: publicado !== false ? 'publicado' : 'borrador',
      nivel: 'FORENSE',
      nivelScore: 0,
      nivelFecha: new Date().toISOString(),
      related_links: relatedLinks,
    });

    if (notificarTelegram !== false && publicado !== false) {
      const tgConfig = await getTelegramConfig(db);
      await notifyTelegram(titulo, resumen, slug, categoria, imagen || '', body.telegramToken || tgConfig.token, body.telegramChat || tgConfig.chatId);
    }

    revalidateTag('noticias');
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

    // Notificar a Google Indexing API cuando la noticia se publica
    let googleIndexing: { ok: boolean; status: 'sent' | 'duplicate' | 'error' | 'skipped' } = { ok: false, status: 'skipped' };
    if (publicado !== false) {
      const articleUrl = `https://nicaraguainformate.com/noticias/${slug}`;
      googleIndexing = await notifyGoogleIndexingDeduped(articleUrl);
    }

    return NextResponse.json({ success: true, id: docRef.id, slug, googleIndexing: googleIndexing.status });
  } catch (err) {
    console.error('[admin/news POST]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
