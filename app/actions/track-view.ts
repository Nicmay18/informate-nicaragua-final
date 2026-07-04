'use server';

import { incrementViewsBySlug } from '@/lib/db/homepage';

export async function trackViewAction(slug: string) {
  try {
    const result = await incrementViewsBySlug(slug);
    return { ok: true, views: result };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Unknown error' };
  }
}
