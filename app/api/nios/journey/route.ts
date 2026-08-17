import { NextRequest, NextResponse } from 'next/server';
import { aggregateJourneyMetrics } from '@/lib/observability/aggregations';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const db = getAdminDb();
    const metrics = await aggregateJourneyMetrics(db, { hours: Math.min(hours, 168) });
    return NextResponse.json(metrics);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    return NextResponse.json({ dataStatus: 'ERROR', error: message }, { status: 500 });
  }
}
