import { NextResponse } from 'next/server';
import type { NoticiaInput } from '@/lib/analizador-noticias';
import { pipelineV4 } from '@/lib/editor-jefe-v4/pipeline';
import { mapV4ToV3, consistencyAudit } from '@/lib/editor-jefe-v4';
import { logV4Run } from '@/lib/editor-jefe-v4/shadow-logger';

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
    const resultadoV4 = pipelineV4(noticia);
    const tV4Ms = Date.now() - tV4Start;
    const resultadoV3 = mapV4ToV3(resultadoV4);
    const auditoria = consistencyAudit(resultadoV4, resultadoV3);

    // FASE 2: recolectar estadísticas del panel sin afectar scoring
    void logV4Run(
      { titulo: noticia.titulo, slug: noticia.slug, categoria: noticia.categoria },
      resultadoV4,
      tV4Ms,
    );

    return NextResponse.json({
      ...resultadoV3,
      _v4: resultadoV4,
      _auditoria: auditoria,
    });
  } catch (error) {
    console.error('Error en analisis V4:', error);
    return NextResponse.json(
      { error: 'Error al analizar la noticia con V4' },
      { status: 500 }
    );
  }
}
