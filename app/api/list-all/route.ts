import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();
    const articles = snap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
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
