import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { getNewsPaginated, getNewsCount, PAGE_SIZE } from '@/lib/data';
import { categoryToSlug, slugToCategory } from '@/lib/types';
import { resolvePage } from '@/lib/pagination';
import type { Noticia } from '@/lib/types';
import PaginationWrapper from '@/components/PaginationWrapper';
import NoticiasList from '@/components/NoticiasList';
import { logger } from '@/lib/logger';

export const dynamicParams = true;
export const revalidate = 300;

const SITE_URL = 'https://nicaraguainformate.com';

// Dedup por request: generateMetadata y el componente consultan el mismo
// conteo sin disparar dos lecturas a Firestore.
const getNewsCountOnce = cache(getNewsCount);

/** Trunca descripción respetando límites de palabras para SERPs */
function smartTruncate(str: string, maxLen = 155): string {
  if (str.length <= maxLen) return str;
  const trimmed = str.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(' ');
  return lastSpace > 0 ? trimmed.slice(0, lastSpace) + '…' : trimmed + '…';
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }): Promise<Metadata> {
  const params = await searchParams;

  // 404 REAL: validar el rango ANTES de que el streaming comprometa el
  // status 200. notFound() aquí aborta el render con status 404.
  if (!params.cat) {
    let totalCount = 0;
    try {
      totalCount = await getNewsCountOnce();
    } catch {
      totalCount = 0;
    }
    if (resolvePage(params.page, totalCount, PAGE_SIZE).status === 'not_found') {
      notFound();
    }
  }

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

  // Política única de paginación: página inválida o fuera de rango → 404
  // (nunca servir otra página ni una lista vacía con 200).
  let totalCount = 0;
  try {
    totalCount = await getNewsCountOnce();
  } catch (error) {
    logger.error('[NoticiasPage] getNewsCount error:', error);
  }

  const resolution = resolvePage(params.page, totalCount, PAGE_SIZE);
  if (resolution.status === 'not_found') notFound();
  const currentPage = resolution.page;
  const totalPages = resolution.totalPages;

  let noticias: Noticia[] = [];
  try {
    noticias = await getNewsPaginated(currentPage, PAGE_SIZE);
  } catch (error) {
    logger.error('[NoticiasPage] Error:', error);
  }

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
        <NoticiasList noticias={noticias} />
      </PaginationWrapper>
    </>
  );
}
