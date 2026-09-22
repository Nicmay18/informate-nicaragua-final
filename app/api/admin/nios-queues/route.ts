/**
 * Consumidor real de las colas NIOS preparadas.
 *
 * GET → estado de las colas:
 *   - nios_distribution_queue: envíos preparados (PREPARED) pendientes de
 *     aprobación humana para Telegram.
 *   - nios_seo_experiments: propuestas de título/meta pendientes de revisión.
 *   - supervisor_updates: cambios detectados por el supervisor editorial.
 *
 * POST → { queue, id, action }
 *   distribution:
 *     'send'    → envía el mensaje real a Telegram y marca SENT; cierra la
 *                 acción padre como COMPLETED (ahora sí hay ejecución real).
 *     'dismiss' → marca DISCARDED; la acción padre queda REJECTED.
 *   seo:
 *     'done'    → el operador aplicó la propuesta vía edición normal →
 *                 status 'applied_by_human'; acción padre → COMPLETED.
 *     'dismiss' → 'discarded'; acción padre → REJECTED.
 *
 * Todo muta solo por acción explícita del operador — el GET no escribe.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getTelegramConfig } from '@/lib/telegram';
import { logger } from '@/lib/logger';

export const maxDuration = 30;

async function sendTelegramMessage(text: string): Promise<{ ok: boolean; error?: string }> {
  const { token, chatId } = await getTelegramConfig(getAdminDb());
  if (!token || !chatId) return { ok: false, error: 'Credenciales de Telegram no configuradas' };
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    return { ok: false, error: `Telegram API: ${res.status} ${data.description ?? ''}` };
  }
  return { ok: true };
}

export async function GET(request: NextRequest) {
  if (!verifyAdminOrCleanupToken(request.headers.get('x-admin-token'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const db = getAdminDb();

  const [dist, seo, sup] = await Promise.all([
    db.collection('nios_distribution_queue')
      .where('status', '==', 'PREPARED').orderBy('createdAt', 'desc').limit(50).get()
      .catch(() => null),
    db.collection('nios_seo_experiments')
      .where('status', '==', 'pending_review').orderBy('createdAt', 'desc').limit(50).get()
      .catch(() => null),
    db.collection('supervisor_updates')
      .orderBy('createdAt', 'desc').limit(20).get()
      .catch(() => null),
  ]);

  return NextResponse.json({
    distributionQueue: dist?.docs.map(d => ({ id: d.id, ...d.data() })) ?? [],
    seoExperiments: seo?.docs.map(d => ({ id: d.id, ...d.data() })) ?? [],
    supervisorUpdates: sup?.docs.map(d => ({ id: d.id, ...d.data() })) ?? [],
    counts: {
      distributionPending: dist?.size ?? 0,
      seoPending: seo?.size ?? 0,
      supervisorUpdatesRecent: sup?.size ?? 0,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!verifyAdminOrCleanupToken(request.headers.get('x-admin-token'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { queue, id, action } = body ?? {};
  if (!queue || !id || !['send', 'dismiss', 'done'].includes(action)) {
    return NextResponse.json(
      { error: 'queue, id y action (send|dismiss|done) requeridos' },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const collection = queue === 'distribution' ? 'nios_distribution_queue' : 'nios_seo_experiments';
  const ref = db.collection(collection).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
  const item = doc.data()!;

  const closeParentAction = async (status: 'COMPLETED' | 'REJECTED', note: string) => {
    if (!item.actionId) return;
    await db.collection('nios_actions').doc(item.actionId).update({
      status,
      completedAt: new Date().toISOString(),
      result: { ...(item as object), note },
    }).catch(() => undefined);
  };

  if (queue === 'distribution') {
    if (item.status !== 'PREPARED') {
      return NextResponse.json({ error: `Estado inválido para la acción: ${item.status}` }, { status: 409 });
    }
    if (action === 'send') {
      const sent = await sendTelegramMessage(String(item.message ?? ''));
      if (!sent.ok) {
        await ref.update({ status: 'FAILED', error: sent.error, failedAt: new Date().toISOString() });
        return NextResponse.json({ ok: false, error: sent.error }, { status: 502 });
      }
      await ref.update({ status: 'SENT', sentAt: new Date().toISOString() });
      await closeParentAction('COMPLETED', 'Envío a Telegram ejecutado por operador desde la cola.');
      logger.info('[nios-queues] Distribución enviada', { id, slug: item.slug });
      return NextResponse.json({ ok: true, status: 'SENT' });
    }
    await ref.update({ status: 'DISCARDED', discardedAt: new Date().toISOString() });
    await closeParentAction('REJECTED', 'Envío descartado por operador.');
    return NextResponse.json({ ok: true, status: 'DISCARDED' });
  }

  // seo experiments
  if (item.status !== 'pending_review') {
    return NextResponse.json({ error: `Estado inválido para la acción: ${item.status}` }, { status: 409 });
  }
  if (action === 'done') {
    await ref.update({ status: 'applied_by_human', appliedAt: new Date().toISOString() });
    await closeParentAction('COMPLETED', 'Propuesta SEO aplicada por el editor.');
    return NextResponse.json({ ok: true, status: 'applied_by_human' });
  }
  await ref.update({ status: 'discarded', discardedAt: new Date().toISOString() });
  await closeParentAction('REJECTED', 'Propuesta SEO descartada por el operador.');
  return NextResponse.json({ ok: true, status: 'discarded' });
}
