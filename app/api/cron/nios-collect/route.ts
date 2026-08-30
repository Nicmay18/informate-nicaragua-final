import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { runAutonomousRepair, type NiosRepairEngineResult } from '@/lib/nios/repair-engine';
import { recordCeoLoopRun } from '@/lib/nios/ceo-memory';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Cron diario — NIOS Intelligence Platform
 * Se ejecuta a las 6:00 UTC (00:00 CST Nicaragua) via Vercel Cron.
 * Recolecta datos de GSC + GA4, fusiona con Firestore, genera reportes.
 */
function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.replace(/^Bearer\s+/i, '');
  const cronSecret = request.headers.get('x-cron-secret');
  const token = new URL(request.url).searchParams.get('token');

  return verifyAdminOrCronToken(token) || verifyAdminOrCronToken(cronSecret) || verifyAdminOrCronToken(bearer);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const { runNIOSPipeline, NIOS_CONFIG } = await import('@/lib/nios/intelligence/orchestrator');
    const result = await runNIOSPipeline(db, NIOS_CONFIG);

    // CEO AUTONOMOUS LOOP: detectar → decidir → ejecutar → verificar → aprender
    let repair: NiosRepairEngineResult | null = null;
    let repairError: string | null = null;
    try {
      repair = await runAutonomousRepair({ db, gsc: null, ga4: null, maxCycles: 2 });
      logger.info('[nios-collect] CEO loop completed:', repair.summary);
    } catch (err) {
      repairError = err instanceof Error ? err.message : String(err);
      logger.error('[nios-collect] CEO loop failed:', err);
    }

    const repaired = repair?.repaired.map((r) => ({
      repairId: r.repairId,
      problem: r.problem,
      action: r.action,
      status: r.status,
      verification: r.verification,
    })) ?? [];

    await recordCeoLoopRun({
      timestamp: new Date().toISOString(),
      mode: repair?.mode ?? 'UNKNOWN',
      trigger: 'cron/nios-collect',
      repaired,
      pendingHuman: repair?.pendingHuman.length ?? 0,
      failedRepairs: (repair?.failedRepairs.length ?? 0) + (repairError ? 1 : 0),
      skipped: repair?.skipped.length ?? 0,
      summary: repair?.summary ?? repairError ?? 'CEO loop not started',
      report: repair ? (repair.report as unknown as Record<string, unknown>) : { error: repairError },
    });

    return NextResponse.json({
      success: result.success,
      date: result.date,
      summary: result.summary,
      errors: result.errors,
      ceo: {
        mode: repair?.mode ?? 'UNKNOWN',
        repaired: repaired.length,
        pendingHuman: repair?.pendingHuman.length ?? 0,
        failedRepairs: (repair?.failedRepairs.length ?? 0) + (repairError ? 1 : 0),
        summary: repair?.summary ?? repairError,
      },
    });
  } catch (error) {
    logger.error('[cron/nios-collect] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
