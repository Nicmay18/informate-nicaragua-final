import Link from 'next/link';
import Image from 'next/image';
import NewsGrid from '@/components/NewsGrid';
import IndicadoresWidget from '@/components/IndicadoresWidget';
import BreakingTicker from '@/components/BreakingTicker';
import HeroCarousel from '@/components/HeroCarousel';
import NewsletterForm from '@/components/NewsletterForm';
import TrendingList from '@/components/home/TrendingList';
import MasLeidas from '@/components/home/MasLeidas';
import SocialGrid from '@/components/home/SocialGrid';
import TagsCloud from '@/components/home/TagsCloud';
import SiteFooter from '@/components/home/SiteFooter';
import WeatherWidgetWrapper from '@/components/home/WeatherWidgetWrapper';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import { CATEGORIES, CATEGORY_COLORS, FALLBACK_IMAGE } from '@/lib/types';

export const revalidate = 60;

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];

  try {
    [noticias, masLeidas] = await Promise.all([getNews(30), getMasLeidas()]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  const destacadas = noticias.slice(0, 5);
  const recientes = noticias.slice(5);
  const tickerNews = noticias.slice(0, 8);

  const today = new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Fecha - Estilo periódico */}
      <div style={{ borderBottom: '1px solid #e5e5e5', padding: '10px 0', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{today}</span>
      </div>

      {/* Header - Título centrado estilo NYT */}
      <header style={{ borderBottom: '3px solid #000', padding: '20px 0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: '#333' }}>Estelí, Nicaragua</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link href="/noticias" style={{ color: '#333', fontSize: 11, fontWeight: 600, textDecoration: 'none', textTransform: 'uppercase', padding: '6px 12px', borderRadius: 4, transition: 'background 0.2s' }}>Noticias</Link>
              <Link href="/contacto" style={{ color: '#333', fontSize: 11, fontWeight: 600, textDecoration: 'none', textTransform: 'uppercase', padding: '6px 12px', borderRadius: 4, transition: 'background 0.2s' }}>Contacto</Link>
            </div>
          </nav>
          
          <div style={{ textAlign: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{ color: '#b91c1c', fontWeight: 900, fontSize: 'clamp(32px, 6vw, 56px)', letterSpacing: '-0.02em', fontFamily: 'Georgia, Times New Roman, serif', lineHeight: 1 }}>
                Nicaragua Informate
              </div>
              <div style={{ color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 6, fontWeight: 500 }}>
                Noticias de Nicaragua en Tiempo Real
              </div>
            </Link>
          </div>

          <nav style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e5e5', flexWrap: 'wrap' }}>
            {CATEGORIES.slice(0, 5).map((cat) => (
              <Link key={cat.name} href={`/?cat=${encodeURIComponent(cat.name)}`}
                style={{ color: '#333', fontSize: 12, fontWeight: 600, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 12px', borderRadius: 4, transition: 'background 0.2s' }}>
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Breaking Ticker */}
      {tickerNews.length > 0 && <BreakingTicker noticias={tickerNews} />}

      {/* Hero */}
      {destacadas.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
          <HeroCarousel noticias={destacadas} />
        </section>
      )}

      {/* Main Content - Grid Reorganizado */}
      <main 
  id="main-content"
  className="w-full mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6"
  style={{ maxWidth: 1200 }}
>
        <div className="space-y-6">
          {/* Hero Compacto 2/3 */}
          {destacadas.length > 0 && (
            <section className="lg:hidden">
              <HeroCarousel noticias={destacadas} />
            </section>
          )}
          
          {/* Últimas Noticias */}
          <NewsGrid noticias={recientes.length > 0 ? recientes : noticias} />
        </div>

        <aside className="space-y-6">
          {/* Hero Desktop + Noticia Destacada 1/3 */}
          {destacadas.length > 0 && (
            <section className="hidden lg:block">
              <HeroCarousel noticias={destacadas.slice(0, 1)} />
              {destacadas.length > 1 && (
                <div className="mt-4">
                  <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12, color: '#333' }}>También destacado</h3>
                  <Link href={`/noticias/${destacadas[1].slug}`} className="block no-underline">
                    <div style={{ display: 'flex', gap: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, transition: 'all 0.2s' }}>
                      <Image
                        src={destacadas[1].imagen || FALLBACK_IMAGE}
                        alt={destacadas[1].titulo}
                        width={120}
                        height={90}
                        className="object-cover rounded"
                        style={{ flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 10, color: CATEGORY_COLORS[destacadas[1].categoria] || '#8c1d18', fontWeight: 600, textTransform: 'uppercase' }}>
                          {destacadas[1].categoria}
                        </span>
                        <h4 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, margin: '4px 0', color: '#121212' }}>
                          {destacadas[1].titulo}
                        </h4>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* Sidebar Reordenado */}
          <TrendingList noticias={noticias.slice(0, 6)} />
          {masLeidas.length > 0 && <MasLeidas noticias={masLeidas} />}
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <WeatherWidgetWrapper />
          </div>
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <IndicadoresWidget />
          </div>
          <NewsletterForm />
          <SocialGrid />
          <TagsCloud />
        </aside>
      </main>

      <SiteFooter />

      <style>{`
        .cat-link:hover { color: #111 !important; background: rgba(185,28,28,0.06); }
        @media (max-width: 1024px) {
          main { grid-template-columns: 1fr !important; }
          aside { display: none !important; }
        }
        @media (max-width: 768px) {
          header nav { flex-direction: column; gap: 12px; align-items: flex-start; }
          header nav > div { flex-direction: column; gap: 8px; width: 100%; }
          header nav > div a { text-align: center; display: block; }
          header nav:last-child { gap: 12px; }
          header nav:last-child a { padding: 8px 12px; }
        }
      `}</style>
    </div>
  );
}
