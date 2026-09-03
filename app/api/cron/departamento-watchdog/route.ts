import { NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { runWatchdog } from '@/lib/departamento-central/watchdog';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');

  if (!verifyAdminOrCronToken(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();

  try {
    const result = await runWatchdog();
    return NextResponse.json({
      success: true,
      ...result,
      durationMs: Date.now() - started,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[departamento-watchdog-cron] Error:', { error: message });
    return NextResponse.json({ error: message, durationMs: Date.now() - started }, { status: 500 });
  }
}
