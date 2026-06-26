import { NextRequest, NextResponse } from 'next/server';

/** Control de métodos HTTP: solo POST permitido */
export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}

/**
 * DESHABILITADO temporalmente: tracking de vistas pausado para conservar recursos.
 * Cada vista causaba 1 lectura + 2 escrituras en Firestore + 1 function invocation.
 * Reactivar cuando el tráfico sea estable y rentable.
 */
export async function POST(request: NextRequest) {
  try {
    // Consumir body para liberar conexión pero no procesar
    try { await request.json(); } catch { /* ignore */ }
    return NextResponse.json({ ok: true, vistas: 0, disabled: true });
  } catch {
    return NextResponse.json({ ok: true, vistas: 0, disabled: true });
  }
}

