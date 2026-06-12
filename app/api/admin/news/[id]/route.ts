import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { generateSlug } from '@/lib/slug';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-key');
  const expected = process.env.ADMIN_API_KEY;
  return !!expected && key === expected;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getAdminDb();
    const ref = db.collection('noticias').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Noticia no encontrada' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowed = ['titulo', 'resumen', 'contenido', 'categoria', 'imagen', 'autor', 'destacada', 'publicado'];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === 'destacada' || key === 'publicado') {
          updateData[key] = !!body[key];
        } else {
          updateData[key] = body[key];
        }
      }
    }
    // Solo regenerar slug si el título cambió explícitamente y no hay slug fijo
    if (body.titulo && body.regenerateSlug === true && !body.slug) {
      updateData.slug = generateSlug(body.titulo) + '-' + Date.now();
    }
    // Si la noticia no tiene slug (migración), generarlo ahora
    if (!snap.data()?.slug && body.titulo) {
      updateData.slug = generateSlug(body.titulo) + '-' + Date.now();
    }
    updateData.fechaActualizacion = Timestamp.now();

    await ref.update(updateData);

    revalidateTag('latest-news');
    revalidateTag('trending-news');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/news PUT]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const db = getAdminDb();
    await db.collection('noticias').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/news DELETE]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
