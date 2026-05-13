import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Falta parametro slug' }, { status: 400 });
  }

  try {
    const { adminDb } = await import('@/lib/firebase-admin');

    // Buscar por slug
    const slugSnap = await adminDb
      .collection('noticias')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!slugSnap.empty) {
      const doc = slugSnap.docs[0];
      const data = doc.data();
      return NextResponse.json({
        found: true,
        id: doc.id,
        slug: data.slug,
        titulo: data.titulo,
        imagen: data.imagen,
        imagenType: typeof data.imagen,
        imagenLength: typeof data.imagen === 'string' ? data.imagen.length : null,
        categoria: data.categoria,
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha,
        raw: data,
      });
    }

    // Fallback: buscar por ID si el slug no coincide
    const idSnap = await adminDb.collection('noticias').doc(slug).get();
    if (idSnap.exists) {
      const data = idSnap.data();
      return NextResponse.json({
        found: true,
        id: idSnap.id,
        slug: data?.slug,
        titulo: data?.titulo,
        imagen: data?.imagen,
        imagenType: typeof data?.imagen,
        imagenLength: typeof data?.imagen === 'string' ? data.imagen.length : null,
        categoria: data?.categoria,
        fecha: data?.fecha?.toDate ? data.fecha.toDate().toISOString() : data?.fecha,
        raw: data,
      });
    }

    return NextResponse.json({ found: false, slug }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Error interno', detail: err.message },
      { status: 500 }
    );
  }
}
