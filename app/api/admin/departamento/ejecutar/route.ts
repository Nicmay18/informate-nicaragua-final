import { NextResponse } from 'next/server';
import { NO_STORE_401_HEADERS, verifyAdminOrCronToken } from '@/lib/auth';
import { runDepartamentoCentralCycle } from '@/lib/departamento-central/cycle';
import { saveDepartamentoReport } from '@/lib/departamento-central/store';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');

  if (!verifyAdminOrCronToken(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  const started = Date.now();

  try {
    const report = await runDepartamentoCentralCycle();
    await saveDepartamentoReport(report);

    return NextResponse.json({
      success: true,
      runAt: report.runAt,
      site: report.site.status,
      durationMs: Date.now() - started,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[admin/departamento/ejecutar] Error:', { error: message });
    return NextResponse.json({ error: message, durationMs: Date.now() - started }, { status: 500 });
  }
}
