import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

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

export function isAdminRequest(request: Request): boolean {
  const token =
    request.headers.get('x-admin-token') ||
    request.headers.get('x-admin-key') ||
    '';
  return verifyAdminToken(token);
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

export function badRequest(message: string, issues?: ZodError['issues']): NextResponse {
  return NextResponse.json({ error: message, issues }, { status: 400 });
}
