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
      imagen: body.imagen,
      imagenDestacada: body.imagenDestacada,
      slug: body.slug || '',
      keywords: body.keywords,
      palabrasClave: body.palabrasClave || [],
    };

    const resultado = mapV4ToV3(evaluate(noticia));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error en analisis:', error);
    return NextResponse.json(
      { error: 'Error al analizar la noticia' },
      { status: 500 }
    );
  }
}
