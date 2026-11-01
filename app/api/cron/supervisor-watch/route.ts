/**
 * Cron: Supervisor Watch Cycle
 * =============================
 * Ejecuta vigilancia automática sobre noticias publicadas.
 * Configurar en Vercel cron como: 0 0-23/2 * * * (cada 2 horas)
 *
 * El supervisor:
 * 1. Vigila noticias BREAKING/DEVELOPING
 * 2. Detecta actualizaciones y conflictos
 * 3. Respeta cost guard (no quema dinero)
 * 4. Persiste resultados para el panel de operaciones
 */

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkMediumHealth, applySafeAutoFixes } from '@/lib/supervisor';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';
import { logger } from '@/lib/logger';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  // Auth por CRON_SECRET — headers primero; query string es transporte
  // legado que se registra sin exponer el valor.
  const { token: secret, via } = extractRequestSecret(request);
  if (via === 'query') {
    logger.warn(`[cron/supervisor-watch] ${QUERY_SECRET_DEPRECATION_NOTE}`);
  }

  if (!verifyAdminOrCronToken(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  const startedAt = Date.now();
  const db = getAdminDb();

  try {
    // 1. Health check rápido
    const health = await checkMediumHealth(db);

    // 2. Auto-fix de problemas seguros
    const autoFixable = health.issues.filter(i => i.autoFixable);
    let autoFixResult: { fixed: number; skipped: number; details: string[] } | null = null;
    if (autoFixable.length > 0) {
      autoFixResult = await applySafeAutoFixes(db, autoFixable);
    }

    // 3. Persistir resumen del ciclo
    const cycleSummary = {
      runAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      health: {
        critical: health.critical,
        important: health.important,
        warning: health.warning,
        optimization: health.optimization,
      },
      autoFix: autoFixResult ? { fixed: autoFixResult.fixed, skipped: autoFixResult.skipped } : null,
    };

    try {
      await db.collection('supervisor_cycles').add(cycleSummary);
    } catch (e) {
      logger.warn('[supervisor-cron] Error persistiendo cycle summary:', e);
    }

    await recordCronHeartbeat('/api/cron/supervisor-watch', { durationMs: Date.now() - startedAt });
    return NextResponse.json({
      success: true,
      ...cycleSummary,
      autoFixDetails: autoFixResult?.details || [],
    });
  } catch (error) {
    logger.error('[supervisor-cron] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido', durationMs: Date.now() - startedAt },
      { status: 500 }
    );
  }
}
