import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { generateAdSenseRecoveryFullReport } from '@/lib/nios/intelligence/adsense-recovery-report';
import AdSenseReportClient from '@/components/nios/AdSenseReportClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'AdSense Recovery Report | NIOS | Admin' },
  robots: { index: false, follow: false },
};

export default async function AdSenseReportPage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const db = getAdminDb();
  const latest = await getLatestSnapshot(db);

  const articles = latest?.articlesFused || [];
  const ga4 = latest?.ga4
    ? {
        totalUsers: latest.ga4.totalUsers,
        averageEngagementTimeSec: latest.ga4.averageEngagementTimeSec,
        devices: latest.ga4.devices,
      }
    : null;

  const report = articles.length > 0
    ? await generateAdSenseRecoveryFullReport(articles, ga4)
    : null;
  const snapshotDate = latest?.date || null;

  return (
    <AdSenseReportClient
      report={report}
      snapshotDate={snapshotDate}
    />
  );
}
