import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

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

    return NextResponse.json({
      success: result.success,
      date: result.date,
      summary: result.summary,
      errors: result.errors,
    });
  } catch (error) {
    logger.error('[cron/nios-collect] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
