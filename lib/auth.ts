import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

export function isAdminRequest(request: Request): boolean {
  const token = request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '';
  return ADMIN_API_KEY.length > 0 && token === ADMIN_API_KEY;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

export function badRequest(message: string, issues?: ZodError['issues']): NextResponse {
  return NextResponse.json({ error: message, issues }, { status: 400 });
}
