import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken } from '@/lib/auth';
import { runCEOLoop } from '@/lib/nios/ceo-loop';
import { getLatestCeoLoopRecord } from '@/lib/nios/ceo-memory';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const { token, via } = extractRequestSecret(request);
  if (via === 'query') {
    logger.warn(`[admin/nios/loop] ${QUERY_SECRET_DEPRECATION_NOTE}`);
  }
  return verifyAdminOrCronToken(token);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  try {
    const record = await getLatestCeoLoopRecord();
    return NextResponse.json({ ok: true, record });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error leyendo ciclo CEO';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  try {
    const db = getAdminDb();
    const { record, autonomy } = await runCEOLoop(db, 'api/admin/nios/loop');
    return NextResponse.json({ ok: true, record, autonomy });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error ejecutando ciclo CEO';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
