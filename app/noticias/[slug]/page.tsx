import ArticlePage from '@/components/ArticlePage';
import ViewTracker from '@/components/ViewTracker';
import { getNewsBySlug, getRelatedNews, getAllSlugs } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  buildNewsArticleJsonLdEnhanced,
  buildBreadcrumbJsonLdEnhanced,
} from '@/lib/seo/schema';
import { generateOptimizedTitle, validateTitle, type NoticiaTipo } from '@/lib/seo/title';
import { generateMetaDescription, generateKeywords, generateImageAlt } from '@/lib/seo/meta';

export const dynamic = 'force-static';
export const dynamicParams = true;
export const revalidate = 300;

const NOTICIA_TIPOS: ReadonlyArray<NoticiaTipo> = [
  'Tecnología',
  'Sucesos',
  'Salud',
  'Infraestructura',
  'Judicial',
  'Nacionales',
  'Deportes',
  'Internacionales',
  'Espectáculos',
  'General',
];

function toNoticiaTipo(value: string): NoticiaTipo {
  return NOTICIA_TIPOS.includes(value as NoticiaTipo) ? (value as NoticiaTipo) : 'General';
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs();
    if (slugs.length > 0) {
      return slugs.map((slug) => ({ slug }));
    }
  } catch {
    // Firebase falló, generaremos dinámicamente
  }
  return [];
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
    const category = noticia.categoria || 'General';
    const seoTipo = toNoticiaTipo(category);

    // SEO Title optimization
    const seoTitleResult = generateOptimizedTitle({
      tipo: seoTipo,
      tituloOriginal: noticia.titulo,
      lugar: 'Nicaragua',
      palabraClave: noticia.titulo.split(' ').slice(0, 3).join(' '),
      contexto: noticia.resumen?.substring(0, 40),
    });
    const titleValidation = validateTitle(seoTitleResult);
    const finalTitle = titleValidation.score >= 70 ? seoTitleResult : noticia.titulo;

    // Meta description
    const description = generateMetaDescription(noticia);
    const keywords = generateKeywords(noticia);
    const imageAlt = generateImageAlt(noticia);
    const authorName = noticia.autor || 'Redacción Nicaragua Informate';

    return {
      title: finalTitle,
      description,
      keywords,
      authors: [{ name: authorName }],
      alternates: { canonical: url },
      openGraph: {
        title: finalTitle,
        description,
        url,
        siteName: 'Nicaragua Informate',
        locale: 'es_NI',
        type: 'article',
        publishedTime: noticia.fecha,
        modifiedTime: noticia.fechaActualizacion || noticia.fecha,
        section: category,
        tags: keywords.split(', ').slice(0, 5),
        images: noticia.imagen
          ? [{ url: noticia.imagen, width: 1200, height: 630, alt: imageAlt }]
          : [{ url: 'https://nicaraguainformate.com/logo.webp', width: 1200, height: 630, alt: 'Nicaragua Informate' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: finalTitle,
        description,
        images: noticia.imagen ? [noticia.imagen] : ['https://nicaraguainformate.com/logo.webp'],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-snippet': -1,
          'max-image-preview': 'large',
          'max-video-preview': -1,
        },
      },
      other: {
        'article:author': authorName,
        'article:section': category,
        'article:published_time': noticia.fecha,
        'article:modified_time': noticia.fechaActualizacion || noticia.fecha,
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

    const related = await getRelatedNews(noticia.categoria, noticia.slug, 6);

    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;

    const wordCount = noticia.contenido
      ? noticia.contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length
      : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildNewsArticleJsonLdEnhanced(noticia, url, readingTime)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLdEnhanced(noticia.categoria, noticia.slug, noticia.titulo)) }} />
        <ViewTracker slug={noticia.slug} />
        <ArticlePage noticia={noticia} related={related} />
      </>
    );
  } catch (error) {
    console.error('Error cargando noticia:', error);
    return notFound();
  }
}
