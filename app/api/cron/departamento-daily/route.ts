import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';
import { runDepartamentoCentralCycle, saveDepartamentoReport } from '@/lib/departamento-central';
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
    const report = await runDepartamentoCentralCycle();
    await saveDepartamentoReport(report);

    await recordCronHeartbeat('/api/cron/departamento-daily', { durationMs: Date.now() - started });
    return NextResponse.json({
      success: true,
      runAt: report.runAt,
      site: report.site.status,
      durationMs: Date.now() - started,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[departamento-daily-cron] Error:', { error: message });
    return NextResponse.json({ error: message, durationMs: Date.now() - started }, { status: 500 });
  }
}
