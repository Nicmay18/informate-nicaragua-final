import { NextResponse } from 'next/server';
import { evaluate, mapV4ToV3, type NoticiaInput } from '@/lib/editorial';

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
    const v4 = evaluate(noticia);
    const tV4Ms = Date.now() - tV4Start;
    const v3 = mapV4ToV3(v4);

    return NextResponse.json({
      v4,
      v3,
      timing: { v4Ms: tV4Ms },
    });
  } catch (error) {
    console.error('Error en analisis:', error);
    return NextResponse.json(
      { error: 'Error al analizar la noticia' },
      { status: 500 }
    );
  }
}
