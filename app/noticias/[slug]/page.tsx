import ArticleClient from '@/components/ArticleClient';
import ProLayout from '@/components/ProLayout';
import { getNewsBySlug, getRelatedNews, getAllSlugs } from '@/lib/data';
import { isLutoNews } from '@/lib/types';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildNewsArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/schema';
import { isToxicSlug } from '@/lib/seo-toxic';

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
    if (!noticia) {
      return {
        title: 'Noticia no encontrada',
        robots: { index: false },
      };
    }
    const url = `https://nicaraguainformate.com/noticias/${slug}`;
    const excerpt = noticia.resumen || noticia.contenido?.substring(0, 160) + '...' || '';
    const category = noticia.categoria || 'Actualidad';
    const rawTags = noticia.tags;
    const tags = Array.isArray(rawTags) ? rawTags : [category, 'Nicaragua', 'noticias'];
    const authorName = noticia.autor || 'Redacción Nicaragua Informate';

    return {
      title: noticia.titulo,
      description: excerpt,
      keywords: tags.join(', '),
      authors: [{ name: authorName }],
      alternates: { canonical: url },
      openGraph: {
        title: noticia.titulo,
        description: excerpt,
        url,
        siteName: 'Nicaragua Informate',
        locale: 'es_NI',
        type: 'article',
        publishedTime: noticia.fecha,
        modifiedTime: noticia.fechaActualizacion || noticia.fecha,
        section: category,
        tags: tags,
        images: noticia.imagen
          ? [{ url: noticia.imagen, width: 1200, height: 630 }]
          : [{ url: 'https://nicaraguainformate.com/logo.png', width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: noticia.titulo,
        description: excerpt,
        images: noticia.imagen ? [noticia.imagen] : ['https://nicaraguainformate.com/logo.png'],
      },
      robots: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
      other: {
        'article:author': authorName,
        'article:section': category,
        'article:published_time': noticia.fecha,
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

    const wordCount = noticia.contenido
      ? noticia.contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length
      : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return (
      <ProLayout tickerText={noticia.titulo}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildNewsArticleJsonLd(noticia, url, readingTime)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(noticia.categoria)) }} />
        <ArticleClient noticia={noticia} related={related} isLuto={isLuto} />
      </ProLayout>
    );
  } catch (error) {
    console.error('Error cargando noticia:', error);
    return notFound();
  }
}
