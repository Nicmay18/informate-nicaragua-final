import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || '';

interface Noticia {
  id?: string;
  titulo: string;
  slug: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
  imagen?: string;
  imagenRedes?: string;
  fecha?: any;
  distribuida?: boolean;
  vistas?: number;
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
    return { token: process.env.TG_TOKEN || '', chatId: process.env.TG_CHAT_ID || '' };
  }
}

/** Envía a Telegram directamente (sin pasar por HTTP interno) */
async function enviarTelegramDirecto(noticia: Noticia, db: FirebaseFirestore.Firestore): Promise<{ ok: boolean; error?: string }> {
  try {
    const { token: TG_TOKEN, chatId: TG_CHAT_ID } = await getTelegramConfig(db);
    if (!TG_TOKEN || !TG_CHAT_ID) return { ok: false, error: 'Faltan credenciales Telegram' };

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

/** Notifica a IndexNow directamente */
async function enviarIndexNowDirecto(noticia: Noticia): Promise<{ ok: boolean; error?: string }> {
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
      fetch('https://www.bing.com/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(payload) }),
      fetch('https://yandex.com/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(payload) }),
    ]);
    return { ok: true, error: `Bing:${bing.status} Yandex:${yandex.status}` };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Genera variación de ángulo para republicar sin repetir */
function variarAngulo(titulo: string, categoria: string): string {
  const variaciones = [
    `🔥 Trending: ${titulo}`,
    `📰 Actualización: ${titulo}`,
    `🌙 Resumen: ${titulo}`,
    `👉 Esto pasó: ${titulo}`,
    `⚡ Último momento: ${titulo}`,
    `🗞️ ${categoria || 'Noticia'} del día: ${titulo}`,
  ];
  return variaciones[Math.floor(Math.random() * variaciones.length)];
}

/** Verifica si una noticia ya fue enviada a un canal en las últimas N horas */
async function yaDistribuido(
  db: any,
  slug: string,
  canal: string,
  horas: number = 24
): Promise<boolean> {
  const desde = new Date(Date.now() - horas * 60 * 60 * 1000);
  const snap = await db
    .collection('distribuciones')
    .where('slug', '==', slug)
    .limit(20)
    .get();

  const docs = snap.docs
    .filter((d: any) => d.data().resultados?.[canal]?.ok === true)
    .sort((a: any, b: any) => new Date(b.data().fecha || 0).getTime() - new Date(a.data().fecha || 0).getTime());

  if (docs.length === 0) return false;
  const fecha = docs[0].data().fecha;
  return fecha && new Date(fecha) > desde;
}

/** Distribuye a un canal directamente (sin fetch interno que falle por timeout en Vercel) */
async function dispatchCanal(
  canal: string,
  noticia: Noticia,
  variante?: { titulo?: string; resumen?: string },
  db?: FirebaseFirestore.Firestore
): Promise<{ ok: boolean; error?: string }> {
  const noticiaFinal = { ...noticia, titulo: variante?.titulo || noticia.titulo, resumen: variante?.resumen || noticia.resumen };

  if (canal === 'telegram') {
    if (!db) return { ok: false, error: 'Falta db para Telegram' };
    return enviarTelegramDirecto(noticiaFinal, db);
  }

  if (canal === 'indexnow') {
    return enviarIndexNowDirecto(noticiaFinal);
  }

  // Para canales que aún necesitan endpoint externo (Facebook, WhatsApp, Twitter, etc.)
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const endpoints: Record<string, string> = {
    twitter: '/api/admin/twitter',
    whatsapp: '/api/admin/whatsapp',
    facebook: '/api/admin/distribuir',
    linkedin: '/api/admin/linkedin',
    medium: '/api/admin/medium',
  };

  try {
    const res = await fetch(`${baseUrl}${endpoints[canal] || '/api/admin/distribuir'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticia: noticiaFinal }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: data.success || data.ok || false, error: data.error };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Rutina diaria del agente */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hora = new Date().getHours();
  const horaNicaragua = (hora + 6) % 24; // UTC-6

  // Define qué canales activar según horario Nicaragua
  const agenda: Record<number, string[]> = {
    6:  ['telegram', 'push', 'indexnow'],       // 06:00 - mañana
    7:  ['facebook'],                          // 07:00 - Facebook matutino
    8:  ['whatsapp'],                          // 08:00 - WhatsApp matutino
    12: ['facebook', 'twitter'],               // 12:00 - Almuerzo
    15: ['medium', 'linkedin'],               // 15:00 - Medium/LinkedIn
    18: ['facebook', 'twitter'],               // 18:00 - Noche
    20: ['whatsapp', 'telegram'],               // 20:00 - Resumen nocturno
  };

  const canalesActuales = agenda[horaNicaragua] || ['indexnow'];

  try {
    const db = getAdminDb();

    // Noticias no distribuidas recientes (sin orderBy en Firestore para evitar indice compuesto) v3
    const snap = await db
      .collection('noticias')
      .where('distribuida', '==', false)
      .limit(50)
      .get();

    const pendientes = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as unknown as Noticia))
      .sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime())
      .slice(0, 5);
    const resultados: any[] = [];

    for (const noticia of pendientes) {
      const resCanal: Record<string, any> = {};

      for (const canal of canalesActuales) {
        if (await yaDistribuido(db, noticia.slug, canal)) {
          resCanal[canal] = { ok: false, skipped: true, reason: 'Ya distribuido en 24h' };
          continue;
        }

        const variante =
          canal === 'telegram' || canal === 'twitter'
            ? { titulo: variarAngulo(noticia.titulo, noticia.categoria || '') }
            : undefined;

        resCanal[canal] = await dispatchCanal(canal, noticia, variante, db);
      }

      // Marcar como distribuida si al menos un canal funcionó
      const algunOk = Object.values(resCanal).some((r: any) => r.ok);
      if (algunOk && noticia.id) {
        await db.collection('noticias').doc(noticia.id).update({
          distribuida: true,
          fechaDistribucion: new Date().toISOString(),
        });
      }

      resultados.push({
        slug: noticia.slug,
        titulo: noticia.titulo,
        canales: resCanal,
        horaNicaragua,
      });
    }

    // Si no hay noticias nuevas, republicar la más leída con ángulo diferente
    if (pendientes.length === 0) {
      const trendingSnap = await db
        .collection('noticias')
        .orderBy('vistas', 'desc')
        .limit(1)
        .get();

      if (!trendingSnap.empty) {
        const top = trendingSnap.docs[0].data() as Noticia;
        const variante = { titulo: variarAngulo(top.titulo, top.categoria || '') };
        const canal = canalesActuales.includes('telegram') ? 'telegram' : canalesActuales[0];

        if (!(await yaDistribuido(db, top.slug, canal, 6))) {
          const r = await dispatchCanal(canal, top, variante, db);
          resultados.push({
            slug: top.slug,
            titulo: top.titulo,
            variante: variante.titulo,
            canal,
            ...r,
            modo: 'republicado_trending',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      horaNicaragua,
      canales: canalesActuales,
      procesadas: resultados.length,
      resultados,
    });
  } catch (err: any) {
    console.error('[admin/agente-crecimiento]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** POST: Ejecutar acción manual del agente */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, canales = ['telegram', 'indexnow'] } = body;

    if (!slug) {
      return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
    }

    const db = getAdminDb();
    const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
    if (snap.empty) return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });

    const noticia = { id: snap.docs[0].id, ...snap.docs[0].data() } as unknown as Noticia;
    const resCanal: Record<string, any> = {};

    for (const canal of canales) {
      resCanal[canal] = await dispatchCanal(canal, noticia);
    }

    return NextResponse.json({
      success: true,
      slug,
      canales: resCanal,
    });
  } catch (err: any) {
    console.error('[admin/agente-crecimiento] POST', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
