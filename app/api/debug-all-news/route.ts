import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(10).get();
    
    const docs = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        titulo: data.titulo,
        imagen: data.imagen,
        imagen_type: typeof data.imagen,
        categoria: data.categoria,
        publicado: data.publicado,
      };
    });
    
    return NextResponse.json({
      total: snap.size,
      docs,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
