import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(30).get();

    const result = snap.docs.map(d => {
      const data = d.data();
      const contenido = data.contenido || '';
      return {
        id: d.id,
        titulo: data.titulo?.substring(0, 70),
        palabras: contenido.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
        vacio: contenido.trim().length === 0,
        preview: contenido.trim().substring(0, 100),
      };
    });

    return NextResponse.json({ total: result.length, articles: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
