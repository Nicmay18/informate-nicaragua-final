import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { runCEOLoop } from '@/lib/nios/ceo-loop';
import { getLatestCeoLoopRecord } from '@/lib/nios/ceo-memory';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token') || request.headers.get('x-admin-key');
  const secret = request.headers.get('x-cron-secret');
  const { searchParams } = new URL(request.url);
  const tokenParam = searchParams.get('token') || searchParams.get('secret');
  return (
    verifyAdminOrCronToken(token ?? '') ||
    verifyAdminOrCronToken(secret ?? '') ||
    verifyAdminOrCronToken(tokenParam ?? '')
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
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
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
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
