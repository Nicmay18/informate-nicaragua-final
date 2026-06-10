import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getAdminDb();

    // Buscar por slug exacto
    const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();

    if (snap.empty) {
      return NextResponse.json({ ok: false, error: 'Noticia no encontrada por slug', slug });
    }

    const data = snap.docs[0].data();
    const id = snap.docs[0].id;

    let fechaStr = 'N/A';
    let fechaType = 'missing';
    if (data.fecha?.toDate) {
      fechaStr = data.fecha.toDate().toISOString();
      fechaType = 'Timestamp';
    } else if (data.fecha?._seconds) {
      fechaStr = new Date(data.fecha._seconds * 1000).toISOString();
      fechaType = 'rawTimestamp';
    } else if (typeof data.fecha === 'string') {
      fechaStr = data.fecha;
      fechaType = 'string';
    }

    return NextResponse.json({
      ok: true,
      id,
      slug: data.slug,
      titulo: data.titulo,
      categoria: data.categoria,
      publicado: data.publicado ?? 'undefined',
      destacada: data.destacada ?? false,
      fecha: fechaStr,
      fechaType,
      vistas: data.vistas ?? 0,
      autor: data.autor,
      imagen: data.imagen ? data.imagen.substring(0, 100) + '...' : null,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
