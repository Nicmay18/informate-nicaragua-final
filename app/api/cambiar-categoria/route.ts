import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  // Handle preflight CORS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const db = getAdminDb();
    const { ids, categoria = 'Sucesos' } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Se requiere array de ids' }, { status: 400 }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const actualizadas: { id: string; titulo: string; categoriaAnterior?: string }[] = [];
    const noEncontradas: string[] = [];

    for (const id of ids) {
      const docRef = db.collection('noticias').doc(id.trim());
      const doc = await docRef.get();

      if (!doc.exists) {
        noEncontradas.push(id);
        continue;
      }

      const data = doc.data();
      await docRef.update({ categoria });
      actualizadas.push({
        id: doc.id,
        titulo: data?.titulo || id,
        categoriaAnterior: data?.categoria,
      });
    }

    return NextResponse.json({
      ok: true,
      total: ids.length,
      actualizadas: actualizadas.length,
      noEncontradas: noEncontradas.length,
      detalles: actualizadas,
      faltantes: noEncontradas,
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error('[cambiar-categoria] Error:', error);
    return NextResponse.json(
      { error: 'Error interno', detail: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
