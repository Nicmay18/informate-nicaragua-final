import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { buildGoogleIntelligenceDashboard } from '@/lib/nios/intelligence/dashboard';
import GoogleIntelligenceClient from '@/components/nios/GoogleIntelligenceClient';

export const metadata: Metadata = {
  title: { absolute: 'Google Intelligence | NIOS | Admin' },
  robots: { index: false, follow: false },
};

const getGoogleIntelligenceData = unstable_cache(async () => {
  const db = getAdminDb();
  const latest = await getLatestSnapshot(db);

  if (!latest) return null;

  const dashboard = buildGoogleIntelligenceDashboard(
    latest.articlesFused || [],
    latest.gsc,
    latest.ga4,
    latest.recommendations || [],
  );

  return {
    dashboard,
    compliance: latest.compliance || null,
    readiness: latest.readiness || null,
    snapshotDate: latest.date || null,
  };
}, ['nios-google-intelligence'], { revalidate: 300, tags: ['nios-snapshot'] });

export default async function GoogleIntelligencePage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const data = await getGoogleIntelligenceData();

  return (
    <GoogleIntelligenceClient
      dashboard={data?.dashboard || null}
      compliance={data?.compliance || null}
      readiness={data?.readiness || null}
      snapshotDate={data?.snapshotDate || null}
    />
  );
}
