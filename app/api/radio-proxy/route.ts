// app/api/radio-proxy/route.ts
// DESHABILITADO: evitar consumo de ancho de banda de App Engine.
// El reproductor usa stream directo desde el cliente (RadioPlayer.tsx).
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint deshabilitado. Use el stream directo de la radio.' },
    { status: 410 }
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 410 });
}
