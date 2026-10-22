import { createHmac } from 'node:crypto';
import { isAdminRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
const hits = new Map<string, { count: number; until: number }>();
/** Defensa por instancia, no se presenta como limitación distribuida. */
export function rateLimited(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = hits.get(key);
  if (bucket && bucket.until > now) return ++bucket.count > limit;
  if (hits.size >= 5000) {
    for (const [k, v] of hits) if (v.until <= now) hits.delete(k);
    if (hits.size >= 5000) return true;
  }
  hits.set(key, { count: 1, until: now + windowMs });
  return false;
}
export function fingerprint(value: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_API_KEY;
  if (!secret) throw new Error('Configuración comercial incompleta');
  return createHmac('sha256', secret).update(value).digest('hex');
}
export function clientKey(request: Request): string {
  return fingerprint(request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown');
}
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return (!origin || origin === new URL(request.url).origin)
    && request.headers.get('sec-fetch-site') !== 'cross-site';
}
/** Único rol del MVP: administrador autenticado por el servidor.
 * No acepta credenciales cron/cleanup ni roles declarados por el navegador. */
export function adminGuard(request: Request) {
  try {
    if (!isAdminRequest(request)) return privateJson({ error: 'No autorizado' }, 401);
    if (request.method !== 'GET' && !sameOrigin(request)) return privateJson({ error: 'Origen inválido' }, 403);
    if (rateLimited(`admin:${clientKey(request)}`, 120)) return privateJson({ error: 'Demasiadas solicitudes' }, 429);
    return null;
  } catch { return privateJson({ error: 'No autorizado' }, 401); }
}
export function actor(request: Request): string {
  // Seudónimo de sesión administrativa, no identidad personal inventada.
  return `admin:${fingerprint(request.headers.get('cookie') || request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '').slice(0, 24)}`;
}
export async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length') || 0) > 24_000) throw new SyntaxError('Cuerpo demasiado grande');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > 24_000) throw new SyntaxError('Cuerpo demasiado grande');
  return JSON.parse(text);
}
