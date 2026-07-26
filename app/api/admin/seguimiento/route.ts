import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  getDashboard,
  getCases,
  getCaseDetail,
  createManualCase,
  updateManualCase,
  closeManualCase,
  findCasesForArticle,
  processArticle,
} from '@/lib/meni/seguimiento';
import type { CaseStatus, CasePriority, CaseType } from '@/lib/meni/seguimiento';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-token') || request.headers.get('x-admin-key');
  const expected = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  return !!expected && key === expected;
}

/**
 * GET — Obtener dashboard, lista de casos, o detalle de un caso
 * ?action=dashboard (default) | ?action=cases&status=abierto | ?action=case&id=xxx | ?action=related&title=...&content=...
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';
    const db = getAdminDb();

    if (action === 'dashboard') {
      const dashboard = await getDashboard(db);
      return NextResponse.json({ success: true, dashboard });
    }

    if (action === 'cases') {
      const status = (searchParams.get('status') as CaseStatus) || undefined;
      const cases = await getCases(db, status);
      return NextResponse.json({ success: true, cases, total: cases.length });
    }

    if (action === 'case') {
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ error: 'Parámetro id requerido' }, { status: 400 });
      }
      const detail = await getCaseDetail(db, id);
      if (!detail.case) {
        return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true, ...detail });
    }

    if (action === 'related') {
      const title = searchParams.get('title') || '';
      const content = searchParams.get('content') || '';
      if (!title) {
        return NextResponse.json({ error: 'Parámetro title requerido' }, { status: 400 });
      }
      const related = await findCasesForArticle(db, title, content);
      return NextResponse.json({ success: true, relatedCases: related, total: related.length });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('[seguimiento GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}

/**
 * POST — Crear caso, procesar artículo, o actualizar caso
 * Body: { action: 'create' | 'process' | 'update' | 'close', ... }
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const db = getAdminDb();

    if (action === 'create') {
      const newCase = await createManualCase(db, {
        title: body.title,
        summary: body.summary,
        type: body.type as CaseType,
        priority: body.priority as CasePriority,
        category: body.category,
        departamento: body.departamento,
        tags: body.tags,
      });
      return NextResponse.json({ success: true, case: newCase });
    }

    if (action === 'process') {
      const { articleId, title, content, slug, category, departamento } = body;
      if (!articleId || !title || !content) {
        return NextResponse.json({ error: 'Faltan articleId, title, content' }, { status: 400 });
      }
      const result = await processArticle(db, articleId, title, content, slug || '', category || 'General', departamento || '');
      return NextResponse.json({ success: true, result });
    }

    if (action === 'update') {
      const { caseId, updates } = body;
      if (!caseId) {
        return NextResponse.json({ error: 'caseId requerido' }, { status: 400 });
      }
      await updateManualCase(db, caseId, updates);
      return NextResponse.json({ success: true, message: 'Caso actualizado.' });
    }

    if (action === 'close') {
      const { caseId, closingSummary } = body;
      if (!caseId) {
        return NextResponse.json({ error: 'caseId requerido' }, { status: 400 });
      }
      await closeManualCase(db, caseId, closingSummary);
      return NextResponse.json({ success: true, message: 'Caso cerrado.' });
    }

    return NextResponse.json({ error: 'Acción no válida. Usa: create, process, update, close' }, { status: 400 });
  } catch (error) {
    console.error('[seguimiento POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
