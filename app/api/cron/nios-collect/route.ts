import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { runCEOLoop, type CEOLoopResult } from '@/lib/nios/ceo-loop';

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

    // CEO AUTONOMOUS LOOP: observe → diagnose → decide → plan → execute → verify → learn
    let ceo: CEOLoopResult | null = null;
    let ceoError: string | null = null;
    try {
      ceo = await runCEOLoop(db, 'cron/nios-collect');
      logger.info('[nios-collect] CEO loop completed:', ceo.record.summary);
    } catch (err) {
      ceoError = err instanceof Error ? err.message : String(err);
      logger.error('[nios-collect] CEO loop failed:', err);
    }

    return NextResponse.json({
      success: result.success,
      date: result.date,
      summary: result.summary,
      errors: result.errors,
      ceo: {
        mode: ceo?.record.mode ?? 'UNKNOWN',
        autonomyScore: ceo?.autonomy.score ?? 0,
        autonomyMax: ceo?.autonomy.max ?? 8,
        autonomyReport: ceo?.autonomy.report ?? { OBSERVE: 'DEAD' },
        repaired: ceo?.record.repaired.length ?? 0,
        pendingHuman: ceo?.record.pendingHuman ?? 0,
        failedRepairs: ceo?.record.failedRepairs ?? 0,
        decisions: ceo?.record.decisions ?? [],
        learnings: ceo?.record.learnings ?? [],
        summary: ceo?.record.summary ?? ceoError,
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
