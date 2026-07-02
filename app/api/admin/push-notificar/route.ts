import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '608354d3-fd2a-4c97-b055-5c14b57bbe9b';
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, mensaje, url, imagen, segment = 'Subscribed Users' } = body;

    if (!titulo || !mensaje || !url) {
      return NextResponse.json({ error: 'titulo, mensaje y url requeridos' }, { status: 400 });
    }

    if (!ONESIGNAL_REST_KEY) {
      return NextResponse.json({ ok: true, skipped: true, message: 'Push: ONESIGNAL_REST_API_KEY no configurada (opcional)' });
    }

    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: [segment],
      headings: { en: titulo, es: titulo },
      contents: { en: mensaje, es: mensaje },
      url,
      web_buttons: [{ id: 'read-more', text: 'Leer más', icon: '', url }],
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
    console.error('[admin/push-notificar]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
