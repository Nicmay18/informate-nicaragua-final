import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCleanupToken } from '@/lib/auth';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

/**
 * GET — Devuelve la telemetría de NIOS.
 * Último reporte, health score, módulos más lentos y alertas.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection('nios_telemetry')
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({
        success: true,
        latest: null,
        message: 'No hay telemetría registrada aún. Ejecuta /api/admin/nios-collect.',
      });
    }

    const doc = snap.docs[0];
    const data = doc.data() as {
      date: string;
      report: { totalDuration: number; modules: { name: string; durationMs: number; status: string }[]; firestore: { reads: number; writes: number }; healthSignals: string[]; errors: string[] };
      health: { score: number; level: string; warnings: string[]; breakdown: Record<string, number> };
      trafficMigration: { dailySource: string; fallbackReads: number; migrationHealth: number } | null;
      savedAt: string;
    };

    const slowestModules = [...data.report.modules]
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 5);

    const failedModules = data.report.modules.filter((m) => m.status === 'error');

    return NextResponse.json({
      success: true,
      latest: {
        date: data.date,
        savedAt: data.savedAt,
        totalDuration: data.report.totalDuration,
        health: data.health,
        firestore: data.report.firestore,
        trafficMigration: data.trafficMigration,
        slowestModules,
        failedModules,
        healthSignals: data.report.healthSignals,
        errors: data.report.errors,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
