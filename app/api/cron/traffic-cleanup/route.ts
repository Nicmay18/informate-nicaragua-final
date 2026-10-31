import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken } from '@/lib/auth';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';
import { cleanupTrafficLog, trafficLogTTLDays } from '@/lib/analytics/traffic-ttl';
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

    await recordCronHeartbeat('/api/cron/traffic-cleanup', { durationMs: Date.now() - startedAt });
    return NextResponse.json({
      success: true,
      olderThanDays,
      ...result,
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
