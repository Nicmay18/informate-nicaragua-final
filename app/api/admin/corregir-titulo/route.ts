import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, titulo, slug } = body;
    if (!id || typeof id !== 'string' || !titulo || typeof titulo !== 'string') {
      return NextResponse.json({ error: 'ID y título requeridos' }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = db.collection('noticias').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    const updateData: Record<string, string> = { titulo: titulo.trim() };
    if (slug && typeof slug === 'string') updateData.slug = slug.trim();

    await docRef.update(updateData);
    return NextResponse.json({ ok: true, id, titulo: titulo.trim(), slug: slug || undefined });
  } catch (error) {
    console.error('[corregir-titulo] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
