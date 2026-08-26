/**
 * Admin API — Facebook → Web Conversion Intelligence
 * Expone el funnel completo y el veredicto sin inventar datos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorized } from '@/lib/auth';
import {
  buildSocialConversionVerdict,
  buildSocialWebFunnel,
  fetchFacebookSnapshot,
} from '@/lib/nios/intelligence/social-conversion';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  try {
    const [facebook, snapshot] = await Promise.all([
      fetchFacebookSnapshot(),
      getLatestSnapshot(getAdminDb()),
    ]);

    const input = {
      facebook,
      ga4: snapshot?.ga4 || null,
      traffic: snapshot?.trafficPerformance || null,
      articles: snapshot?.articlesFused || [],
    };

    const verdict = buildSocialConversionVerdict(input);
    const funnel = buildSocialWebFunnel(input);

    return NextResponse.json({
      ok: true,
      collectedAt: new Date().toISOString(),
      facebook: {
        status: facebook?.status ?? 'NOT_CONFIGURED',
        summary: facebook?.status === 'REAL'
          ? `Alcance ${funnel.reach?.value ?? 0} / clics ${funnel.linkClicks?.value ?? 0}`
          : (facebook?.errorMessage || 'Meta no configurado o sin datos.'),
      },
      funnel,
      verdict,
      definitions: {
        reach: funnel.reach?.definition,
        linkClicks: funnel.linkClicks?.definition,
        webSessions: funnel.webSessions?.definition,
        articleViews: funnel.articleViews?.definition,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Error interno de social-conversion' },
      { status: 500 },
    );
  }
}
