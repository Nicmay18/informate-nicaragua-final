import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasAdminKey = !!process.env.ADMIN_API_KEY;
  const hasCronSecret = !!process.env.CRON_SECRET;
  const hasAdminEmails = !!process.env.ADMIN_EMAILS;

  return NextResponse.json({
    ok: true,
    servidor: {
      adminApiKeyConfigurada: hasAdminKey,
      cronSecretConfigurado: hasCronSecret,
      adminEmailsConfigurados: hasAdminEmails,
      ambiente: process.env.VERCEL_ENV || 'local',
    },
    mensaje: hasAdminKey
      ? 'ADMIN_API_KEY está configurada en el servidor'
      : 'ADMIN_API_KEY NO está configurada. Agregala en Vercel → Settings → Environment Variables',
  });
}
