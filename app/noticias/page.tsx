import { Metadata } from 'next';

import NewsGrid from '@/components/NewsGrid';

import Header from '@/components/Header';

import Footer from '@/components/Footer';

import AutoRefresh from '@/components/AutoRefresh';

import DonationCard from '@/components/DonationCard';

import SocialJoinButtons from '@/components/SocialJoinButtons';

import { getNews, getNewsByCategory } from '@/lib/data';

import type { Noticia } from '@/lib/types';



export const revalidate = 1;



export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string }> }): Promise<Metadata> {

  const params = await searchParams;

  const cat = params.cat || 'Todas';

  const baseUrl = 'https://nicaraguainformate.com';

  const url = `${baseUrl}/noticias${cat !== 'Todas' ? '?cat=' + encodeURIComponent(cat) : ''}`;



  return {

    title: `${cat !== 'Todas' ? cat + ' | ' : 'Todas las Noticias | '}Nicaragua Informate`,

    description: `Noticias de ${cat !== 'Todas' ? cat : 'Nicaragua y el mundo'}. Periodismo verificado desde Estelí.`,

    alternates: { canonical: url },

    openGraph: {

      type: 'website',

      locale: 'es_NI',

      url,

      siteName: 'Nicaragua Informate',

      title: `${cat !== 'Todas' ? cat + ' | ' : 'Todas las Noticias | '}Nicaragua Informate`,

      description: `Noticias de ${cat !== 'Todas' ? cat : 'Nicaragua y el mundo'}. Periodismo verificado desde Estelí.`,

      images: [{ url: `${baseUrl}/logo.png`, width: 512, height: 512, alt: 'Nicaragua Informate' }],

    },

    twitter: {

      card: 'summary_large_image',

      title: `${cat !== 'Todas' ? cat + ' | ' : 'Todas las Noticias | '}Nicaragua Informate`,

      description: `Noticias de ${cat !== 'Todas' ? cat : 'Nicaragua y el mundo'}. Periodismo verificado desde Estelí.`,

      images: [`${baseUrl}/logo.png`],

    },

  };

}



export default async function NoticiasPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {

  const params = await searchParams;

  const cat = params.cat || 'Todas';

  let noticias: Noticia[] = [];



  try {

    if (cat && cat !== 'Todas') {

      noticias = await getNewsByCategory(cat, 50);

    } else {

      noticias = await getNews(50);

    }

    console.log(`[NoticiasPage] Cargadas ${noticias.length} noticias${cat !== 'Todas' ? ' de ' + cat : ''}`);
  } catch (error) {

    console.error('[NoticiasPage] Error:', error);

  }



  return (

    <div className="min-h-screen">

      <AutoRefresh intervalSec={60} />

      <Header activeCategory={cat} />



      <main id="main-content" className="container-pro" style={{ padding: '32px 24px 48px' }}>

        <div style={{ marginBottom: 28 }}>

          <h1 className="article-title-pro" style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 700, lineHeight: 1.08, marginBottom: 10, fontFamily: 'var(--font-merri)', letterSpacing: '-0.01em' }}>

            {cat !== 'Todas' ? cat : 'Todas las Noticias'}

          </h1>

          <p className="article-lead-pro" style={{ fontSize: 18, lineHeight: 1.6 }}>

            {cat !== 'Todas' ? `Noticias de ${cat} en Nicaragua y el mundo.` : 'Mantente informado con las últimas noticias de Nicaragua y el mundo.'}

          </p>

        </div>



        {noticias.length > 0 ? (

          <>

            <SocialJoinButtons />

            <NewsGrid noticias={noticias} />

            <div style={{ marginTop: 40, maxWidth: 680, marginLeft: 'auto', marginRight: 'auto' }}>

              <DonationCard />

            </div>

          </>

        ) : (

          <div style={{ textAlign: 'center', padding: '64px 20px', color: '#666', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fafafa' }}>

            <div style={{ fontSize: 44, marginBottom: 14 }}>📰</div>

            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#111', fontFamily: 'var(--font-merri)' }}>Sin publicaciones por el momento</h2>

            <p style={{ margin: 0, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>

              Estamos actualizando esta sección. Vuelve en unos minutos para ver nuevas publicaciones.

            </p>

          </div>

        )}

      </main>



      <Footer />

    </div>

  );

}

