import { NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { enqueueJob } from '@/lib/departamento-central/queue';
import type { DeptoJobType, DeptoPriority } from '@/lib/departamento-central/types';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret') || '';
  if (!verifyAdminOrCronToken(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const event = String(body?.event || 'unknown');
    const payload = body?.payload || {};

    let jobType: DeptoJobType = 'article-pipeline';
    let jobPriority: DeptoPriority = 'P1';

    if (event === 'article-published' || event === 'article-updated') {
      jobType = 'article-pipeline';
      jobPriority = 'P1';
    } else if (event === 'site-alert') {
      jobType = 'health-check';
      jobPriority = 'P0';
    } else if (event === 'growth-opportunity') {
      jobType = 'growth-check';
      jobPriority = 'P2';
    }

    const jobId = await enqueueJob({
      type: jobType,
      priority: jobPriority,
      source: `webhook:${event}`,
      payload,
      dedupKey: payload?.dedupKey,
    });

    logger.info('[depto-webhook] Evento recibido y encolado', { event, jobId });
    return NextResponse.json({ success: true, jobId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[depto-webhook] Error:', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
