import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken } from '@/lib/auth';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';
import { cleanupTrafficLog, trafficLogTTLDays } from '@/lib/analytics/traffic-ttl';
import { recordDailyCostSnapshot } from '@/lib/cost-guard';
import { logger } from '@/lib/logger';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const { token, via } = extractRequestSecret(request);
  if (via === 'query') {
    logger.warn(`[cron/traffic-cleanup] ${QUERY_SECRET_DEPRECATION_NOTE}`);
  }
  return verifyAdminOrCronToken(token);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  const startedAt = Date.now();

  try {
    const db = getAdminDb();
    const olderThanDays = trafficLogTTLDays();
    const result = await cleanupTrafficLog(db, olderThanDays, 500);

    // Snapshot diario de métricas de costo (count() — barato). Best-effort:
    // un fallo aquí no debe romper la limpieza de traffic_log.
    let costSnapshot: Record<string, number> | null = null;
    try {
      costSnapshot = await recordDailyCostSnapshot(db);
    } catch (snapErr) {
      logger.warn('[cron/traffic-cleanup] cost snapshot falló (no fatal):', snapErr instanceof Error ? snapErr.message : String(snapErr));
    }

    await recordCronHeartbeat('/api/cron/traffic-cleanup', { durationMs: Date.now() - startedAt });
    return NextResponse.json({
      success: true,
      olderThanDays,
      ...result,
      costSnapshot,
      note: 'La política TTL de Firestore es el método preferido; este endpoint actúa como respaldo manual.',
    });
  } catch (error) {
    logger.error('[cron/traffic-cleanup] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
