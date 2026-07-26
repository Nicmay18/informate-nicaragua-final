import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const limitParam = parseInt(searchParams.get('limit') || '200', 10);
    const limit = Math.min(Math.max(limitParam, 1), 200);

    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db.collection('noticias').orderBy('fecha', 'desc');
    if (categoria) {
      query = query.where('categoria', '==', categoria);
    }
    const snap = await query.limit(limit).get();
    const articles = snap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        slug: data.slug || d.id,
        titulo: data.titulo || '(sin título)',
        contenidoLength: (data.contenido || '').length,
        resumenLength: (data.resumen || '').length,
        fecha: data.fecha?.toDate?.() || data.fecha,
      };
    });
    return NextResponse.json({ total: articles.length, articles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
