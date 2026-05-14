import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    has_base64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    base64_length: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.length || 0,
    has_project_id: !!process.env.FIREBASE_PROJECT_ID,
    has_client_email: !!process.env.FIREBASE_CLIENT_EMAIL,
    has_private_key: !!process.env.FIREBASE_PRIVATE_KEY,
    private_key_length: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    all_keys: Object.keys(process.env).filter(k => k.includes('FIREBASE')),
  });
}
