import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdminDb } from '@/lib/firebase-admin';
import { listEntitiesPaginated, getEntityCount } from '@/lib/meni/knowledge-base/entity-page';
import EntityIndexClient from '@/components/knowledge-graph/EntityIndexClient';
import PaginationWrapper from '@/components/PaginationWrapper';
import { resolvePage } from '@/lib/pagination';

export const revalidate = 3600;

const SITE_URL = 'https://nicaraguainformate.com';
const ENTITY_PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: 'Enciclopedia de Nicaragua | Nicaragua Informate',
  description: 'Base de conocimiento sobre personas, instituciones, lugares y temas de Nicaragua.',
  alternates: { canonical: `${SITE_URL}/entidad` },
};

export default async function EntityIndexPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const sp = await (searchParams ?? Promise.resolve({} as { page?: string }));
  const db = getAdminDb();
  const requested = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const [entities, totalCount] = await Promise.all([
    listEntitiesPaginated(db, requested, ENTITY_PAGE_SIZE),
    getEntityCount(db),
  ]);
  // Página fuera de rango → 404 real (antes servía la última página con 200).
  const resolution = resolvePage(sp.page, totalCount, ENTITY_PAGE_SIZE);
  if (resolution.status === 'not_found') notFound();
  const { page: currentPage, totalPages } = resolution;

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
