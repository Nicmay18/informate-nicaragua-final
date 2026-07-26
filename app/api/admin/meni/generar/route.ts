import { NextRequest, NextResponse } from 'next/server';
import { generarArticuloAutonomo } from '@/lib/meni/editor-autonomo/engine';

export const maxDuration = 60;

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  if (!validToken) {
    console.warn('[meni/generar] ADMIN_API_KEY no configurada');
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
    const { fuente = '', categoriaSugerida, url } = body;

    if (!fuente.trim()) {
      return NextResponse.json({ error: 'El campo fuente es obligatorio' }, { status: 400 });
    }

    const resultado = await generarArticuloAutonomo({ fuente, categoriaSugerida, url });

    return NextResponse.json(
      {
        success: true,
        aprobado: resultado.aprobado,
        score: resultado.scoreMeni,
        resultado,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[meni/generar] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
