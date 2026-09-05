import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { runCEOLoop } from '@/lib/nios/ceo-loop';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');

  if (!verifyAdminOrCronToken(secret ?? '')) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const { record, autonomy } = await runCEOLoop(db, 'cron/nios-ceo-loop');
    return NextResponse.json({
      ok: true,
      id: record.id,
      status: record.status,
      autonomyScore: autonomy.score,
      autonomyMax: autonomy.max,
      observations: record.observations.length,
      diagnoses: record.diagnoses.length,
      decisions: record.decisions.length,
      repaired: record.repaired.length,
      pendingHuman: record.pendingHuman,
      failedRepairs: record.failedRepairs,
      learnings: record.learnings.length,
      summary: record.summary,
      timestamp: record.timestamp,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error ejecutando ciclo CEO';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
