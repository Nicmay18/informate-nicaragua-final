import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { loadRegistry, loadLatestSnapshot } from '@/lib/meni/registry/registry-store';
import { syncRegistry } from '@/lib/meni/registry/registry-sync';

export const maxDuration = 30;

function verificarAuth(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token'));
}

export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const tStart = Date.now();
    const cwd = process.cwd();
    let registry = loadRegistry(cwd) ?? loadLatestSnapshot(cwd);

    // Si no existe caché, escanear en caliente
    if (!registry) {
      const sync = syncRegistry(cwd, false);
      registry = sync.registry;
    }

    const tMs = Date.now() - tStart;

    return NextResponse.json({
      success: true,
      registry,
      _timingMs: tMs,
    });
  } catch (error) {
    console.error('[meni/registry] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido en MENI Registry' },
      { status: 500 }
    );
  }
}
