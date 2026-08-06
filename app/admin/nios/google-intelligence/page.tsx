import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { buildGoogleIntelligenceDashboard } from '@/lib/nios/intelligence/dashboard';
import GoogleIntelligenceClient from '@/components/nios/GoogleIntelligenceClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'Google Intelligence | NIOS | Admin' },
  robots: { index: false, follow: false },
};

export default async function GoogleIntelligencePage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const db = getAdminDb();
  const latest = await getLatestSnapshot(db);

  const dashboard = latest
    ? buildGoogleIntelligenceDashboard(
        latest.articlesFused || [],
        latest.gsc,
        latest.ga4,
        latest.recommendations || [],
      )
    : null;

  const compliance = latest?.compliance || null;
  const readiness = latest?.readiness || null;
  const snapshotDate = latest?.date || null;

  return (
    <GoogleIntelligenceClient
      dashboard={dashboard}
      compliance={compliance}
      readiness={readiness}
      snapshotDate={snapshotDate}
    />
  );
}
