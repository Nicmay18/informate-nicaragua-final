import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/session
 * Verifica el Firebase ID token del usuario y fija una cookie HttpOnly
 * para autenticación del panel. La clave nunca viaja al JS del navegador.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const idToken = body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: 'Firebase ID token requerido' }, { status: 400 });
    }

    // Verificar token con Firebase Admin
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    if (!decoded.email) {
      return NextResponse.json({ error: 'Token sin email asociado' }, { status: 401 });
    }

    // Fail-closed: sin allowlist configurada nadie puede obtener la API key
    const allowedEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedEmails.length === 0) {
      logger.error('[session] ADMIN_EMAILS no configurado; acceso denegado');
      return NextResponse.json({ error: 'Acceso administrativo no configurado' }, { status: 403 });
    }

    const email = decoded.email.toLowerCase();
    if (!allowedEmails.includes(email)) {
      return NextResponse.json(
        { error: 'Email no autorizado para acceso administrativo' },
        { status: 403 }
      );
    }

    const apiKey = process.env.ADMIN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ADMIN_API_KEY no configurado en servidor' }, { status: 500 });
    }

    const cookieOptions = [
      `admin_session=${encodeURIComponent(apiKey)}`,
      'HttpOnly',
      'SameSite=Strict',
      'Path=/',
      'Max-Age=86400',
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');

    const response = NextResponse.json({
      success: true,
      email: decoded.email,
    });
    response.headers.set('Set-Cookie', cookieOptions);
    return response;
  } catch (err: any) {
    logger.error('[session] Error:', err.message);
    return NextResponse.json(
      { error: 'Token inválido o expirado' },
      { status: 401 }
    );
  }
}
