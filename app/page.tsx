import ProLayout from '@/components/ProLayout';
import MobileHome from '@/components/MobileHome';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description:
    'Portal de noticias de Nicaragua con cobertura nacional e internacional. Periodismo verificado desde Managua sobre nacionales, sucesos, internacionales, tecnología, economía y deportes.',
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
        <p>Portal de noticias líder de Nicaragua con cobertura verificada desde Managua y Estelí.</p>
      </section>

      <MobileHome noticias={noticias} masLeidas={masLeidas} />
    </ProLayout>
  );
}
