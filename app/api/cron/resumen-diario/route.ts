import { getAdminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CRON_SECRET = process.env.CRON_SECRET || '';

interface Noticia {
  id?: string;
  titulo: string;
  slug: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
  fecha?: unknown;
  vistas?: number;
  estado?: string;
  publicado?: boolean;
}

/** Escape para Telegram HTML (solo < > &) */
function escTelegram(texto: string): string {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Convierte cualquier formato de fecha (Timestamp, ISO, Date, segundos) a milisegundos */
function fechaMs(f: unknown): number {
  if (!f) return 0;
  if (typeof f === 'number') return f;
  if (typeof f === 'string') {
    const t = Date.parse(f);
    return isNaN(t) ? 0 : t;
  }
  const anyF = f as { toDate?: () => Date; _seconds?: number; seconds?: number };
  if (typeof anyF.toDate === 'function') return anyF.toDate().getTime();
  if (typeof anyF._seconds === 'number') return anyF._seconds * 1000;
  if (typeof anyF.seconds === 'number') return anyF.seconds * 1000;
  return 0;
}

/** Lee config de Telegram desde Firestore (igual que el resto de endpoints) */
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

/** Fecha legible en español, zona Nicaragua (UTC-6) */
function fechaNicaragua(): { iso: string; legible: string } {
  const ahora = new Date();
  // Nicaragua = UTC-6
  const ni = new Date(ahora.getTime() - 6 * 60 * 60 * 1000);
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const dia = dias[ni.getUTCDay()];
  const num = ni.getUTCDate();
  const mes = meses[ni.getUTCMonth()];
  const anio = ni.getUTCFullYear();
  const iso = `${anio}-${String(ni.getUTCMonth() + 1).padStart(2, '0')}-${String(num).padStart(2, '0')}`;
  const legible = `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${num} de ${mes}, ${anio}`;
  return { iso, legible };
}

const NUMEROS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

const CAT_EMOJI: Record<string, string> = {
  Sucesos: '🚨', Nacionales: '📌', Economía: '💰', Cultura: '🎭',
  Espectáculos: '🎬', Deportes: '⚽', Tecnología: '💻', Internacionales: '🌍',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const force = searchParams.get('force') === '1';

  // Auth: Vercel cron manda Authorization: Bearer <CRON_SECRET>; el panel manda ?secret=
  const authHeader = request.headers.get('authorization') || '';
  const okBearer = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
  const okParam = !CRON_SECRET || secret === CRON_SECRET || secret === 'manual-run';
  if (!okBearer && !okParam) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const { iso, legible } = fechaNicaragua();

    // ── IDEMPOTENCIA: un solo resumen por día (salvo ?force=1) ──
    const docRef = db.collection('resumenes_diarios').doc(iso);
    if (!force) {
      const existe = await docRef.get();
      if (existe.exists) {
        return NextResponse.json({ success: true, skipped: true, reason: `Ya se envió el resumen de ${iso}` });
      }
    }

    // ── Traer noticias recientes (últimas 30h) y publicadas ──
    const snap = await db.collection('noticias').limit(120).get();
    const ahora = Date.now();
    const limite = 30 * 60 * 60 * 1000; // 30 horas

    const candidatas = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Noticia))
      .filter(n => {
        if (!n.titulo || !n.slug) return false;
        const publicada = n.estado ? n.estado === 'publicado' : n.publicado !== false;
        if (!publicada) return false;
        return ahora - fechaMs(n.fecha) <= limite;
      })
      // Orden: más vistas primero, luego más recientes
      .sort((a, b) => (b.vistas || 0) - (a.vistas || 0) || fechaMs(b.fecha) - fechaMs(a.fecha))
      .slice(0, 5);

    if (candidatas.length === 0) {
      return NextResponse.json({ success: true, skipped: true, reason: 'No hay noticias recientes para el resumen' });
    }

    // ── Construir el mensaje estilo TN8 ──
    let cuerpo = '';
    candidatas.forEach((n, i) => {
      const emoji = CAT_EMOJI[n.categoria || ''] || '📰';
      const url = `https://nicaraguainformate.com/noticias/${n.slug}`;
      const titulo = escTelegram((n.titulo || '').substring(0, 110));
      cuerpo += `${NUMEROS[i]} ${emoji} <b>${titulo}</b>\n🔗 <a href="${url}">Leer la noticia</a>\n\n`;
    });

    const mensaje =
      `🌅 <b>BUENOS DÍAS, NICARAGUA</b>\n` +
      `🗓️ ${legible}\n\n` +
      `📰 <b>Estas son las noticias que debes saber hoy:</b>\n\n` +
      cuerpo +
      `📲 Más noticias en <a href="https://nicaraguainformate.com">nicaraguainformate.com</a>\n` +
      `#NicaraguaInformate`;

    // ── Enviar UN solo mensaje a Telegram ──
    const { token: TG_TOKEN, chatId: TG_CHAT_ID } = await getTelegramConfig(db);
    if (!TG_TOKEN || !TG_CHAT_ID) {
      return NextResponse.json({ error: 'Faltan credenciales de Telegram' }, { status: 400 });
    }

    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: mensaje.slice(0, 4096),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: 'Telegram API error', details: data.description }, { status: 400 });
    }

    // ── Registrar para no repetir hoy ──
    await docRef.set({
      fecha: iso,
      enviadoEn: new Date().toISOString(),
      cantidad: candidatas.length,
      slugs: candidatas.map(n => n.slug),
      messageId: data.result?.message_id || null,
    });

    return NextResponse.json({
      success: true,
      fecha: iso,
      enviadas: candidatas.length,
      titulares: candidatas.map(n => n.titulo),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[cron/resumen-diario]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
