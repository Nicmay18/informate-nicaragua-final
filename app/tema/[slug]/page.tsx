import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TopicPageClient from '@/components/TopicPageClient';
import PaginationWrapper from '@/components/PaginationWrapper';
import { getCachedTemaBySlug, getCachedTemaArticlesPaginated, getTemaFeatured, getTemaEvergreen } from '@/lib/topics';
import { buildCollectionPageJsonLd, buildBreadcrumbJsonLdEnhanced } from '@/lib/seo/schema';
import { escapeJsonLd } from '@/lib/jsonld';
import { getCspNonce } from '@/lib/nonce';

const SITE_URL = 'https://nicaraguainformate.com';
const TEMA_PAGE_SIZE = 12;

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tema = await getCachedTemaBySlug(slug);
  if (!tema) notFound();

  const url = `${SITE_URL}/tema/${slug}`;
  const title = `${tema.name} | Nicaragua Informate`;

  return {
    title,
    description: tema.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: 'es_NI',
      url,
      siteName: 'Nicaragua Informate',
      title,
      description: tema.description,
      images: [{ url: `${SITE_URL}/logo.webp`, width: 512, height: 512, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: tema.description,
      images: [`${SITE_URL}/logo.webp`],
    },
  };
}

export default async function TemaPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const sp = await (searchParams ?? Promise.resolve({} as { page?: string }));
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const tema = await getCachedTemaBySlug(slug);
  if (!tema) notFound();

  const { articles: noticias, total } = await getCachedTemaArticlesPaginated(slug, page, TEMA_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / TEMA_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const featured = getTemaFeatured(noticias);
  const evergreen = getTemaEvergreen(tema);

  const url = `${SITE_URL}/tema/${slug}`;
  const nonce = await getCspNonce();

  const collectionSchema = buildCollectionPageJsonLd({
    name: tema.name,
    description: tema.description,
    url,
    items: noticias.slice(0, 10).map((n) => ({
      '@type': 'ListItem',
      url: `${SITE_URL}/noticias/${n.slug}`,
      name: n.titulo,
    })),
  });

  const breadcrumb = buildBreadcrumbJsonLdEnhanced('Temas', slug, tema.name);

  return (
    <>
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: escapeJsonLd(collectionSchema) }} />
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: escapeJsonLd(breadcrumb) }} />
      <PaginationWrapper
        basePath={`/tema/${slug}`}
        currentPage={currentPage}
        totalPages={totalPages}
      >
        <TopicPageClient
          tema={tema}
          noticias={noticias}
          featured={featured}
          evergreen={evergreen}
        />
      </PaginationWrapper>
    </>
  );
}
