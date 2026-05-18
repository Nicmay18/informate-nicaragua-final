import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(50)
      .get();

    const noticias = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        slug: data.slug,
        titulo: data.titulo,
        categoria: data.categoria,
        destacada: !!data.destacada,
        publicado: data.publicado !== false,
        imagen: data.imagen || '(VACIO)',
        imagenLength: typeof data.imagen === 'string' ? data.imagen.length : 0,
        tieneImagen: !!data.imagen && data.imagen.length > 5,
      };
    });

    const sinImagen = noticias.filter(n => !n.tieneImagen);

    return NextResponse.json({
      total: noticias.length,
      conImagen: noticias.length - sinImagen.length,
      sinImagen: sinImagen.length,
      listaSinImagen: sinImagen,
      todas: noticias,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Error interno', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
