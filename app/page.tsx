import ProLayout from '@/components/ProLayout';
import MobileHome from '@/components/MobileHome';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description:
    'Portal de noticias de Nicaragua con cobertura nacional e internacional. Periodismo verificado desde Managua sobre politica, economia, deportes, tecnologia, sucesos y cultura.',
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
          Nicaragua Informate es el portal de noticias lider de Nicaragua. Desde nuestra redaccion en Managua y Esteli,
          ofrecemos cobertura periodistica verificada sobre los acontecimientos mas importantes del pais y el mundo.
        </p>
      </section>

      <MobileHome noticias={noticias} masLeidas={masLeidas} />
    </ProLayout>
  );
}
