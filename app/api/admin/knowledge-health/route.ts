import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getKnowledgeHealth } from '@/lib/meni/knowledge-base/knowledge-health';
import { detectBusinessOpportunities } from '@/lib/meni/knowledge-base/business-value';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const includeOpportunities = searchParams.get('opportunities') === 'true';

    const [health, opportunities] = await Promise.all([
      getKnowledgeHealth(db),
      includeOpportunities ? detectBusinessOpportunities(db) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      health,
      ...(opportunities ? { opportunities } : {}),
    });
  } catch (error) {
    console.error('[knowledge-health] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
