import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({
    project: 'informate-nicaragua-nextjs',
    has_project_id: !!process.env.FIREBASE_PROJECT_ID,
    has_client_email: !!process.env.FIREBASE_CLIENT_EMAIL,
    has_private_key: !!process.env.FIREBASE_PRIVATE_KEY,
    private_key_length: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    has_base64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  });
}
