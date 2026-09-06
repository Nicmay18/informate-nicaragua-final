import { NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';
import { runScheduler } from '@/lib/departamento-central/scheduler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');

  if (!verifyAdminOrCronToken(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();

  try {
    const result = await runScheduler();
    await recordCronHeartbeat('/api/cron/departamento-central', { durationMs: Date.now() - started });
    return NextResponse.json({
      success: true,
      ...result,
      durationMs: Date.now() - started,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[departamento-central-cron] Error:', { error: message });
    return NextResponse.json({ error: message, durationMs: Date.now() - started }, { status: 500 });
  }
}
