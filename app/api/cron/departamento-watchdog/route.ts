import { NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';
import { runWatchdog } from '@/lib/departamento-central/watchdog';
import { processJobQueue, watchdogDrainLimit } from '@/lib/departamento-central/scheduler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

  if (!verifyAdminOrCronToken(secret) && !verifyAdminOrCronToken(bearer)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();

  try {
    const result = await runWatchdog();
    // Segunda pasada de drain: los jobs encolados por el propio watchdog o
    // fuera de la ventana del scheduler se procesan aquí en vez de esperar
    // 24h al siguiente ciclo del scheduler.
    const drained = await processJobQueue(watchdogDrainLimit());
    await recordCronHeartbeat('/api/cron/departamento-watchdog', { durationMs: Date.now() - started });
    return NextResponse.json({
      success: true,
      drained,
      ...result,
      durationMs: Date.now() - started,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[departamento-watchdog-cron] Error:', { error: message });
    return NextResponse.json({ error: message, durationMs: Date.now() - started }, { status: 500 });
  }
}
