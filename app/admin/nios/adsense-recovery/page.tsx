import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { generateAdSenseRecoveryReport } from '@/lib/nios/intelligence/adsense-recovery';
import { generateGoogleTrustReport } from '@/lib/nios/intelligence/google-trust';
import AdSenseRecoveryClient from '@/components/nios/AdSenseRecoveryClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'AdSense Recovery | NIOS | Admin' },
  robots: { index: false, follow: false },
};

export default async function AdSenseRecoveryPage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const db = getAdminDb();
  const latest = await getLatestSnapshot(db);

  const trust = latest?.articlesFused
    ? generateGoogleTrustReport(latest.articlesFused)
    : null;
  const recovery = trust && latest?.articlesFused
    ? generateAdSenseRecoveryReport(latest.articlesFused, trust)
    : null;
  const snapshotDate = latest?.date || null;

  return (
    <AdSenseRecoveryClient
      recovery={recovery}
      trust={trust}
      snapshotDate={snapshotDate}
    />
  );
}
