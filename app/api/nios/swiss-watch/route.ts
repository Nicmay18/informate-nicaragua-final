/**
 * NIOS Command Center — endpoint del tablero Swiss Watch.
 *
 * Devuelve el estado global, la sala de expertos, las tareas abiertas,
 * los bloqueos externos y el veredicto de preparacion para AdSense.
 *
 * Seguridad: requiere token de administracion o de cron. El tablero expone
 * estado operativo interno, por lo que no es publico. Nunca devuelve
 * valores de secretos, solo su presencia.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { getSwissWatchBoard } from '@/lib/nios/swiss-watch';
import { logger } from '@/lib/logger';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.replace(/^Bearer\s+/i, '');
  const cronSecret = request.headers.get('x-cron-secret');
  const token = new URL(request.url).searchParams.get('token');
  return (
    verifyAdminOrCronToken(token) ||
    verifyAdminOrCronToken(cronSecret) ||
    verifyAdminOrCronToken(bearer)
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const board = await getSwissWatchBoard();
    return NextResponse.json(board, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[api/nios/swiss-watch] Error construyendo el tablero', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
