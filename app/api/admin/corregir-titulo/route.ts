import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

function isAuthorized(request: Request): boolean {
  const token = request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '';
  return ADMIN_API_KEY.length > 0 && token === ADMIN_API_KEY;
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length <= 120;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, titulo, slug } = body;

    if (!id || typeof id !== 'string' || !titulo || typeof titulo !== 'string') {
      return NextResponse.json({ error: 'ID y título requeridos' }, { status: 400 });
    }

    const tituloLimpio = titulo.trim();
    if (tituloLimpio.length < 10 || tituloLimpio.length > 120) {
      return NextResponse.json({ error: 'Título fuera de rango (10-120 caracteres)' }, { status: 400 });
    }

    let slugLimpio: string | undefined;
    if (slug) {
      if (typeof slug !== 'string' || !isValidSlug(slug.trim())) {
        return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
      }
      slugLimpio = slug.trim();
    }

    const db = getAdminDb();
    const docRef = db.collection('noticias').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    const updateData: Record<string, string> = { titulo: tituloLimpio };
    if (slugLimpio) updateData.slug = slugLimpio;

    await docRef.update(updateData);
    return NextResponse.json({ ok: true, id, titulo: tituloLimpio, slug: slugLimpio });
  } catch (error) {
    console.error('[corregir-titulo] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
