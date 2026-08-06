import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { generateGoogleTrustReport } from '@/lib/nios/intelligence/google-trust';
import { generateEditorCEOReport } from '@/lib/nios/intelligence/editor-ceo-report';
import { generateMeniLearningFeedback } from '@/lib/nios/intelligence/meni-learning';
import EditorialStrategyClient from '@/components/nios/EditorialStrategyClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'Editorial Strategy | NIOS | Admin' },
  robots: { index: false, follow: false },
};

export default async function EditorialStrategyPage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const db = getAdminDb();
  const latest = await getLatestSnapshot(db);

  const articles = latest?.articlesFused || [];
  const trust = articles.length > 0 ? generateGoogleTrustReport(articles) : null;
  const meniLearning = await generateMeniLearningFeedback(db, articles);

  const report = articles.length > 0 && trust
    ? generateEditorCEOReport(articles, latest?.gsc || null, latest?.ga4 || null, trust, meniLearning)
    : null;
  const snapshotDate = latest?.date || null;

  return (
    <EditorialStrategyClient
      report={report}
      snapshotDate={snapshotDate}
    />
  );
}
