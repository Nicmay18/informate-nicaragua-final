import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { event, slug } = body as { event?: string; slug?: string };

    if (event !== 'impression' && event !== 'click') {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = db.collection('support_analytics').doc();

    await docRef.set({
      event,
      slug: slug || '',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || '',
      referrer: request.headers.get('referer') || '',
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[support/track] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
