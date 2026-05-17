import ArticleClient from '@/components/ArticleClient';
import ProLayout from '@/components/ProLayout';
import { getNewsBySlug, getRelatedNews, getAllSlugs } from '@/lib/data';
import { isLutoNews } from '@/lib/types';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildNewsArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/schema';
import { isToxicSlug } from '@/lib/seo-toxic';

export const dynamic = 'force-static';
export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs();
    return slugs.filter((s) => !isToxicSlug(s)).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const noticia = await getNewsBySlug(slug);
    if (!noticia) return {};
    const url = `https://www.nicaraguainformate.com/noticias/${slug}`;
    return {
      title: noticia.titulo,
      description: noticia.resumen,
      alternates: { canonical: url },
      openGraph: {
        title: noticia.titulo,
        description: noticia.resumen,
        url,
        images: noticia.imagen ? [{ url: noticia.imagen }] : undefined,
        type: 'article',
      },
    };
  } catch {
    return {};
  }
}

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const noticia = await getNewsBySlug(slug);
    if (!noticia) return notFound();

    const isLuto = isLutoNews(noticia);
    const related = await getRelatedNews(noticia.categoria, noticia.slug, 4);
    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;

    return (
      <ProLayout tickerText={noticia.titulo}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildNewsArticleJsonLd(noticia, url)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(noticia.categoria)) }} />
        <ArticleClient noticia={noticia} related={related} isLuto={isLuto} />
      </ProLayout>
    );
  } catch (error) {
    console.error('Error cargando noticia:', error);
    return notFound();
  }
}
