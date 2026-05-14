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
    google: 'GTM-PK3V8LZX', // Google Search Console verification
  },
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: 'https://nicaraguainformate.com',
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
        <link rel="preconnect" href="https://raw.githubusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <meta name="google-adsense-account" content="ca-pub-4115203339551939" />
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; }
          header { position: relative; z-index: 50; }
          .hero { position: relative; width: 100%; overflow: hidden; }
          main { display: grid; grid-template-columns: 1fr; gap: 24px; padding: 16px; }
          @media (min-width: 1024px) { main { grid-template-columns: 1fr 340px; } }
          nav[role="navigation"] { position: fixed; bottom: 0; left: 0; right: 0; height: 56px; background: #fff; border-top: 1px solid #e5e5e5; z-index: 40; }
          .cookie-banner { position: fixed; bottom: 56px; left: 0; right: 0; padding: 12px 16px; background: #fff; border-top: 1px solid #e5e8ec; z-index: 45; }
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
