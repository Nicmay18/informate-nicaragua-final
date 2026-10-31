import { NextResponse } from 'next/server';
import { NO_STORE_401_HEADERS, verifyAdminOrCronToken } from '@/lib/auth';
import { recordCronHeartbeat, writeHeartbeat } from '@/lib/departamento-central/heartbeat';
import { runDepartamentoCentralCycle } from '@/lib/departamento-central/cycle';
import { saveDepartamentoReport } from '@/lib/departamento-central/store';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

  if (!verifyAdminOrCronToken(secret) && !verifyAdminOrCronToken(bearer)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  const started = Date.now();

  try {
    const report = await runDepartamentoCentralCycle();
    await saveDepartamentoReport(report);

    // El componente 'daily-report' es este cron: genera el reporte diario.
    // Antes el heartbeat solo lo escribía el worker del job encolado
    // 'daily-report', que quedaba hambriento detrás del backlog P0 — el
    // detector marcaba CRITICAL aunque el reporte sí se generaba a diario.
    await writeHeartbeat('daily-report', 'healthy', {
      durationMs: Date.now() - started,
      note: 'Reporte diario generado por cron departamento-daily',
    });
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
