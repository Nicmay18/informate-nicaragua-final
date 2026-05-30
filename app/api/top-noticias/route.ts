import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('noticias')
      .orderBy('vistas', 'desc')
      .limit(6)
      .get();

    const noticias = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        titulo: data.titulo || 'Sin título',
        slug: data.slug || doc.id,
        categoria: data.categoria || 'General',
        vistas: data.vistas || 0,
        imagen: data.imagen || null,
        fecha: data.fecha?.toDate?.().toISOString() || data.fecha || null,
      };
    });

    return NextResponse.json({ noticias });
  } catch (error) {
    console.error('Error leyendo top noticias:', error);
    return NextResponse.json({ noticias: [] }, { status: 500 });
  }
}
