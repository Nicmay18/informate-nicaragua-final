import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Cron diario — NIOS Intelligence Platform
 * Se ejecuta a las 6:00 UTC (00:00 CST Nicaragua) via Vercel Cron.
 * Recolecta datos de GSC + GA4, fusiona con Firestore, genera reportes.
 */
function isAuthorized(request: NextRequest): boolean {
  const expectedCron = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  const cronSecret = request.headers.get('x-cron-secret');
  const cronAuthToken = request.headers.get('x-vercel-cron-auth-token');
  const vercelCron = request.headers.get('x-vercel-cron');
  const vercelSchedule = request.headers.get('x-vercel-cron-schedule');
  const userAgent = request.headers.get('user-agent') || '';
  const token = new URL(request.url).searchParams.get('token');

  // Si no hay CRON_SECRET configurado, acepta cualquier invocación (modo legacy / local)
  if (!expectedCron) return true;

  // Vercel Cron envía Authorization: Bearer <CRON_SECRET>
  // y headers adicionales de verificación. Soportamos varias formas:
  // 1. Header Authorization Bearer
  // 2. Header x-cron-secret
  // 3. Query ?token=
  // 4. Señales de Vercel cron (usadas como respaldo)
  const isBearer = auth === `Bearer ${expectedCron}`;
  const isHeader = !!cronSecret && cronSecret === expectedCron;
  const isQuery = !!token && token === expectedCron;
  const isVercelCron =
    vercelCron === '1' ||
    !!vercelSchedule ||
    !!cronAuthToken ||
    userAgent.toLowerCase().includes('vercel');

  return isBearer || isHeader || isQuery || isVercelCron;
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
    console.error('[cron/nios-collect] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
