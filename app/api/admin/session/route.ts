import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/session
 * Verifica el Firebase ID token del usuario y devuelve el ADMIN_API_KEY
 * para autenticación automática del panel sin pegar tokens manualmente.
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

    // Si ADMIN_EMAILS está configurado, verificar que el email esté autorizado
    const allowedEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedEmails.length > 0) {
      const email = decoded.email.toLowerCase();
      if (!allowedEmails.includes(email)) {
        return NextResponse.json(
          { error: 'Email no autorizado para acceso administrativo' },
          { status: 403 }
        );
      }
    }

    const apiKey = process.env.ADMIN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ADMIN_API_KEY no configurado en servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token: apiKey,
      email: decoded.email,
    });
  } catch (err: any) {
    console.error('[session] Error:', err.message);
    return NextResponse.json(
      { error: 'Token inválido o expirado' },
      { status: 401 }
    );
  }
}
