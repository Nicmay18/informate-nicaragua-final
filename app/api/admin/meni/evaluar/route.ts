import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { runMeni, runMeniAsync } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';

export const maxDuration = 30;

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  if (!validToken) {
    console.warn('[meni/evaluar] ADMIN_API_KEY no configurada');
    return false;
  }
  return token === validToken;
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

    return NextResponse.json({
      success: true,
      result: resultado,
      _timingMs: tMs,
    });
  } catch (error) {
    console.error('[meni/evaluar] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido en MENI' },
      { status: 500 }
    );
  }
}
