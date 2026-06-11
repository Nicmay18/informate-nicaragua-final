/**
 * Rate Limiter basado en LRU in-memory.
 * Usa Map nativo para evitar dependencias externas.
 * Diseñado para Next.js Edge/Node runtime (sin estado compartido entre workers).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const WINDOW_MS = 60_000; // 1 minuto
const MAX_REQUESTS = 30;  // 30 req/min por IP

const cache = new Map<string, RateLimitEntry>();

function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  // Fallback para desarrollo local / testing
  return 'unknown';
}

function isValidIP(ip: string): boolean {
  if (ip === 'unknown') return true;
  // IPv4 o IPv6 básica
  return /^[\d.:a-fA-F]+$/.test(ip) || ip.includes(':');
}

export function rateLimit(req: Request, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): RateLimitResult {
  const ip = getClientIP(req);
  const now = Date.now();
  const key = `${ip}`;

  const existing = cache.get(key);
  if (existing && existing.resetAt > now) {
    if (existing.count >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: existing.resetAt,
      };
    }
    existing.count += 1;
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - existing.count,
      reset: existing.resetAt,
    };
  }

  const resetAt = now + windowMs;
  cache.set(key, { count: 1, resetAt });

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - 1,
    reset: resetAt,
  };
}

/** Limpieza periódica de entradas expiradas (anti-fuga de memoria) */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.resetAt <= now) {
      cache.delete(key);
    }
  }
}, 60_000);

export { getClientIP, isValidIP };
