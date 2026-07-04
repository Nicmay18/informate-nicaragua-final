'use server';

import { incrementViewsBySlug } from '@/lib/db/homepage';
import { headers } from 'next/headers';

// Rate limiting simple en memoria (producción: usar Redis/Vercel KV)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60_000; // 1 minuto
const MAX_REQUESTS = 5;   // máximo 5 vistas por artículo/IP/minuto

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_REQUESTS) return true;
  entry.count++;
  return false;
}

export async function trackViewAction(slug: string) {
  try {
    // Extraer IP real (funciona detrás de Vercel/Cloudflare)
    const h = await headers();
    const forwardedFor = h.get('x-forwarded-for') || '';
    const ip = forwardedFor.split(',')[0].trim() || 'unknown';
    const rateKey = `${ip}:${slug}`;

    if (isRateLimited(rateKey)) {
      return { ok: true, views: null, rateLimited: true };
    }

    const result = await incrementViewsBySlug(slug);

    return { ok: true, views: result };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Unknown error' };
  }
}
