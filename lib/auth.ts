import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { verifySessionToken } from './admin-session';

/**
 * Constant-time string comparison to prevent timing attacks.
 * Works in both Node.js and Edge runtimes.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify a token against one or more valid secrets using timing-safe comparison.
 */
function verifyAgainstSecrets(token: string | null | undefined, secrets: string[]): boolean {
  if (!token || secrets.length === 0) return false;
  let matched = false;
  for (const secret of secrets) {
    if (timingSafeCompare(token, secret)) matched = true;
  }
  return matched;
}

/**
 * Verify admin token against ADMIN_API_KEY only.
 */
export function verifyAdminToken(token: string | null | undefined): boolean {
  return verifyAgainstSecrets(token, [process.env.ADMIN_API_KEY].filter(Boolean) as string[]);
}

/**
 * Verify admin token against ADMIN_API_KEY or CRON_SECRET.
 */
export function verifyAdminOrCronToken(token: string | null | undefined): boolean {
  const cron = process.env.CRON_SECRET_TOKEN || process.env.CRON_SECRET;
  return verifyAgainstSecrets(token, [process.env.ADMIN_API_KEY, cron].filter(Boolean) as string[]);
}

/**
 * Verify admin token against ADMIN_API_KEY or TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR.
 */
export function verifyAdminOrCleanupToken(token: string | null | undefined): boolean {
  const cleanup = process.env.CLEANUP_TOKEN || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  return verifyAgainstSecrets(token, [process.env.ADMIN_API_KEY, cleanup].filter(Boolean) as string[]);
}

function readAdminSessionCookie(request: Request): string {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === 'admin_session') return decodeURIComponent(rest.join('='));
  }
  return '';
}

export function isAdminRequest(request: Request): boolean {
  const token =
    request.headers.get('x-admin-token') ||
    request.headers.get('x-admin-key') ||
    '';
  if (verifyAdminToken(token)) return true;
  const cookie = readAdminSessionCookie(request);
  // Cookie legada (valor = ADMIN_API_KEY) ya no autentica: solo tokens
  // opacos emitidos por /api/admin/session con firma + expiración.
  return verifySessionToken(cookie);
}

/**
 * Headers de todo rechazo de autenticación: un 401 nunca debe
 * almacenarse en CDN ni navegador (Cloudflare corre con regla
 * "Cache Everything" que ya demostró cachear 200s autenticados).
 * Los handlers con respuestas 401 propias deben reutilizarla.
 */
export const NO_STORE_401_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
} as const;

export function unauthorized(): NextResponse {
  // Mismo endurecimiento que el 401 del middleware: hoy estas rutas están
  // detrás de requireAdminAuth (defensa en profundidad), pero si un
  // handler llegara a responder 401 directamente tampoco debe ser
  // cacheable en edge ni navegador.
  return NextResponse.json(
    { error: 'No autorizado' },
    { status: 401, headers: NO_STORE_401_HEADERS },
  );
}

export function badRequest(message: string, issues?: ZodError['issues']): NextResponse {
  return NextResponse.json({ error: message, issues }, { status: 400 });
}
