import ArticlePage from '@/components/ArticlePage';
import { getNewsBySlug, getRelatedNews, getAllSlugs } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import {
  buildNewsArticleJsonLdEnhanced,
  buildBreadcrumbJsonLdEnhanced,
  generarFaqSchema,
} from '@/lib/seo/schema';
import { generateOptimizedTitle, validateTitle, type NoticiaTipo } from '@/lib/seo/title';
import { generateMetaDescription, generateKeywords, generateImageAlt } from '@/lib/seo/meta';
import { escapeJsonLd } from '@/lib/sanitize';

const cachedGetNewsBySlug = unstable_cache(
  async (slug: string) => getNewsBySlug(slug),
  ['news-by-slug'],
  { revalidate: 300 }
);

const cachedGetRelatedNews = unstable_cache(
  async (category: string, slug: string, limit: number) => getRelatedNews(category, slug, limit),
  ['related-news'],
  { revalidate: 600 }
);
export const dynamicParams = true; // Permite generar nuevos slugs bajo demanda
export const revalidate = 60; // ISR: revalida cada 60s para frescura Google News

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
      // Limitar a 100 para evitar timeout en build de Vercel
      return slugs.slice(0, 100).map((slug) => ({ slug }));
    }
  } catch {
    // Firebase falló, ISR fallback generará dinámicamente
  }
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const noticia = await cachedGetNewsBySlug(slug);
    if (!noticia) {
      return {
        title: 'Noticia no encontrada',
        robots: { index: false },
      };
    }

    // Slug obsoleto: redirigir al canonical en lugar de servir metadatos duplicados
    if (noticia.slug && noticia.slug !== slug) {
      redirect(`/noticias/${noticia.slug}`);
    }

    const normalizedSlug = noticia.slug || slug;
    const url = `https://nicaraguainformate.com/noticias/${normalizedSlug}`;
    const category = noticia.categoria || 'General';
    const seoTipo = toNoticiaTipo(category);

    // SEO Title optimization (máx 60 chars para evitar truncamiento en SERPs)
    const seoTitleResult = generateOptimizedTitle({
      tipo: seoTipo,
      tituloOriginal: noticia.titulo,
      lugar: 'Nicaragua',
      palabraClave: noticia.titulo.split(' ').slice(0, 3).join(' '),
      contexto: noticia.resumen?.substring(0, 40),
    });
    const titleValidation = validateTitle(seoTitleResult);
    const finalTitle = titleValidation.score >= 70 ? seoTitleResult : noticia.titulo;

    // Meta description: truncado inteligente respetando palabras completas (140-160 chars óptimo para SERPs)
    const rawDescription = noticia.metaDescription?.trim() || generateMetaDescription(noticia);
    let description = rawDescription;
    if (description.length > 160) {
      const cutAt = description.lastIndexOf(' ', 157);
      description = cutAt > 0 ? description.slice(0, cutAt) + '…' : description.slice(0, 157) + '…';
    }
    const keywords = noticia.keywords?.trim() || generateKeywords(noticia);
    const imageAlt = generateImageAlt(noticia);
    const authorName = noticia.autor || 'Redacción Nicaragua Informate';

    const shouldNoindex = noticia.noindex === true;

    return {
      title: finalTitle,
      description,
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
        images: noticia.imagen
          ? [{ url: noticia.imagen, width: 1200, height: 630, alt: imageAlt }]
          : [{ url: 'https://nicaraguainformate.com/logo.webp', width: 512, height: 512, alt: 'Nicaragua Informate' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: finalTitle,
        description,
        images: noticia.imagen ? [noticia.imagen] : ['https://nicaraguainformate.com/logo.webp'],
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
  } catch {
    return {};
  }
}

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const noticia = await cachedGetNewsBySlug(slug);
    if (!noticia) return notFound();

    // Si el slug en Firestore es diferente de la URL, redirigir 301 al canonical
    if (noticia.slug && noticia.slug !== slug) {
      redirect(`/noticias/${noticia.slug}`);
    }

    const related = await cachedGetRelatedNews(noticia.categoria, noticia.slug, 6);

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
  } catch (error) {
    console.error('Error cargando noticia:', error);
    // Error transitorio de Firebase — NO devolver 404/noindex
    return (
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Error de conexión</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>No pudimos cargar esta noticia en este momento. Por favor, intenta de nuevo en unos segundos.</p>
        <a href={`/noticias/${slug}`} style={{ color: '#991b1b', textDecoration: 'underline', fontWeight: 600 }}>Recargar página</a>
      </div>
    );
  }
}
