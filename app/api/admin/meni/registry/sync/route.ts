import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { syncRegistry } from '@/lib/meni/registry/registry-sync';

export const maxDuration = 30;

function verificarAuth(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token'));
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
