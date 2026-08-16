import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    servidor: {
      ambiente: process.env.VERCEL_ENV || 'local',
    },
  });
}
