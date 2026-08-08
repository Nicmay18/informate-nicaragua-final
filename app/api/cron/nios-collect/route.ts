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
  const cronSecret = request.headers.get('x-cron-secret');
  const vercelCron = request.headers.get('x-vercel-cron');
  const userAgent = request.headers.get('user-agent') || '';
  const token = new URL(request.url).searchParams.get('token');

  // Vercel Cron envía su propio header / user-agent
  if (vercelCron === '1' || userAgent.toLowerCase().includes('vercel')) return true;
  // Si no hay CRON_SECRET configurado, acepta cualquier invocación (modo legacy)
  if (!expectedCron) return true;
  // CRON_SECRET por header o query
  return cronSecret === expectedCron || token === expectedCron;
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
