import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { generateGoogleTrustReport } from '@/lib/nios/intelligence/google-trust';
import { generateContentRecoveryReport } from '@/lib/nios/intelligence/content-recovery';
import RecoveryQueueClient from '@/components/nios/RecoveryQueueClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'Recovery Queue | NIOS | Admin' },
  robots: { index: false, follow: false },
};

export default async function RecoveryQueuePage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const db = getAdminDb();
  const latest = await getLatestSnapshot(db);

  const articles = latest?.articlesFused || [];
  const trust = articles.length > 0 ? generateGoogleTrustReport(articles) : null;
  const trustMap = new Map<string, { googleTrustScore: number; risk: 'alto' | 'medio' | 'bajo' }>();
  if (trust) {
    for (const a of trust.articles) {
      trustMap.set(a.slug, { googleTrustScore: a.googleTrustScore, risk: a.risk });
    }
  }
  const recovery = articles.length > 0 ? generateContentRecoveryReport(articles, trustMap) : null;
  const snapshotDate = latest?.date || null;

  return (
    <RecoveryQueueClient
      recovery={recovery}
      snapshotDate={snapshotDate}
    />
  );
}
