import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getAdminDb } from '@/lib/firebase-admin';
import { loadEntityPage, generateEntitySchema } from '@/lib/meni/knowledge-base/entity-page';
import EntityPageClient from '@/components/knowledge-graph/EntityPageClient';
import { escapeJsonLd } from '@/lib/jsonld';

export const revalidate = 3600;

// generateMetadata y el componente llaman loadEntityPage en la MISMA
// request — sin dedupe cada regeneración ISR leía kb_* dos veces
// (~421 docs × 2, verificado en metrics_daily: entity.agua = 842 docs).
// React cache() memoiza por request: 1 ejecución, misma data.
const getEntityPage = cache((slug: string) =>
  loadEntityPage(getAdminDb(), slug, { lite: true }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEntityPage(slug);
  if (!data) {
    notFound();
  }

  const canonical = `https://nicaraguainformate.com/entidad/${slug}`;

  return {
    title: `${data.entity.name} | Nicaragua Informate`,
    description: data.entity.description || `Información sobre ${data.entity.name} en Nicaragua`,
    alternates: { canonical },
    // Entidades con cobertura mínima (<3 artículos) son páginas de apoyo
    // interno — noindex para no diluir la calidad indexable ante AdSense.
    robots: { index: (data.entity.articleCount ?? 0) >= 3, follow: true },
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
  const data = await getEntityPage(slug);

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
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd as Record<string, unknown>) }}
      />
      <EntityPageClient data={data} />
    </>
  );
}
