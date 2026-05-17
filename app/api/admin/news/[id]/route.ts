import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    if (body.titulo && !body.slug) {
      updateData.slug = body.titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now();
    }
    updateData.fecha = Timestamp.now();

    await ref.update(updateData);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/news PUT]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
