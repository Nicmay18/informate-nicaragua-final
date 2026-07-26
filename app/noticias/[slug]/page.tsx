import '@/app/articulo.css';
import ArticlePage from '@/components/ArticlePage';
import { getNewsBySlug, getRelatedNews } from '@/lib/data';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  buildNewsArticleJsonLdEnhanced,
  buildBreadcrumbJsonLdEnhanced,
  generarFaqSchema,
} from '@/lib/seo/schema';
import { generateOptimizedTitle, validateTitle, type NoticiaTipo } from '@/lib/seo/title';
import { generateMetaDescription, generateKeywords, generateImageAlt } from '@/lib/seo/meta';
import { escapeJsonLd } from '@/lib/sanitize';
import { logger } from '@/lib/logger';
import { unstable_cache } from 'next/cache';

export const revalidate = 3600;
export const dynamicParams = true;

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

const getCachedNewsBySlug = unstable_cache(
  async (slug: string) => getNewsBySlug(slug),
  ['noticia-by-slug'],
  { revalidate: 3600, tags: ['noticias'] }
);

const getCachedRelated = unstable_cache(
  async (categoria: string, excludeSlug: string) => getRelatedNews(categoria, excludeSlug, 6),
  ['related-news'],
  { revalidate: 3600, tags: ['noticias'] }
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const noticia = await getCachedNewsBySlug(slug);
    if (!noticia || !noticia.titulo?.trim() || !noticia.contenido?.trim()) {
      notFound();
    }

    if (noticia.slug && noticia.slug !== slug) {
      permanentRedirect(`/noticias/${noticia.slug}`);
    }

    const normalizedSlug = noticia.slug || slug;
    const url = `https://nicaraguainformate.com/noticias/${normalizedSlug}`;
    const category = noticia.categoria || 'General';
    const seoTipo = toNoticiaTipo(category);

    const originalValidation = validateTitle(noticia.titulo);
    const seoTitleResult = generateOptimizedTitle({
      tipo: seoTipo,
      tituloOriginal: noticia.titulo,
      lugar: 'Nicaragua',
      palabraClave: noticia.titulo.split(' ').slice(0, 3).join(' '),
      contexto: noticia.resumen?.substring(0, 40),
    });
    const titleValidation = validateTitle(seoTitleResult);

    let finalTitle = originalValidation.score >= 70
      ? noticia.titulo
      : (titleValidation.score >= 70 ? seoTitleResult : noticia.titulo);

    if (finalTitle.length > 60) {
      const cutAt = finalTitle.lastIndexOf(' ', 57);
      finalTitle = cutAt > 0 ? finalTitle.slice(0, cutAt) + '…' : finalTitle.slice(0, 57) + '…';
    }

    const rawDescription = noticia.resumen?.trim()
      || noticia.metaDescription?.trim()
      || generateMetaDescription(noticia);
    let description = rawDescription;
    if (description.length > 160) {
      const cutAt = description.lastIndexOf(' ', 157);
      description = cutAt > 0 ? description.slice(0, cutAt) + '…' : description.slice(0, 157) + '…';
    }
    const keywords = noticia.keywords?.trim() || generateKeywords(noticia);
    const imageAlt = generateImageAlt(noticia);
    const authorName = noticia.autor || 'Redacción Nicaragua Informate';

    const shouldNoindex = noticia.noindex === true;
    const socialTitle = noticia.titulo || finalTitle;

    const absoluteImage = noticia.imagen
      ? (noticia.imagen.startsWith('http') ? noticia.imagen : `https://nicaraguainformate.com${noticia.imagen}`)
      : 'https://nicaraguainformate.com/logo.webp';

    return {
      title: { absolute: finalTitle },
      description,
      authors: [{ name: authorName }],
      alternates: { canonical: url },
      openGraph: {
        title: socialTitle,
        description,
        url,
        siteName: 'Nicaragua Informate',
        locale: 'es_NI',
        type: 'article',
        publishedTime: noticia.fecha,
        modifiedTime: noticia.fechaActualizacion || noticia.fecha,
        section: category,
        images: [{ url: absoluteImage, width: 1200, height: 630, alt: imageAlt }],
      },
      twitter: {
        card: 'summary_large_image',
        title: socialTitle,
        description,
        images: [absoluteImage],
      },
      robots: shouldNoindex
        ? { index: false, follow: false }
        : {
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
        keywords: keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
      },
    };
  } catch (err) {
    logger.error('[article-metadata] Error generando metadata:', err);
    notFound();
  }
}

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let noticia: Awaited<ReturnType<typeof getNewsBySlug>> = null;
  let related: Awaited<ReturnType<typeof getRelatedNews>> = [];

  try {
    noticia = await getCachedNewsBySlug(slug);
  } catch (error) {
    logger.error('Error cargando noticia:', error);
    notFound();
  }

  if (!noticia || !noticia.titulo?.trim() || !noticia.contenido?.trim()) return notFound();

  if (noticia.slug && noticia.slug !== slug) {
    permanentRedirect(`/noticias/${noticia.slug}`);
  }

  try {
    related = await getCachedRelated(noticia.categoria, noticia.slug);
  } catch (error) {
    logger.error('Error cargando relacionadas:', error);
    related = [];
  }

  const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;

  const wordCount = noticia.contenido
    ? noticia.contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length
    : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const faqSchema = generarFaqSchema(noticia.contenido || '', noticia.resumen);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(buildNewsArticleJsonLdEnhanced(noticia, url, readingTime)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(buildBreadcrumbJsonLdEnhanced(noticia.categoria, noticia.slug, noticia.titulo)) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(faqSchema) }} />
      )}
      <ArticlePage noticia={noticia} related={related} />
    </>
  );
}
