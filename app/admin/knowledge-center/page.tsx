import type { Metadata } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';
import { getKnowledgeHealth } from '@/lib/meni/knowledge-base/knowledge-health';
import { detectBusinessOpportunities } from '@/lib/meni/knowledge-base/business-value';
import KnowledgeCenterClient from '@/components/knowledge-graph/KnowledgeCenterClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Knowledge Center | Nicaragua Informate',
  robots: { index: false, follow: false },
};

export default async function KnowledgeCenterPage() {
  const db = getAdminDb();
  const [health, opportunities] = await Promise.all([
    getKnowledgeHealth(db),
    detectBusinessOpportunities(db),
  ]);

  return <KnowledgeCenterClient health={health} opportunities={opportunities} />;
}
