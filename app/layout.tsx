import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/schema';
import ClientOnly from '@/components/ClientOnly';
import StickyRadio from '@/components/StickyRadio';
import BottomNav from '@/components/BottomNav';
import CookieBanner from '@/components/CookieBanner';
import DeferredAds from '@/components/DeferredAds';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const merriweather = Merriweather({ weight: ['400', '700', '900'], subsets: ['latin'], variable: '--font-merri', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Al no poner maximumScale, el navegador permite zoom natural en móvil
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nicaraguainformate.com'),
  manifest: '/manifest.json',
  title: { default: 'Nicaragua Informate — Noticias de Nicaragua', template: '%s | Nicaragua Informate' },
  description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Estelí.',
  robots: 'index, follow',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'GTM-PK3V8LZX', // TODO: Reemplazar con código real de Google Search Console (no GTM)
  },
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: 'https://www.nicaraguainformate.com',
    siteName: 'Nicaragua Informate',
    title: 'Nicaragua Informate — Noticias de Nicaragua',
    description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Estelí.',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Nicaragua Informate' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nicaragua Informate — Noticias de Nicaragua',
    description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Estelí.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.weserv.nl" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <meta name="google-adsense-account" content="ca-pub-4115203339551838" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551838" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{ __html: `
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{font-family:var(--font-inter),system-ui,-apple-system,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
          body{background:#fff;color:#1a1a2e;overflow-x:hidden}
          img{max-width:100%;display:block;height:auto}
          .site-header{position:sticky;top:0;z-index:50;background:#fff;border-bottom:1px solid rgba(0,0,0,0.1)}
          .hero-section{position:relative;width:100%;overflow:hidden;background:#0f172a}
          .container-pro{width:100%;max-width:1200px;margin:0 auto;padding:0 16px}
          .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:56px;background:#fff;border-top:1px solid rgba(0,0,0,0.1);z-index:40;display:flex;justify-content:space-around;align-items:center}
          .cookie-banner{position:fixed;bottom:56px;left:0;right:0;padding:12px 16px;background:#fff;border-top:1px solid rgba(0,0,0,0.1);z-index:45;font-size:13px}
          @media(min-width:768px){.bottom-nav{display:none}}
        `}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLd()) }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('ni_theme');
                  var theme = (saved === 'light' || saved === 'dark') ? saved : 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" style={{ position: 'absolute', top: -40, left: 0, background: '#c41e3a', color: '#fff', padding: '8px 16px', zIndex: 10000, transition: 'top 0.3s', fontSize: '14px', fontWeight: 600, textDecoration: 'none', borderRadius: '4px' }}>Saltar al contenido</a>
        {children}
        <ClientOnly fallback={<div style={{ height: 58 }} />}>
          <StickyRadio />
        </ClientOnly>
        <ClientOnly fallback={<div style={{ height: 56 }} />}>
          <BottomNav />
        </ClientOnly>
        <ClientOnly fallback={<div style={{ height: 48 }} />}>
          <CookieBanner />
        </ClientOnly>
        <DeferredAds />
      </body>
    </html>
  );
}
