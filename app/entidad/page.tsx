import type { Metadata } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';
import { listEntitiesPaginated, getEntityCount } from '@/lib/meni/knowledge-base/entity-page';
import EntityIndexClient from '@/components/knowledge-graph/EntityIndexClient';
import PaginationWrapper from '@/components/PaginationWrapper';

export const revalidate = 3600;

const ENTITY_PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: 'Enciclopedia de Nicaragua | Nicaragua Informate',
  description: 'Base de conocimiento sobre personas, instituciones, lugares y temas de Nicaragua.',
};

export default async function EntityIndexPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const sp = await (searchParams ?? Promise.resolve({} as { page?: string }));
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const db = getAdminDb();
  const [entities, totalCount] = await Promise.all([
    listEntitiesPaginated(db, page, ENTITY_PAGE_SIZE),
    getEntityCount(db),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / ENTITY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <PaginationWrapper
      basePath="/entidad"
      currentPage={currentPage}
      totalPages={totalPages}
    >
      <EntityIndexClient entities={entities} />
    </PaginationWrapper>
  );
}
