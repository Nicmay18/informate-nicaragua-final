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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <meta name="google-adsense-account" content="ca-pub-4115203339551939" />
        <link rel="preload" href="/_next/static/css/app/layout.css" as="style" />
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
