import HomePagePro from '@/components/HomePagePro';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';
import { buildWebSiteJsonLdEnhanced, buildOrganizationJsonLdEnhanced } from '@/lib/seo/schema';

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description:
    'Portal de noticias de Nicaragua con cobertura nacional e internacional. Periodismo verificado desde Managua sobre nacionales, sucesos, espectáculos, internacionales, tecnología y deportes.',
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: 'https://nicaraguainformate.com',
    siteName: 'Nicaragua Informate',
    title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
    description: 'Portal de noticias líder de Nicaragua con cobertura verificada desde Managua y Estelí. Nacionales, sucesos, espectáculos, tecnología y deportes.',
    images: [
      {
        url: 'https://nicaraguainformate.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Nicaragua Informate — Portal de noticias de Nicaragua',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@NicInformate',
    creator: '@NicInformate',
    title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
    description: 'Portal de noticias líder de Nicaragua con cobertura verificada desde Managua y Estelí. Nacionales, sucesos, espectáculos, tecnología y deportes.',
    images: ['https://nicaraguainformate.com/logo.png'],
  },
  alternates: {
    canonical: 'https://nicaraguainformate.com',
    languages: {
      'es-NI': 'https://nicaraguainformate.com',
      'es-US': 'https://nicaraguainformate.com',
      'es-MX': 'https://nicaraguainformate.com',
      'es-ES': 'https://nicaraguainformate.com',
      'es': 'https://nicaraguainformate.com',
      'x-default': 'https://nicaraguainformate.com',
    },
  },
};

export const revalidate = 60;

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];

  try {
    [noticias, masLeidas] = await Promise.all([getNews(30), getMasLeidas()]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLdEnhanced()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLdEnhanced()) }} />

      <section className="seo-hero" aria-label="Introducción">
        <h1 className="seo-h1">
          Noticias de Nicaragua en tiempo real — Nicaragua Informate
        </h1>
        <p className="seo-intro">
          Nicaragua Informate es el portal de noticias líder de Nicaragua. Desde nuestra redacción en Managua y Estelí,
          ofrecemos cobertura periodística verificada sobre los acontecimientos más relevantes del país y el mundo.
          Nuestro equipo trabaja las 24 horas para mantenerte al día con lo último en deportes, tecnología,
          sucesos de última hora y entretenimiento. Fundado en 2020, nos hemos consolidado
          como una fuente confiable de información para los nicaragüenses dentro del territorio nacional y para la
          diáspora en Estados Unidos, España, México y Centroamérica.
        </p>
        <p className="seo-intro">
          Explora nuestras secciones de Nacionales, Internacionales, Sucesos, Tecnología, Deportes y
          Espectáculos. Cada publicación es validada minuciosamente por nuestro equipo editorial, garantizando
          inmediatez, precisión y los más altos estándares del periodismo independiente.
        </p>
      </section>

      <HomePagePro noticias={noticias} masLeidas={masLeidas} />
    </>
  );
}
