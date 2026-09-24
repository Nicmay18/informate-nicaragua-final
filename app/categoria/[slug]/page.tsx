import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import CategoryPagePro from '@/components/CategoryPagePro';
import PaginationWrapper from '@/components/PaginationWrapper';
import { getCategoryPaginated, getCategoryCount, PAGE_SIZE } from '@/lib/data';
import { slugToCategory, categoryToSlug } from '@/lib/types';
import { resolvePage } from '@/lib/pagination';
import type { Noticia } from '@/lib/types';
import { logger } from '@/lib/logger';

const SITE_URL = 'https://nicaraguainformate.com';

const CATEGORIA_META: Record<string, { titulo: string; description: string }> = {
  sucesos: {
    titulo: 'Sucesos en Nicaragua | Policiales y Accidentes Hoy',
    description: 'Reportes de sucesos en Nicaragua: accidentes de tránsito, hechos policiales y emergencias en tiempo real.',
  },
  nacionales: {
    titulo: 'Noticias Nacionales de Nicaragua | Actualidad y Sociedad',
    description: 'Entérate de lo último en Nicaragua: noticias nacionales, economía, infraestructura y desarrollo social. Cobertura actualizada desde Managua.',
  },
  internacionales: {
    titulo: 'Noticias Internacionales | Centroamérica y el Mundo',
    description: 'Lo que pasa fuera de Nicaragua: noticias de Centroamérica, Estados Unidos, Europa y el resto del mundo.',
  },
  tecnologia: {
    titulo: 'Tecnología en Nicaragua | Innovación y Digital',
    description: 'Avances tecnológicos en Nicaragua: internet, telecomunicaciones, startups y transformación digital.',
  },
  deportes: {
    titulo: 'Deportes en Nicaragua | Fútbol, Béisbol y Atletismo',
    description: 'Resultados, fichajes y noticias del deporte nicaragüense. Liga Primera, selección nacional y eventos deportivos.',
  },
  espectaculos: {
    titulo: 'Espectáculos en Nicaragua | Farándula y Entretenimiento',
    description: 'Noticias de espectáculos en Nicaragua: farándula, música, cine, televisión y eventos culturales.',
  },
};

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = await (searchParams ?? Promise.resolve({} as { page?: string }));
  const slugLower = slug.toLowerCase();
  const slugNormalized = categoryToSlug(slug);
  const catName = slugToCategory(slugNormalized);
  if (!catName) notFound();

  const canonicalSlug = categoryToSlug(catName);
  if (canonicalSlug !== slugLower) {
    permanentRedirect(`/categoria/${canonicalSlug}`);
  }

  // 404 REAL: página fuera de rango debe abortar en metadata, antes de que
  // el streaming comprometa el status 200.
  {
    let totalCount = 0;
    try {
      totalCount = await getCategoryCount(catName);
    } catch {
      totalCount = 0;
    }
    if (resolvePage(sp.page, totalCount, PAGE_SIZE).status === 'not_found') {
      notFound();
    }
  }

  const meta = CATEGORIA_META[slugLower] || {
    titulo: `${catName} | Noticias de Nicaragua`,
    description: `Últimas noticias de ${catName} en Nicaragua Informate.`,
  };

  const canonicalUrl = `${SITE_URL}/categoria/${slugLower}`;
  let hasContent = true;
  try {
    hasContent = (await getCategoryCount(catName)) > 0;
  } catch {
    hasContent = false;
  }

  return {
    title: meta.titulo,
    description: meta.description,
    alternates: { canonical: canonicalUrl },
    robots: hasContent ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      locale: 'es_NI',
      url: canonicalUrl,
      siteName: 'Nicaragua Informate',
      title: meta.titulo,
      description: meta.description,
      images: [{ url: `${SITE_URL}/logo.webp`, width: 512, height: 512, alt: 'Nicaragua Informate' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.titulo,
      description: meta.description,
      images: [`${SITE_URL}/logo.webp`],
    },
  };
}

export default async function CategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await (searchParams ?? Promise.resolve({} as { page?: string }));
  const slugLower = slug.toLowerCase();
  const slugNormalized = categoryToSlug(slug);
  const catName = slugToCategory(slugNormalized);
  if (!catName) return notFound();

  const canonicalSlug = categoryToSlug(catName);
  if (canonicalSlug !== slugLower) {
    permanentRedirect(`/categoria/${canonicalSlug}`);
  }

  // Política única de paginación: página inválida o fuera de rango → 404.
  let totalCount = 0;
  try {
    totalCount = await getCategoryCount(catName);
  } catch (error) {
    logger.error('[CategoriaPage] getCategoryCount error:', error);
    notFound();
  }

  const resolution = resolvePage(sp.page, totalCount, PAGE_SIZE);
  if (resolution.status === 'not_found') notFound();
  const currentPage = resolution.page;
  const totalPages = resolution.totalPages;

  let noticias: Noticia[] = [];
  try {
    noticias = await getCategoryPaginated(catName, currentPage, PAGE_SIZE);
  } catch (error) {
    logger.error('[CategoriaPage] Error:', error);
    notFound();
  }

  return (
    <PaginationWrapper
      basePath={`/categoria/${slugLower}`}
      currentPage={currentPage}
      totalPages={totalPages}
    >
      <CategoryPagePro noticias={noticias} categoryName={catName} categorySlug={slugLower} page={currentPage} />
    </PaginationWrapper>
  );
}
