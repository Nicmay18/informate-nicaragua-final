import { NextResponse } from 'next/server';
import { getRecentJobs, getDeadLetter } from '@/lib/departamento-central/queue';
import { getDepartmentHealth } from '@/lib/departamento-central/heartbeat';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [jobs, dead, health] = await Promise.all([
      getRecentJobs(20),
      getDeadLetter(10),
      getDepartmentHealth(),
    ]);

    return NextResponse.json({
      jobs,
      dead,
      health,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[admin/departamento/trabajos] Error:', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
