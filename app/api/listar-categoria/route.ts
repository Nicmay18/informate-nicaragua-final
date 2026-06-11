import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria') || 'Nacionales';

    const db = getAdminDb();
    const snapshot = await db
      .collection('noticias')
      .where('categoria', '==', categoria)
      .orderBy('fecha', 'desc')
      .get();

    const noticias = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        titulo: data.titulo || '(sin titulo)',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : null,
        publicado: data.publicado ?? false,
      };
    });

    return NextResponse.json({ ok: true, categoria, total: noticias.length, noticias });
  } catch (error) {
    console.error('[listar-categoria] Error:', error);
    return NextResponse.json(
      { error: 'Error interno', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
