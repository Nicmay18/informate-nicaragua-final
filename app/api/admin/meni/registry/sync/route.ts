import { NextRequest, NextResponse } from 'next/server';
import { syncRegistry } from '@/lib/meni/registry/registry-sync';

export const maxDuration = 30;

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  if (!validToken) {
    console.warn('[meni/registry/sync] ADMIN_API_KEY no configurada');
    return false;
  }
  return token === validToken;
}

export async function POST(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const tStart = Date.now();
    const result = syncRegistry(process.cwd(), true);
    const tMs = Date.now() - tStart;

    return NextResponse.json({
      success: true,
      ...result,
      _timingMs: tMs,
    });
  } catch (error) {
    console.error('[meni/registry/sync] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido en MENI Registry Sync' },
      { status: 500 }
    );
  }
}
