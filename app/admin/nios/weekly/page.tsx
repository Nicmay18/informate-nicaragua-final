import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { generateGoogleTrustReport } from '@/lib/nios/intelligence/google-trust';
import { generateWeeklyReport } from '@/lib/nios/intelligence/weekly-report';
import WeeklyClient from '@/components/nios/WeeklyClient';

export const metadata: Metadata = {
  title: { absolute: 'NIOS Weekly | NIOS | Admin' },
  robots: { index: false, follow: false },
};

const getWeeklyData = unstable_cache(async () => {
  const db = getAdminDb();
  const latest = await getLatestSnapshot(db);

  if (!latest?.articlesFused) return null;

  const trust = generateGoogleTrustReport(latest.articlesFused);
  const weekly = latest.gsc
    ? generateWeeklyReport(latest.articlesFused, trust, latest.gsc)
    : null;

  return {
    weekly,
    trust,
    snapshotDate: latest.date || null,
  };
}, ['nios-weekly'], { revalidate: 300, tags: ['nios-snapshot'] });

export default async function WeeklyPage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const data = await getWeeklyData();

  return (
    <WeeklyClient
      weekly={data?.weekly || null}
      trust={data?.trust || null}
      snapshotDate={data?.snapshotDate || null}
    />
  );
}
