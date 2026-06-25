import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WHATSAPP_TOKEN = process.env.WHATSAPP_BUSINESS_TOKEN || '';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';

/** Envía mensaje de WhatsApp Business API (plantilla o texto) */
async function sendWhatsApp(
  to: string,
  message: string,
  previewUrl: boolean = true
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      return { ok: false, error: 'Faltan WHATSAPP_BUSINESS_TOKEN o WHATSAPP_PHONE_ID' };
    }

    const res = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: message, preview_url: previewUrl },
      }),
    });

    const data = await res.json();
    if (data.messages?.[0]?.id) return { ok: true, id: data.messages[0].id };
    return { ok: false, error: data.error?.message || JSON.stringify(data) };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, noticia, broadcast = false } = body;

    if (noticia) {
      const emoji: Record<string, string> = {
        Sucesos: '🚨', Nacionales: '📌', Economía: '💰', Cultura: '🎭',
        Espectáculos: '🎬', Deportes: '⚽', Tecnología: '💻', Internacionales: '🌍'
      };
      const catEmoji = emoji[noticia.categoria] || '📰';
      const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;
      const texto = `${catEmoji} *${noticia.titulo}*\n\n${(noticia.resumen || '').substring(0, 120)}...\n\n🔗 ${url}\n\n#NicaraguaInformate`;

      if (broadcast) {
        // Enviar a lista de contactos (requiere lista configurada en Meta)
        return NextResponse.json({ error: 'Broadcast requiere configurar lista de contactos en Meta Business' }, { status: 400 });
      }

      // Single send (para pruebas o canal)
      const r = await sendWhatsApp(to || '505', texto);
      return NextResponse.json({ success: r.ok, canal: 'whatsapp', ...r });
    }

    if (!message || !to) {
      return NextResponse.json({ error: 'message + to, o noticia requeridos' }, { status: 400 });
    }

    const r = await sendWhatsApp(to, message);
    return NextResponse.json({ success: r.ok, canal: 'whatsapp', ...r });
  } catch (err: any) {
    console.error('[admin/whatsapp]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
