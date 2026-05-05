import type { Metadata } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { ThemeInit } from '@/components/ThemeInit';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/schema';
import StickyRadio from '@/components/StickyRadio';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-merri' });

export const metadata: Metadata = {
  metadataBase: new URL('https://nicaraguainformate.com'),
  title: {
    default: 'Nicaragua Informate — Noticias de Nicaragua en Tiempo Real',
    template: '%s | Nicaragua Informate',
  },
  description: 'Portal de noticias de Nicaragua con cobertura en sucesos, nacionales, deportes, internacionales, espectáculos y economía. Periodismo verificado y actualizado las 24 horas desde Masaya, Nicaragua.',
  keywords: ['noticias nicaragua', 'periodismo nicaragua', 'sucesos nicaragua', 'noticias managua', 'deportes nicaragua', 'noticias centroamerica', 'nicaragua informate'],
  authors: [{ name: 'Nicaragua Informate', url: 'https://nicaraguainformate.com' }],
  creator: 'Nicaragua Informate',
  publisher: 'Nicaragua Informate',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1',
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: 'https://nicaraguainformate.com',
    siteName: 'Nicaragua Informate',
    title: 'Nicaragua Informate — Noticias de Nicaragua en Tiempo Real',
    description: 'Portal de noticias de Nicaragua. Periodismo verificado y cobertura en sucesos, nacionales, deportes e internacionales.',
    images: [{ url: 'https://nicaraguainformate.com/logo.png', width: 512, height: 512, alt: 'Nicaragua Informate' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nicaragua Informate — Noticias de Nicaragua',
    description: 'Noticias verificadas de Nicaragua al instante.',
    images: ['https://nicaraguainformate.com/logo.png'],
  },
  alternates: {
    canonical: 'https://nicaraguainformate.com',
    types: {
      'application/rss+xml': 'https://nicaraguainformate.com/feed.xml',
    },
  },
  verification: {
    google: 'ca-pub-4115203339551838',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = buildOrganizationJsonLd();
  const siteJsonLd = buildWebSiteJsonLd();

  return (
    <html lang="es" data-theme="dark" className={`${inter.variable} ${merriweather.variable}`}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4115203339551838" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ni_theme');if(t)document.documentElement.setAttribute('data-theme',t);else if(window.matchMedia('(prefers-color-scheme:light)').matches)document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-W1B5J61WEP" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-W1B5J61WEP');`,
          }}
        />
        {/* AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551838"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-[var(--paper)] text-[var(--ink)] antialiased" style={{ paddingBottom: 'var(--radio-bar-h,0)' }}>
        <ThemeInit />
        {children}
        <StickyRadio />
      </body>
    </html>
  );
}
