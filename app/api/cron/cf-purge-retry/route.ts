import { NextRequest, NextResponse } from 'next/server';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { processPendingCloudflarePurges } from '@/lib/cloudflare-purge';
import { isCronAllowed } from '@/lib/cost-guard';

export const dynamic = 'force-dynamic';

/**
 * Reintenta purgas de Cloudflare pendientes/fallidas.
 * Coste por corrida: 1 query (máx. 20 docs) + llamadas API solo si hay jobs.
 * Programado en vercel.json (ver docs/CF_PURGE_PROPOSAL.md).
 */
export async function GET(request: NextRequest) {
  const { token, via } = extractRequestSecret(request);
  if (via === 'query') {
    logger.warn(`[cron/cf-purge-retry] ${QUERY_SECRET_DEPRECATION_NOTE}`);
  }
  if (!verifyAdminOrCronToken(token)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  try {
    const db = getAdminDb();
    if (!(await isCronAllowed(db, '/api/cron/cf-purge-retry'))) {
      return NextResponse.json({ success: true, skipped: 'cost_guard' });
    }
    const result = await processPendingCloudflarePurges(20);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    logger.error('[cron/cf-purge-retry] error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 });
  }
}
