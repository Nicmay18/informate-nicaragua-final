import ProLayout from '@/components/ProLayout';
import MobileHome from '@/components/MobileHome';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description:
    'Noticias de Nicaragua en tiempo real. Periodismo verificado desde Managua sobre política, economía, deportes, tecnología y sucesos.',
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

  const tickerText = noticias[0]?.titulo || 'Nicaragua Informate';

  return (
    <ProLayout tickerText={tickerText}>
      <section className="seo-hero" aria-label="Introduccion">
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

      <MobileHome noticias={noticias} masLeidas={masLeidas} />
    </ProLayout>
  );
}
