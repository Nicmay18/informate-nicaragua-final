import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { cleanupTrafficLog, trafficLogTTLDays } from '@/lib/analytics/traffic-ttl';
import { logger } from '@/lib/logger';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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
    const olderThanDays = trafficLogTTLDays();
    const result = await cleanupTrafficLog(db, olderThanDays, 500);

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
