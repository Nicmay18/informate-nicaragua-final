import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { runMeni, runMeniAsync } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { runEditorialDiagnosis, generateCEOResponse } from '@/lib/nios/editorial-diagnosis';
import { logger } from '@/lib/logger';

export const maxDuration = 30;

function verificarAuth(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token'));
}

export async function POST(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const noticia: NoticiaInput = {
      id: body.id || undefined,
      titulo: body.titulo || '',
      contenido: body.contenido || '',
      resumen: body.resumen || '',
      categoria: body.categoria || 'General',
      autor: body.autor || '',
      fecha: body.fecha || new Date().toISOString(),
      fechaActualizacion: body.fechaActualizacion,
      imagen: body.imagen,
      imagenDestacada: body.imagenDestacada,
      slug: body.slug || '',
      keywords: body.keywords,
      palabrasClave: body.palabrasClave || [],
    };

    const tStart = Date.now();
    const checkDuplicates = body.checkDuplicates !== false;
    let resultado;
    if (checkDuplicates) {
      const db = getAdminDb();
      resultado = await runMeniAsync(noticia, { db });
    } else {
      resultado = runMeni(noticia);
    }
    const tMs = Date.now() - tStart;

    const diagnosis = runEditorialDiagnosis(noticia, resultado);
    const ceoResponse = generateCEOResponse(diagnosis);

    return NextResponse.json({
      success: true,
      result: resultado,
      diagnosis,
      ceo: ceoResponse,
      _timingMs: tMs,
    });
  } catch (error) {
    logger.error('[meni/evaluar] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido en MENI' },
      { status: 500 }
    );
  }
}
