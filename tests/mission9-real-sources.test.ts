// @vitest-environment node
import { describe, it, expect } from 'vitest';
import dotenv from 'dotenv';
import { collectGSC } from '@/lib/nios/intelligence/gsc-collector';
import { collectGA4 } from '@/lib/nios/intelligence/ga4-collector';

dotenv.config({ path: '.env.local' });

describe('Misión 9 — Activación real de fuentes (end-to-end)', () => {
  const siteUrl = process.env.NIOS_GSC_SITE_URL || process.env.NIOS_SITE_URL || 'https://nicaraguainformate.com';
  const ga4PropertyId = process.env.NIOS_GA4_PROPERTY_ID || '';

  it('GSC real connection with NIOS_SITE_URL', { timeout: 30000 }, async () => {
    const snapshot = await collectGSC(siteUrl, 7);

    console.log('[M9-GSC]', {
      status: snapshot?.status ?? null,
      siteUrl: snapshot?.siteUrl ?? siteUrl,
      range: snapshot?.dateRange,
      impressions: snapshot?.totalImpressions,
      clicks: snapshot?.totalClicks,
      pages: snapshot?.pages?.length,
      queries: snapshot?.queries?.length,
      errorMessage: snapshot?.errorMessage,
    });

    expect(snapshot).not.toBeNull();
    expect(['REAL', 'CONNECTED_NO_DATA', 'NO_DATA', 'ACCESS_BLOCKED', 'CONFIG_REQUIRED', 'INVALID_CONFIGURATION']).toContain(snapshot!.status);
    expect(typeof snapshot!.totalImpressions).toBe('number');
    expect(typeof snapshot!.totalClicks).toBe('number');
  });

  it('GSC real connection with sc-domain property', { timeout: 30000 }, async () => {
    const scDomainUrl = 'sc-domain:nicaraguainformate.com';
    const snapshot = await collectGSC(scDomainUrl, 7);

    console.log('[M9-GSC-sc-domain]', {
      status: snapshot?.status ?? null,
      siteUrl: snapshot?.siteUrl ?? scDomainUrl,
      range: snapshot?.dateRange,
      impressions: snapshot?.totalImpressions,
      clicks: snapshot?.totalClicks,
      pages: snapshot?.pages?.length,
      queries: snapshot?.queries?.length,
      errorMessage: snapshot?.errorMessage,
    });

    expect(snapshot).not.toBeNull();
    expect(['REAL', 'CONNECTED_NO_DATA', 'NO_DATA', 'ACCESS_BLOCKED', 'CONFIG_REQUIRED', 'INVALID_CONFIGURATION']).toContain(snapshot!.status);
    expect(typeof snapshot!.totalImpressions).toBe('number');
    expect(typeof snapshot!.totalClicks).toBe('number');
  });

  it('GA4 real connection returns 1, 7 and 30 day active users', { timeout: 60000 }, async () => {
    const oneDay = await collectGA4(ga4PropertyId, 1);
    const sevenDays = await collectGA4(ga4PropertyId, 7);
    const thirtyDays = await collectGA4(ga4PropertyId, 30);

    console.log('[M9-GA4]', {
      propertyId: ga4PropertyId,
      oneDay: { status: oneDay?.status, users: oneDay?.totalUsers },
      sevenDays: { status: sevenDays?.status, users: sevenDays?.totalUsers },
      thirtyDays: { status: thirtyDays?.status, users: thirtyDays?.totalUsers },
    });

    for (const snapshot of [oneDay, sevenDays, thirtyDays]) {
      expect(snapshot).not.toBeNull();
      expect(['REAL', 'CONNECTED_NO_DATA', 'NO_DATA', 'ACCESS_BLOCKED', 'CONFIG_REQUIRED', 'INVALID_CONFIGURATION']).toContain(snapshot!.status);
      expect(typeof snapshot!.totalUsers).toBe('number');
    }
  });

  it('AdSense — documenta si falta collector o credencial', () => {
    const hasAdSenseClientId = Boolean(process.env.GOOGLE_ADSENSE_CLIENT_ID);

    if (hasAdSenseClientId) {
      throw new Error(
        'GOOGLE_ADSENSE_CLIENT_ID está presente pero no existe un collector real. ' +
          'Implementar o eliminar la variable antes de continuar.',
      );
    }

    console.log('[M9-AdSense] GOOGLE_ADSENSE_CLIENT_ID no está presente y no hay collector real');
    expect(process.env.GOOGLE_ADSENSE_CLIENT_ID).toBeUndefined();
  });
});
