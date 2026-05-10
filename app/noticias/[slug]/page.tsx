import ArticleClient from '@/components/ArticleClient';
import { getNewsBySlug } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildNewsArticleJsonLd } from '@/lib/schema';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
// SOLUCION FINAL
export const revalidate = 0;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const baseUrl = 'https://nicaraguainformate.com';
  const url = `${baseUrl}/noticias/${params.slug}`;

  try {
    const noticia = await getNewsBySlug(params.slug);
    if (!noticia) {
      return {
        title: 'Noticia no encontrada | Nicaragua Informate',
        robots: 'noindex, nofollow',
      };
    }

    const title = noticia.titulo || 'Noticia | Nicaragua Informate';
    const description = (noticia.resumen || '').slice(0, 155) || 'Noticias de Nicaragua en tiempo real.';
    const image = noticia.imagen || `${baseUrl}/logo.png`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'article',
        locale: 'es_NI',
        url,
        siteName: 'Nicaragua Informate',
        title,
        description,
        images: [{ url: image }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: 'Noticia | Nicaragua Informate',
      alternates: { canonical: url },
    };
  }
}

export default async function NewsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  try {
    const noticia = await getNewsBySlug(slug);

    if (!noticia) {
      return notFound();
    }

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildNewsArticleJsonLd(noticia, url)) }} />
        <ArticleClient noticia={noticia} />
      </>
    );
  } catch (error) {
    console.error('Error cargando noticia:', error);
    return notFound();
  }
}
