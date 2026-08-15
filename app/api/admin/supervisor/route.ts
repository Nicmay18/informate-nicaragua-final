/**
 * Admin: Supervisor Panel — Centro de Operaciones Editoriales
 * ============================================================
 * GET  → Panel completo: salud, costos, críticos, vigilancia, updates
 * POST → Ejecutar acción del supervisor (watch, autofix, decidir)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  checkMediumHealth,
  canCallLLM,
  auditHomepage,
  runSupervisorWatchCycle,
  applySafeAutoFixes,
  makeEditorialDecision,
  evaluateRawTitle,
} from '@/lib/supervisor';
import type { ArticleContext, OperationsPanel } from '@/lib/supervisor';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(
    request.headers.get('x-admin-token') || request.headers.get('x-admin-key')
  );
}

/**
 * GET: Panel de operaciones completo
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();

    // 1. Salud del medio
    const health = await checkMediumHealth(db);

    // 2. Cost guard
    const costGuard = await canCallLLM(db);

    // 3. Homepage audit
    let homepage = null;
    try {
      homepage = await auditHomepage(db);
    } catch (e) {
      logger.warn('[supervisor] Homepage audit failed:', e);
    }

    // 4. Noticias críticas (con issues CRITICAL)
    const criticalArticles: OperationsPanel['criticalArticles'] = [];
    const watchingArticles: OperationsPanel['watchingArticles'] = [];
    const pendingUpdates: OperationsPanel['pendingUpdates'] = [];
    const activeInvestigations: OperationsPanel['activeInvestigations'] = [];

    try {
      // Lifecycles en vigilancia
      const lifecycleSnap = await db.collection('article_lifecycles').limit(50).get();
      for (const doc of lifecycleSnap.docs) {
        const data = doc.data();
        watchingArticles.push({
          articleId: doc.id,
          titulo: data.titulo || '(sin título)',
          frequency: data.watchConfig?.frequency || 'NORMAL',
          lastCheck: data.dateModified || data.datePublished || '',
          nextCheck: data.watchConfig?.enabled ? 'programado' : 'pausado',
          updatesDetected: data.updateCount || 0,
        });
      }
    } catch (e) {
      logger.warn('[supervisor] Error cargando lifecycles:', e);
    }

    // Updates pendientes de revisión
    try {
      const updatesSnap = await db.collection('supervisor_updates')
        .where('reviewed', '==', false)
        .limit(20)
        .get();
      for (const doc of updatesSnap.docs) {
        const data = doc.data();
        if (data.updates && Array.isArray(data.updates)) {
          for (const update of data.updates) {
            pendingUpdates.push({
              articleId: data.articleId,
              titulo: data.titulo || '',
              update,
            });
          }
        }
      }
    } catch (e) {
      logger.warn('[supervisor] Error cargando pending updates:', e);
    }

    // Mapear issues CRITICAL a criticalArticles
    for (const issue of health.issues.filter(i => i.severity === 'CRITICAL')) {
      criticalArticles.push({
        articleId: '(medio)',
        titulo: issue.problem,
        state: 'PUBLISHED',
        issues: [issue],
        lastAction: issue.action,
      });
    }

    const panel: OperationsPanel = {
      generatedAt: new Date().toISOString(),
      health,
      costGuard,
      criticalArticles,
      watchingArticles,
      pendingUpdates,
      activeInvestigations,
      homepage,
    };

    return NextResponse.json({ success: true, panel });
  } catch (error) {
    logger.error('[supervisor] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

/**
 * POST: Ejecutar acción del supervisor
 * Body: { action: 'watch' | 'autofix' | 'decide' | 'evaluate_title', ... }
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const db = getAdminDb();

    switch (action) {
      case 'watch': {
        const limit = Math.min(body.limit || 5, 20);
        const result = await runSupervisorWatchCycle(db, { limit });
        return NextResponse.json({ success: true, ...result });
      }

      case 'autofix': {
        const health = await checkMediumHealth(db);
        const autoFixable = health.issues.filter(i => i.autoFixable);
        if (autoFixable.length === 0) {
          return NextResponse.json({ success: true, fixed: 0, message: 'No hay problemas auto-fixeables' });
        }
        const result = await applySafeAutoFixes(db, autoFixable);
        return NextResponse.json({ success: true, ...result });
      }

      case 'decide': {
        // Decisión editorial sobre un artículo
        const ctx: ArticleContext = {
          titulo: body.titulo || '',
          contenido: body.contenido || '',
          resumen: body.resumen,
          categoria: body.categoria,
          perfil: body.perfil,
          imagen: body.imagen,
          publicado: body.publicado,
          estado: body.estado,
          scoreMeni: body.scoreMeni,
          aprobadoMeni: body.aprobadoMeni,
          research: body.research,
          story: body.story,
        };
        const decision = makeEditorialDecision(ctx);
        return NextResponse.json({ success: true, decision });
      }

      case 'evaluate_title': {
        // Evaluación rápida de título crudo
        const { titulo } = body;
        if (!titulo) {
          return NextResponse.json({ error: 'Falta titulo' }, { status: 400 });
        }
        const eval_ = evaluateRawTitle(titulo);
        return NextResponse.json({ success: true, evaluation: eval_ });
      }

      case 'homepage_audit': {
        const audit = await auditHomepage(db);
        return NextResponse.json({ success: true, audit });
      }

      case 'health': {
        const health = await checkMediumHealth(db);
        return NextResponse.json({ success: true, health });
      }

      default:
        return NextResponse.json(
          { error: `Acción desconocida: ${action}. Disponibles: watch, autofix, decide, evaluate_title, homepage_audit, health` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('[supervisor] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
