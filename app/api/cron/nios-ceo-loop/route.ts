import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken } from '@/lib/auth';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';
import { logger } from '@/lib/logger';
import { runCEOLoop } from '@/lib/nios/ceo-loop';
import { getNiosExecutiveData } from '@/lib/nios/executive-center';
import { buildNiosBrief } from '@/lib/nios/nios-speaks';
import { proposeActionsFromOpportunities } from '@/lib/nios/action-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { token: secret, via } = extractRequestSecret(request);
  if (via === 'query') {
    logger.warn(`[cron/nios-ceo-loop] ${QUERY_SECRET_DEPRECATION_NOTE}`);
  }

  if (!verifyAdminOrCronToken(secret)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  const startedAt = Date.now();

  try {
    const db = getAdminDb();
    const { record, autonomy } = await runCEOLoop(db, 'cron/nios-ceo-loop');

    // Proceso explícito de propuesta de acciones (único productor).
    // El panel solo lee la cola; aquí se crean propuestas con dedup por
    // opportunityId y por kind+target, una vez al día.
    let actionsProposed = 0;
    try {
      const executive = await getNiosExecutiveData();
      const brief = buildNiosBrief(executive);
      const actions = await proposeActionsFromOpportunities(brief.opportunities);
      actionsProposed = actions.filter((a) => a.status === 'PENDING').length;
    } catch (err) {
      console.error('[nios-ceo-loop] Propuesta de acciones falló (no bloquea el loop):', err);
    }
    await recordCronHeartbeat('/api/cron/nios-ceo-loop', { durationMs: Date.now() - startedAt });
    return NextResponse.json({
      ok: true,
      id: record.id,
      actionsProposed,
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
