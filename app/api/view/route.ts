import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
    const currentVistas = snap.docs[0].data().vistas || 0;

    await docRef.update({ vistas: FieldValue.increment(1) });

    return NextResponse.json({ ok: true, vistas: currentVistas + 1 });
  } catch (e) {
    console.error('[api/view] Error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
