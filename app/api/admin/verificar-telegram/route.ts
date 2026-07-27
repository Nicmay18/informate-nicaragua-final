import { NextRequest, NextResponse } from 'next/server';

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  if (!validToken) {
    console.warn('[verificar-telegram] ADMIN_API_KEY no configurada');
    return false;
  }
  return token === validToken;
}

export async function POST(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { token, chatId } = await request.json();
    const botToken = (token || '').trim();
    const chat = (chatId || '').trim();

    if (!botToken) {
      return NextResponse.json({ error: 'Falta bot token' }, { status: 400 });
    }

    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meData = await meRes.json();
    if (!meData.ok) {
      return NextResponse.json({
        ok: false,
        error: meData.description || 'Token inválido',
      }, { status: 400 });
    }

    if (chat) {
      const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: '✅ Conexión verificada desde el admin de Nicaragua Informate',
        }),
      });
      const sendData = await sendRes.json();
      return NextResponse.json({
        ok: true,
        bot: meData.result,
        sent: sendData.ok,
        sendError: sendData.description || null,
      });
    }

    return NextResponse.json({ ok: true, bot: meData.result, sent: false });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
