import type { Metadata } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';
import { listAllEntities } from '@/lib/meni/knowledge-base/entity-page';
import EntityIndexClient from '@/components/knowledge-graph/EntityIndexClient';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Enciclopedia de Nicaragua | Nicaragua Informate',
  description: 'Base de conocimiento sobre personas, instituciones, lugares y temas de Nicaragua.',
};

export default async function EntityIndexPage() {
  const db = getAdminDb();
  const entities = await listAllEntities(db, 200);

  return <EntityIndexClient entities={entities} />;
}
