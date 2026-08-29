import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorized } from '@/lib/auth';
import { clampString } from '@/lib/validators';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json();
    const { titulo, mensaje, url, imagen, segment } = body as Record<string, unknown>;

    const t = clampString(titulo, '', 200);
    const m = clampString(mensaje, '', 500);
    const u = clampString(url, '', 500);
    const seg = clampString(segment, 'Subscribed Users', 100);

    if (!t || !m || !u) {
      return NextResponse.json({ error: 'titulo, mensaje y url requeridos' }, { status: 400 });
    }

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
      return NextResponse.json({ ok: true, skipped: true, message: 'Push: ONESIGNAL_APP_ID o ONESIGNAL_REST_API_KEY no configuradas' });
    }

    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: [seg],
      headings: { en: t, es: t },
      contents: { en: m, es: m },
      url: u,
      web_buttons: [{ id: 'read-more', text: 'Leer más', icon: '', url: u }],
    };

    if (imagen) {
      payload.chrome_web_image = imagen;
      payload.firefox_icon = imagen;
    }

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.errors && data.errors.length > 0) {
      return NextResponse.json({ error: data.errors[0], details: data }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      notificationId: data.id,
      recipients: data.recipients,
      url,
    });
  } catch (err: any) {
    logger.error('[admin/push-notificar]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
