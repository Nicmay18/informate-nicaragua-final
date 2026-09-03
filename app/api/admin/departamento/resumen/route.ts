import { NextResponse } from 'next/server';
import { getLatestDepartamentoReport } from '@/lib/departamento-central/store';
import { getDepartamentoWorkSummary } from '@/lib/departamento-central/summary';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [report, summary] = await Promise.all([
      getLatestDepartamentoReport(),
      getDepartamentoWorkSummary(),
    ]);

    if (!report) {
      return NextResponse.json({
        found: false,
        summary,
        message: 'Todavía no existe un informe del Departamento Central. Se generará en el próximo ciclo programado.',
      }, { status: 200 });
    }

    return NextResponse.json({ found: true, report, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[admin/departamento/resumen] Error:', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
