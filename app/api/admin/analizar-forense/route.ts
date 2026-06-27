import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { analizarNoticia, type NoticiaInput } from '@/lib/analizador-noticias';

export const dynamic = 'force-dynamic';

//  AUDITORÍA FORENSE MASIVA 
// Usa lib/analizador-noticias.ts (motor unificado v2.0)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const noticia: NoticiaInput = {
      titulo: body.titulo || '',
      contenido: body.contenido || '',
      resumen: body.resumen || '',
      categoria: body.categoria || 'general',
      autor: body.autor || 'Redacción NI',
      fecha: body.fecha || new Date().toISOString(),
      imagenDestacada: body.imagen || body.imagenDestacada,
      slug: body.slug || '',
      palabrasClave: body.keywords || [],
    };

    const resultado = await analizarNoticia(noticia);
    return NextResponse.json({ success: true, analisis: resultado });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria') || '';
    const limite = parseInt(searchParams.get('limite') || '200');

    let query = db.collection('noticias').limit(limite);
    if (categoria) query = query.where('categoria', '==', categoria);

    const snap = await query.get();

    const resultados = await Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data();
        const noticia: NoticiaInput = {
          titulo: data.titulo || '(sin título)',
          contenido: data.contenido || '',
          resumen: data.resumen || '',
          categoria: data.categoria || 'Sin categoría',
          autor: data.autor || 'Redacción NI',
          fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || new Date().toISOString(),
          imagenDestacada: data.imagenDestacada || data.imagen,
          slug: data.slug || '',
          palabrasClave: data.keywords || [],
        };
        const analisis = await analizarNoticia(noticia);
        return {
          id: doc.id,
          titulo: noticia.titulo,
          categoria: noticia.categoria,
          analisis,
        };
      })
    );

    const stats = {
      total: resultados.length,
      forense: resultados.filter(r => r.analisis.nivel === 'FORENSE').length,
      oro: resultados.filter(r => r.analisis.nivel === 'ORO').length,
      plata: resultados.filter(r => r.analisis.nivel === 'PLATA').length,
      bronce: resultados.filter(r => r.analisis.nivel === 'BRONCE').length,
      rechazado: resultados.filter(r => r.analisis.nivel === 'RECHAZADO').length,
      promedio_score: resultados.length
        ? Math.round(resultados.reduce((a, r) => a + r.analisis.puntuacion, 0) / resultados.length * 10) / 10
        : 0,
    };

    return NextResponse.json({ success: true, stats, noticias: resultados });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
