import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { categoryToSlug } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
    }

    const snap = await adminDb
      .collection('noticias')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'noticia no encontrada' }, { status: 404 });
    }

    const docRef = snap.docs[0].ref;
    const data = snap.docs[0].data();
    const currentVistas = data.vistas || 0;

    await docRef.update({ vistas: FieldValue.increment(1) });

    try {
      revalidateTag('news');
      revalidatePath('/');
      revalidatePath('/noticias');
      revalidatePath(`/noticias/${slug}`);
      const categoriaSlug = data.categoria ? categoryToSlug(data.categoria) : null;
      if (categoriaSlug) {
        revalidatePath(`/categoria/${categoriaSlug}`);
      }
    } catch (err) {
      console.warn('[api/view] Falló la revalidación después de actualizar vistas:', err);
    }

    return NextResponse.json({ ok: true, vistas: currentVistas + 1 });
  } catch (e) {
    console.error('[api/view] Error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
