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
import ClientDate from '@/components/home/ClientDate';
import DynamicWeatherWidget from '@/components/home/DynamicWeatherWidget';
import { getNews, getMasLeidas } from '@/lib/data';
import { CATEGORIES } from '@/lib/types';

export const revalidate = 60;

export default async function HomePage() {
  let noticias = [];
  let masLeidas = [];

  try {
    [noticias, masLeidas] = await Promise.all([getNews(30), getMasLeidas()]);
  } catch (error) {
    console.error('[HomePage] Error fetching data:', error);
  }

  const destacadas = noticias.slice(0, 5);
  const recientes = noticias.slice(5);
  const tickerNews = noticias.slice(0, 8);

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)]">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] text-slate-400 text-xs border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6 py-1.5 flex justify-between items-center">
          <span className="flex items-center gap-3">
            <i className="fas fa-calendar-alt text-red-500 text-[11px]" />
            <ClientDate />
            <span className="text-slate-600">|</span>
            <i className="fas fa-map-marker-alt text-red-500 text-[11px]" /> Estelí, Nicaragua
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-red-900/[0.15] shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1400px] mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
          <h1 className="sr-only">Últimas Noticias de Nicaragua</h1>
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image src="/logo.png" alt="Nicaragua Informate" width={42} height={42} className="rounded-lg object-cover" />
            <div>
              <div className="text-red-600 font-extrabold text-[18px] leading-tight tracking-tight">Nicaragua Informate</div>
              <div className="text-slate-500 text-[10px] uppercase tracking-wider">Noticias de Nicaragua</div>
            </div>
          </Link>
          <div className="flex items-center gap-3.5 hidden md:flex">
            <Link href="/noticias" className="flex items-center gap-1.5 text-[var(--ink-muted)] text-[13px] font-semibold no-underline">
              <i className="fas fa-newspaper text-[#8c1d18]" /> Todas las noticias
            </Link>
            <Link href="/contacto" className="flex items-center gap-1.5 text-[var(--ink-muted)] text-[13px] font-semibold no-underline">
              <i className="fas fa-envelope text-[#8c1d18]" /> Contacto
            </Link>
          </div>
        </div>
      </header>

      {/* Category Ribbon */}
      <div className="bg-[var(--paper-accent)] border-b border-[var(--border-light)]">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.name}
              href={`/?cat=${encodeURIComponent(cat.name)}`}
              className="nav-red-hover cat-ribbon-link flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold text-[var(--ink-muted)] no-underline border-b-[3px] border-transparent whitespace-nowrap transition-all"
            >
              <i className={`fas ${cat.icon}`} style={{ color: cat.color, fontSize: 12 }} />
              {cat.name}
            </a>
          ))}
        </div>
      </div>

      {/* Breaking News Ticker */}
      {tickerNews.length > 0 && <BreakingTicker noticias={tickerNews} />}

      {/* Hero Carousel */}
      {destacadas.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 py-4">
          <HeroCarousel noticias={destacadas} />
        </section>
      )}

      {/* Main Grid */}
      <main className="max-w-[1400px] mx-auto px-6 py-5 pb-12 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8" id="main-content">
        <div>
          <NewsGrid noticias={recientes.length > 0 ? recientes : noticias} />
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          <TrendingList noticias={noticias.slice(0, 6)} />
          <div className="widget-lift rounded-[14px] overflow-hidden">
            <DynamicWeatherWidget />
          </div>
          <div className="widget-lift rounded-[14px] overflow-hidden">
            <IndicadoresWidget />
          </div>
          {masLeidas.length > 0 && <MasLeidas noticias={masLeidas} />}
          <NewsletterForm />
          <SocialGrid />
          <TagsCloud />
        </aside>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
