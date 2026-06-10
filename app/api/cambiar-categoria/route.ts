import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const db = getAdminDb();
    const { titulos, categoria = 'Sucesos' } = await request.json();

    if (!Array.isArray(titulos) || titulos.length === 0) {
      return NextResponse.json({ error: 'Se requiere array de titulos' }, { status: 400 });
    }

    const actualizadas: { id: string; titulo: string; categoriaAnterior?: string }[] = [];
    const noEncontradas: string[] = [];

    for (const titulo of titulos) {
      const snapshot = await db
        .collection('noticias')
        .where('titulo', '==', titulo.trim())
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Intentar búsqueda parcial si no encuentra exacta
        const partial = await db
          .collection('noticias')
          .where('titulo', '>=', titulo.trim())
          .where('titulo', '<=', titulo.trim() + '\uf8ff')
          .limit(1)
          .get();

        if (partial.empty) {
          noEncontradas.push(titulo);
          continue;
        }

        const doc = partial.docs[0];
        const data = doc.data();
        await doc.ref.update({ categoria });
        actualizadas.push({
          id: doc.id,
          titulo: data.titulo || titulo,
          categoriaAnterior: data.categoria,
        });
      } else {
        const doc = snapshot.docs[0];
        const data = doc.data();
        await doc.ref.update({ categoria });
        actualizadas.push({
          id: doc.id,
          titulo: data.titulo || titulo,
          categoriaAnterior: data.categoria,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      total: titulos.length,
      actualizadas: actualizadas.length,
      noEncontradas: noEncontradas.length,
      detalles: actualizadas,
      faltantes: noEncontradas,
    });
  } catch (error) {
    console.error('[cambiar-categoria] Error:', error);
    return NextResponse.json(
      { error: 'Error interno', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
