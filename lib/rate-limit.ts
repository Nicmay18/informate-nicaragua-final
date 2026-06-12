/**
 * Rate Limiter nativo usando Map + timestamps.
 * Alternativa ligera a lru-cache. Limpia entradas expiradas cada 100 requests.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  intervalMs?: number;    // ventana de tiempo (default: 60s)
  maxRequests?: number;     // máximo de requests por ventana (default: 10)
  cleanupThreshold?: number; // limpiar entradas viejas cada N requests (default: 100)
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private totalChecks = 0;
  private readonly intervalMs: number;
  private readonly maxRequests: number;
  private readonly cleanupThreshold: number;

  constructor(options: RateLimitOptions = {}) {
    this.intervalMs = options.intervalMs ?? 60_000;
    this.maxRequests = options.maxRequests ?? 10;
    this.cleanupThreshold = options.cleanupThreshold ?? 100;
  }

  check(token: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    this.totalChecks++;

    // Cleanup periódico para evitar memory leak
    if (this.totalChecks >= this.cleanupThreshold) {
      this.cleanup(now);
      this.totalChecks = 0;
    }

    const entry = this.store.get(token);

    if (!entry || now > entry.resetAt) {
      // Nueva ventana o ventana expirada
      const newEntry: RateLimitEntry = { count: 1, resetAt: now + this.intervalMs };
      this.store.set(token, newEntry);
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: newEntry.resetAt };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: this.maxRequests - entry.count, resetAt: entry.resetAt };
  }

  private cleanup(now: number): void {
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

/** Singleton global para uso en API Routes */
export const defaultRateLimiter = new RateLimiter();
