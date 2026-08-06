import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { generateGoogleTrustReport } from '@/lib/nios/intelligence/google-trust';
import { generateWeeklyReport } from '@/lib/nios/intelligence/weekly-report';
import WeeklyClient from '@/components/nios/WeeklyClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'NIOS Weekly | NIOS | Admin' },
  robots: { index: false, follow: false },
};

export default async function WeeklyPage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const db = getAdminDb();
  const latest = await getLatestSnapshot(db);

  const trust = latest?.articlesFused
    ? generateGoogleTrustReport(latest.articlesFused)
    : null;
  const weekly = trust && latest?.articlesFused && latest?.gsc
    ? generateWeeklyReport(latest.articlesFused, trust, latest.gsc)
    : null;
  const snapshotDate = latest?.date || null;

  return (
    <WeeklyClient
      weekly={weekly}
      trust={trust}
      snapshotDate={snapshotDate}
    />
  );
}
