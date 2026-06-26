import ArticlePage from '@/components/ArticlePage';
import { getNewsBySlug, getRelatedNews, getAllSlugs } from '@/lib/data';
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

export const revalidate = 86400;
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
    const noticia = await getNewsBySlug(slug);
    if (!noticia) {
      return {
        title: 'Página no encontrada',
        robots: { index: false },
      };
    }

    // Slug obsoleto: redirigir al canonical en lugar de servir metadatos duplicados
    if (noticia.slug && noticia.slug !== slug) {
      permanentRedirect(`/noticias/${noticia.slug}`);
    }

    const normalizedSlug = noticia.slug || slug;
    const url = `https://nicaraguainformate.com/noticias/${normalizedSlug}`;
    const category = noticia.categoria || 'General';
    const seoTipo = toNoticiaTipo(category);

    // SEO Title optimization (máx 60 chars para evitar truncamiento en SERPs)
    // Preferir titulo original si ya es SEO-friendly; solo reescribir si es muy malo
    const originalValidation = validateTitle(noticia.titulo);
    const seoTitleResult = generateOptimizedTitle({
      tipo: seoTipo,
      tituloOriginal: noticia.titulo,
      lugar: 'Nicaragua',
      palabraClave: noticia.titulo.split(' ').slice(0, 3).join(' '),
      contexto: noticia.resumen?.substring(0, 40),
    });
    const titleValidation = validateTitle(seoTitleResult);
    // Usar original si ya es bueno (score >= 70) y no es mucho peor que el SEO rewrite
    const finalTitle = originalValidation.score >= 70
      ? noticia.titulo
      : (titleValidation.score >= 70 ? seoTitleResult : noticia.titulo);

    // Meta description: priorizar resumen editorial > metaDescription > generada
    // El resumen escrito por el periodista es mas atractivo que las plantillas genericas
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

    // Para redes sociales usamos el título ORIGINAL (más legible para humanos)
    // El SEO title (finalTitle) solo va en <title> para Google SERPs
    const socialTitle = noticia.titulo || finalTitle;

    // Normalizar imagen a URL absoluta para Open Graph / Telegram / Discord
    const absoluteImage = noticia.imagen
      ? (noticia.imagen.startsWith('http') ? noticia.imagen : `https://nicaraguainformate.com${noticia.imagen}`)
      : 'https://nicaraguainformate.com/logo.webp';

    return {
      title: finalTitle,
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
        images: [
          { url: absoluteImage, width: 1200, height: 630, alt: imageAlt },
        ],
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
  } catch {
    return {};
  }
}

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let noticia: Awaited<ReturnType<typeof getNewsBySlug>> = null;
  let related: Awaited<ReturnType<typeof getRelatedNews>> = [];

  // 1. Cargar noticia (errores de Firebase = "Error de conexión")
  try {
    noticia = await getNewsBySlug(slug);
  } catch (error) {
    logger.error('Error cargando noticia:', error);
    return (
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Error de conexión</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>No pudimos cargar esta noticia en este momento. Por favor, intenta de nuevo en unos segundos.</p>
        <a href={`/noticias/${slug}`} style={{ color: '#991b1b', textDecoration: 'underline', fontWeight: 600 }}>Recargar página</a>
      </div>
    );
  }

  // 2. Noticia no encontrada → 404 de Next.js (FUERA del try/catch)
  if (!noticia) return notFound();

  // 3. Slug obsoleto → redirigir 301
  if (noticia.slug && noticia.slug !== slug) {
    permanentRedirect(`/noticias/${noticia.slug}`);
  }

  // 4. Cargar relacionadas (si falla, array vacío, no rompe la página)
  try {
    related = await getRelatedNews(noticia.categoria, noticia.slug, 6);
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
