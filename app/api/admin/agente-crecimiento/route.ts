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
  fecha?: any;
  distribuida?: boolean;
  vistas?: number;
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
    .where(`resultados.${canal}.ok`, '==', true)
    .orderBy('fecha', 'desc')
    .limit(1)
    .get();

  if (snap.empty) return false;
  const fecha = snap.docs[0].data().fecha;
  return fecha && new Date(fecha) > desde;
}

/** Distribuye a un canal interno */
async function dispatchCanal(
  canal: string,
  noticia: Noticia,
  variante?: { titulo?: string; resumen?: string }
): Promise<{ ok: boolean; error?: string }> {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const payload: any = { noticia: { ...noticia, titulo: variante?.titulo || noticia.titulo, resumen: variante?.resumen || noticia.resumen } };

  const endpoints: Record<string, string> = {
    telegram: '/api/admin/distribuir',
    twitter: '/api/admin/twitter',
    whatsapp: '/api/admin/whatsapp',
    facebook: '/api/admin/distribuir',
    linkedin: '/api/admin/linkedin',
    medium: '/api/admin/medium',
  };

  // Para distribuir solo Telegram/IndexNow/Push desde el endpoint distribuir
  if (canal === 'telegram') {
    // Llamar directo a distribuir con solo ese canal
    try {
      const res = await fetch(`${baseUrl}${endpoints[canal]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: noticia.slug, canales: ['telegram', 'indexnow'] }),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: data.success || false, error: data.error };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  try {
    const res = await fetch(`${baseUrl}${endpoints[canal] || '/api/admin/distribuir'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

    // Noticias no distribuidas recientes (sin orderBy en Firestore para evitar índice compuesto)
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

        resCanal[canal] = await dispatchCanal(canal, noticia, variante);
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
          const r = await dispatchCanal(canal, top, variante);
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
