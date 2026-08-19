import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdminDb } from '@/lib/firebase-admin';
import { loadEntityPage, generateEntitySchema } from '@/lib/meni/knowledge-base/entity-page';
import EntityPageClient from '@/components/knowledge-graph/EntityPageClient';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const db = getAdminDb();
  const data = await loadEntityPage(db, slug);
  if (!data) {
    notFound();
  }

  const canonical = `https://nicaraguainformate.com/entidad/${slug}`;

  return {
    title: `${data.entity.name} | Nicaragua Informate`,
    description: data.entity.description || `Información sobre ${data.entity.name} en Nicaragua`,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${data.entity.name} | Nicaragua Informate`,
      description: data.entity.description || '',
      url: canonical,
    },
  };
}

export default async function EntityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getAdminDb();
  const data = await loadEntityPage(db, slug);

  if (!data) notFound();

  const schema = generateEntitySchema(data.entity);

  const jsonLd = {
    ...schema,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://nicaraguainformate.com/entidad/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EntityPageClient data={data} />
    </>
  );
}
