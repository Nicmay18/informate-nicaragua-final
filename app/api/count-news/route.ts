import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = getAdminDb();
    
    // Contar todas las noticias
    const allSnap = await db.collection('noticias').get();
    const total = allSnap.size;
    
    // Contar publicadas
    const pubSnap = await db.collection('noticias').where('publicado', '!=', false).get();
    const publicadas = pubSnap.size;
    
    // Verificar si hay campo publicado
    const sample = allSnap.docs.slice(0, 3).map(d => ({
      id: d.id,
      titulo: d.data().titulo,
      publicado: d.data().publicado,
      fecha: d.data().fecha?.toDate ? d.data().fecha.toDate().toISOString() : null,
    }));
    
    return NextResponse.json({ total, publicadas, sample });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
