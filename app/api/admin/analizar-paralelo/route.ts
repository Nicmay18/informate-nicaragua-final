import { NextResponse } from 'next/server';
import type { NoticiaInput } from '@/lib/analizador-noticias';
import { analizarNoticia } from '@/lib/analizador-noticias';
import { runParallel } from '@/lib/editor-jefe-v4/parallel-runner';
import { mapV4ToV3 } from '@/lib/editor-jefe-v4/mapper-v3';
import { logShadowRun } from '@/lib/editor-jefe-v4/shadow-logger';

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

    const tV3Start = Date.now();
    const v3Result = await analizarNoticia(noticia);
    const tV3Ms = Date.now() - tV3Start;

    const tV4Start = Date.now();
    const parallel = runParallel(noticia, v3Result);
    const tV4Ms = Date.now() - tV4Start;

    // FASE 1: Shadow Mode — registrar automáticamente
    await logShadowRun(
      { titulo: noticia.titulo, slug: noticia.slug, categoria: noticia.categoria },
      parallel.v3,
      parallel.v4,
      parallel.comparacion,
      tV3Ms,
      tV4Ms,
    );

    return NextResponse.json({
      v3: parallel.v3,
      v4: parallel.v4,
      v4_mapeado: parallel.v4 ? mapV4ToV3(parallel.v4) : null,
      comparacion: parallel.comparacion,
      timing: { v3Ms: tV3Ms, v4Ms: tV4Ms },
    });
  } catch (error) {
    console.error('Error en analisis paralelo:', error);
    return NextResponse.json(
      { error: 'Error al analizar en modo paralelo' },
      { status: 500 }
    );
  }
}
