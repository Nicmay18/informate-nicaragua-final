import { NextRequest, NextResponse } from 'next/server';
import { aggregateJourneyMetrics } from '@/lib/observability/aggregations';
import { detectOpportunities } from '@/lib/observability/growth';
import { buildMorningBrief } from '@/lib/observability/brief';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const db = getAdminDb();
    const journey = await aggregateJourneyMetrics(db, { hours: Math.min(hours, 168) });
    const opportunities = detectOpportunities({ journey });
    const externalErrors = 0; // REQUIRES_REAL_OBSERVABILITY: contador de errores externos cuando haya fuente
    const brief = buildMorningBrief(journey, opportunities, externalErrors);
    return NextResponse.json(brief);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    return NextResponse.json({ dataStatus: 'ERROR', error: message }, { status: 500 });
  }
}
