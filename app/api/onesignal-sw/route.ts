import { NextResponse } from 'next/server';

export async function GET() {
  const body = "importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');\n";
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
