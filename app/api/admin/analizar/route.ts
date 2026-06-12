import { NextResponse } from 'next/server';
import { analizarNoticia, type NoticiaInput } from '@/lib/analizador-noticias';

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

    const resultado = await analizarNoticia(noticia);

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error en analisis:', error);
    return NextResponse.json(
      { error: 'Error al analizar la noticia' },
      { status: 500 }
    );
  }
}
