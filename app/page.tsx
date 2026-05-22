import HeroSection from '@/components/HeroSection';
import NewsGrid from '@/components/NewsGrid';
import Sidebar from '@/components/Sidebar';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description:
    'Portal de noticias de Nicaragua con cobertura nacional e internacional. Periodismo verificado desde Managua sobre política, economía, deportes, tecnología, sucesos y cultura.',
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

  const noticiaDestacada = noticias[0];
  const noticiasPrincipales = noticias.slice(0, 12);
  const noticiasTrending = masLeidas.slice(0, 5);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* SEO Content — visible en HTML estático para crawlers */}
      <section className="seo-hero" aria-label="Introducción">
        <h1 className="seo-h1">
          Noticias de Nicaragua en tiempo real — Nicaragua Informate
        </h1>
        <p className="seo-intro">
          Nicaragua Informate es el portal de noticias líder de Nicaragua. Desde nuestra redacción en Managua y Estelí,
          ofrecemos cobertura periodística verificada sobre los acontecimientos más importantes del país y el mundo.
          Nuestro equipo de periodistas trabaja las 24 horas para mantenerte informado sobre política nacional,
          economía, deportes, tecnología, sucesos de última hora, cultura nicaragüense y entretenimiento.
          Fundado en 2020, nos hemos consolidado como una fuente confiable de información para nicaragüenses
          dentro y fuera del país, incluyendo la diáspora en Estados Unidos, España, México y Centroamérica.
        </p>
        <p className="seo-intro">
          Explora nuestras secciones de Nacionales, Internacionales, Sucesos, Tecnología, Economía, Deportes y
          Espectáculos. Cada noticia es verificada por nuestro equipo editorial antes de su publicación,
          cumpliendo con los más altos estándares éticos del periodismo independiente.
        </p>
      </section>

      {/* Schema.org ItemList — noticias destacadas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: noticias.slice(0, 6).map((n, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `https://nicaraguainformate.com/noticias/${n.slug}`,
              name: n.titulo,
            })),
          }),
        }}
      />

      {/* Hero Section */}
      {noticiaDestacada && (
        <HeroSection noticia={noticiaDestacada} />
      )}

      {/* Main Grid con Sidebar */}
      <div className="main-grid container" style={{ marginBottom: 'var(--spacing-3xl)', flex: 1 }}>
        {/* Noticias Principales */}
        <div style={{ minWidth: 0 }}>
          <NewsGrid
            title="Últimas noticias"
            noticias={noticiasPrincipales}
            viewAllLink="/noticias"
          />
        </div>

        {/* Sidebar */}
        <Sidebar trendingNews={noticiasTrending} />
      </div>
    </div>
  );
}
