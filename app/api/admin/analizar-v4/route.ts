import { NextResponse } from 'next/server';
import { evaluate, mapV4ToV3, verifyIntegrity, type NoticiaInput } from '@/lib/editorial';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const noticia: NoticiaInput = {
      titulo: body.titulo || '',
      contenido: body.contenido || '',
      resumen: body.resumen || '',
      categoria: body.categoria || 'Informacion General',
      autor: body.autor || '',
      fecha: body.fecha || new Date().toISOString(),
      fechaActualizacion: body.fechaActualizacion,
      imagenDestacada: body.imagenDestacada,
      slug: body.slug || '',
      palabrasClave: body.palabrasClave || [],
    };

    const tV4Start = Date.now();
    const resultadoV4 = evaluate(noticia);
    const tV4Ms = Date.now() - tV4Start;
    verifyIntegrity(resultadoV4);
    const resultadoV3 = mapV4ToV3(resultadoV4);

    return NextResponse.json({
      ...resultadoV3,
      _v4: resultadoV4,
      _timingMs: tV4Ms,
    });
  } catch (error) {
    console.error('Error en analisis V4:', error);
    return NextResponse.json(
      { error: 'Error al analizar la noticia con V4' },
      { status: 500 }
    );
  }
}
