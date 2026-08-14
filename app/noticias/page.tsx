import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getNewsPaginated, getNewsCount, getMasLeidas, PAGE_SIZE } from '@/lib/data';
import { categoryToSlug, slugToCategory } from '@/lib/types';
import type { Noticia } from '@/lib/types';
import type { HomePageData } from '@/lib/db/homepage';
import PaginationWrapper from '@/components/PaginationWrapper';
import HomePagePro from '@/components/HomePagePro';

export const dynamicParams = true;
export const revalidate = 300;

const SITE_URL = 'https://nicaraguainformate.com';

/** Trunca descripción respetando límites de palabras para SERPs */
function smartTruncate(str: string, maxLen = 155): string {
  if (str.length <= maxLen) return str;
  const trimmed = str.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(' ');
  return lastSpace > 0 ? trimmed.slice(0, lastSpace) + '…' : trimmed + '…';
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const pageNum = parseInt(params.page || '1', 10) || 1;
  const canonical = pageNum > 1
    ? `${SITE_URL}/noticias?page=${pageNum}`
    : `${SITE_URL}/noticias`;

  const rawTitle = 'Todas las Noticias';
  const title = pageNum > 1 ? `${rawTitle} — Página ${pageNum}` : rawTitle;
  const description = smartTruncate('Últimas noticias de Nicaragua. Cobertura nacional e internacional verificada desde Managua.');

  const meta: Metadata = {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'es_NI',
      url: canonical,
      siteName: 'Nicaragua Informate',
      title,
      description,
      images: [{ url: `${SITE_URL}/logo.webp`, width: 512, height: 512, alt: 'Nicaragua Informate' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/logo.webp`],
    },
  };

  if (pageNum > 1) {
    meta.robots = { index: false, follow: true };
  }

  return meta;
}

export default async function NoticiasPage({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }) {
  const params = await searchParams;

  if (params.cat) {
    const raw = String(params.cat);
    const catSlug = categoryToSlug(raw);
    const catName = slugToCategory(catSlug);
    if (catName) {
      permanentRedirect(`/categoria/${categoryToSlug(catName)}`);
    }
    notFound();
  }

  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);

  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];
  let totalCount = 0;
  try {
    [noticias, masLeidas, totalCount] = await Promise.all([
      getNewsPaginated(page, PAGE_SIZE),
      getMasLeidas(),
      getNewsCount(),
    ]);
  } catch (error) {
    console.error('[NoticiasPage] Error:', error);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const [hero, ...rest] = noticias;
  const homeData: HomePageData = {
    hero: hero ?? null,
    ultimas: rest,
    enPortada: [],
    breaking: [],
    porCategoria: {},
    masLeidas,
  };

  return (
    <>
      <nav className="ni-breadcrumbs" aria-label="Miga de pan" style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px 0' }}>
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>Todas las noticias</span>
      </nav>
      <PaginationWrapper
        basePath="/noticias"
        currentPage={currentPage}
        totalPages={totalPages}
      >
        <HomePagePro data={homeData} />
      </PaginationWrapper>
    </>
  );
}
