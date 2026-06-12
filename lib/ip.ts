import { NextRequest } from 'next/server';

/**
 * Extrae la IP real del cliente desde headers comunes de proxies/reverse proxies.
 * Soporta Vercel, Cloudflare, AWS ALB/ELB, nginx, Apache.
 */
export function getClientIp(request: NextRequest): string {
  const headers = request.headers;

  // Orden de prioridad: headers de proxy más específicos primero
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('true-client-ip') ||
    'unknown';

  return ip;
}

/**
 * Valida que un slug de artículo sea alfanumérico con guiones, longitud razonable.
 * Previene inyección de path traversal y caracteres peligrosos.
 */
export function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  if (slug.length < 1 || slug.length > 200) return false;
  // Solo letras minúsculas, números y guiones
  return /^[a-z0-9-]+$/.test(slug);
}
