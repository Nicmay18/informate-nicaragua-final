import ArticleClient from '@/components/ArticleClient';
import ProLayout from '@/components/ProLayout';
import { getNewsBySlug, getRelatedNews, getAllSlugs } from '@/lib/data';
import { isLutoNews } from '@/lib/types';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  buildNewsArticleJsonLdEnhanced,
  buildBreadcrumbJsonLdEnhanced,
} from '@/lib/seo/schema';
import { generateOptimizedTitle, validateTitle, type NoticiaTipo } from '@/lib/seo/title';
import { generateMetaDescription, generateKeywords, generateImageAlt } from '@/lib/seo/meta';
import { isToxicSlug } from '@/lib/seo-toxic';

export const dynamicParams = true;
export const revalidate = 60;

const NOTICIA_TIPOS: ReadonlyArray<NoticiaTipo> = [
  'Tecnología',
  'Sucesos',
  'Economía',
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
      title: `${finalTitle} | Nicaragua Informate`,
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
          : [{ url: 'https://nicaraguainformate.com/logo.png', width: 1200, height: 630, alt: 'Nicaragua Informate' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: finalTitle,
        description,
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

    const isLuto = isLutoNews(noticia);
    const related = await getRelatedNews(noticia.categoria, noticia.slug, 6);
    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;

    const wordCount = noticia.contenido
      ? noticia.contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length
      : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const serverNow = Date.now();

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cuánto cuesta anular el récord policial en Nicaragua 2026?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'El trámite tiene un costo aproximado de 330 córdobas en 2026, incluyendo constancia judicial (150 C$), constancia de Fiscalía (50 C$), récord policial (80 C$) y trámite administrativo (50 C$).',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué documentos necesito para anular el récord policial en Nicaragua?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Necesitás: constancia judicial del Poder Judicial, constancia de no acción judicial de la Fiscalía, récord policial actualizado de la Policía Nacional, cédula de identidad vigente y carta formal dirigida al área legal de la Policía Nacional.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Dónde se tramita la anulación del récord policial en Nicaragua?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'El trámite se realiza en Managua ante el Poder Judicial (constancia judicial), la Fiscalía General (constancia de no acción) y la Policía Nacional (récord policial y solicitud formal).',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuánto tiempo tarda la anulación del récord policial?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'El proceso completo toma aproximadamente 3 a 7 días hábiles, dependiendo de la carga administrativa de cada institución. La constancia judicial suele entregarse en 48 horas.',
          },
        },
      ],
    };

    const isRecordPolicial = noticia.titulo.toLowerCase().includes('récord policial') || noticia.titulo.toLowerCase().includes('record policial') || noticia.slug.toLowerCase().includes('record-policial');

    return (
      <ProLayout tickerText={noticia.titulo}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildNewsArticleJsonLdEnhanced(noticia, url, readingTime)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLdEnhanced(noticia.categoria, noticia.slug, noticia.titulo)) }} />
        {isRecordPolicial && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        )}
        <ArticleClient noticia={noticia} related={related} isLuto={isLuto} serverNow={serverNow} />
      </ProLayout>
    );
  } catch (error) {
    console.error('Error cargando noticia:', error);
    return notFound();
  }
}
