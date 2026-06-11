import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();
    const empty = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter((d: any) => !d.contenido || d.contenido.length < 100)
      .map((d: any) => ({ id: d.id, titulo: d.titulo || '(sin título)', contenidoLength: (d.contenido || '').length }));
    return NextResponse.json({ totalEmpty: empty.length, articles: empty });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
