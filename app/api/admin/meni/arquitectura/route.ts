import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { scanProject } from '@/lib/meni/architect';
import { logger } from '@/lib/logger';

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
    const graph = scanProject(process.cwd());
    const tMs = Date.now() - tStart;

    return NextResponse.json({
      success: true,
      graph,
      _timingMs: tMs,
    });
  } catch (error) {
    logger.error('[meni/arquitectura] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido en MENI Architect' },
      { status: 500 }
    );
  }
}
