import ProLayout from '@/components/ProLayout';
import MobileHome from '@/components/MobileHome';
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

  const tickerItems = noticias.slice(0, 10);

  return (
    <ProLayout tickerItems={tickerItems}>
      <section className="visually-hidden" aria-label="Introduccion SEO">
        <h1>Noticias de Nicaragua en tiempo real — Nicaragua Informate</h1>
        <p>Nicaragua Informate es el portal de noticias lider de Nicaragua. Desde nuestra redaccion en Managua y Esteli, ofrecemos cobertura periodistica verificada sobre los acontecimientos mas importantes del pais y el mundo.</p>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsMediaOrganization',
            name: 'Nicaragua Informate',
            url: 'https://nicaraguainformate.com',
            logo: 'https://nicaraguainformate.com/logo.png',
            sameAs: [
              'https://facebook.com/profile.php?id=61578261125687',
              'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
              'https://t.me/+fHHjncJqMQM3NjZh',
            ],
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Estelí',
              addressCountry: 'NI',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Nicaragua Informate',
            url: 'https://nicaraguainformate.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://nicaraguainformate.com/buscar?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      <MobileHome noticias={noticias} masLeidas={masLeidas} />
    </ProLayout>
  );
}
