import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    // Buscar por título (case-insensitive no soportado en Firestore, traemos todo y filtramos)
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(100).get();

    const arjona = snap.docs.filter(d => {
      const t = (d.data().titulo || '').toLowerCase();
      return t.includes('arjona') || t.includes('aventura');
    }).map(d => {
      const data = d.data();
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
      return {
        id: d.id,
        titulo: data.titulo,
        categoria: data.categoria,
        publicado: data.publicado ?? 'undefined',
        destacada: data.destacada ?? false,
        fecha: fechaStr,
        fechaType,
        slug: data.slug,
      };
    });

    return NextResponse.json({ ok: true, arjona });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
