import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isAdminRequest, unauthorized, badRequest } from '@/lib/auth';
import { CorregirTituloSchema } from '@/lib/dtos';
import { normalizarTitulo } from '@/lib/meni/titulo';
import { assertSupervisorApprovesMutation } from '@/lib/editorial/supervisor-gate';

export async function POST(request: Request) {
  try {
    if (!isAdminRequest(request)) {
      return unauthorized();
    }

    const raw = await request.json().catch(() => ({}));
    const parsed = CorregirTituloSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest('Datos inválidos', parsed.error.issues);
    }

    const { id, titulo, slug } = parsed.data;
    const tituloLimpio = normalizarTitulo(titulo);

    const db = getAdminDb();
    const docRef = db.collection('noticias').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    // REGLA 16: Cambiar titulo requiere aprobacion del Supervisor.
    // Antes se destruia aprobadoMeni sin re-evaluar. Ahora el Supervisor
    // decide si el nuevo titulo es periodisticamente valido.
    const changes: Record<string, unknown> = { titulo: tituloLimpio };
    if (slug) changes.slug = slug.trim();

    const gate = await assertSupervisorApprovesMutation(db, id, changes);
    if (!gate.approved) {
      return NextResponse.json({
        error: gate.reason,
        code: 'SUPERVISOR_BLOCKED',
        supervisor: gate.decision && {
          decisionId: gate.decision.decisionId,
          verdict: gate.decision.verdict,
          issues: gate.decision.issues,
        },
      }, { status: 400 });
    }

    // El Supervisor aprobo: aplicar cambio y marcar para re-evaluacion MENI
    const updateData: Record<string, string | null | boolean> = {
      titulo: tituloLimpio,
      scoreMeni: null,
      aprobadoMeni: false,
    };
    if (slug) updateData.slug = slug.trim();

    await docRef.update(updateData);
    return NextResponse.json({ ok: true, id, titulo: tituloLimpio, slug });
  } catch (error) {
    console.error('[corregir-titulo] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
