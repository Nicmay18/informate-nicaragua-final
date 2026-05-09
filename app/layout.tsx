import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { ThemeInit } from '@/components/ThemeInit';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/schema';
import StickyRadio from '@/components/StickyRadio';
import BottomNav from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-merri' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0F0F0F',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://nicaraguainformate.com'),
  manifest: '/manifest.json',
  title: {
    default: 'Nicaragua Informate — Noticias de Nicaragua en Tiempo Real',
    template: '%s | Nicaragua Informate',
  },
  description: 'Portal de noticias de Nicaragua con cobertura en sucesos, nacionales, deportes, internacionales, espectáculos y economía. Periodismo verificado y actualizado las 24 horas desde Estelí, Nicaragua.',
  keywords: ['noticias nicaragua', 'periodismo nicaragua', 'sucesos nicaragua', 'noticias estelí', 'deportes nicaragua', 'noticias centroamerica', 'nicaragua informate'],
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
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = buildOrganizationJsonLd();
  const siteJsonLd = buildWebSiteJsonLd();

  return (
    <html lang="es" data-theme="dark" className={`${inter.variable} ${merriweather.variable}`}>
      <head>
        <style>{`a.skip-link{position:absolute;top:-40px;left:0;background:#8c1d18;color:#fff;padding:8px 16px;text-decoration:none;z-index:100;transition:top 0.3s}a.skip-link:focus{top:0}`}</style>
        <meta name="theme-color" content="#0F0F0F" />
        <meta name="google-adsense-account" content="ca-pub-4115203339551838" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
          crossOrigin="anonymous"
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
      <body className="bg-[var(--paper)] text-[var(--ink)] antialiased" style={{ paddingBottom: 'calc(var(--radio-bar-h,0) + 60px)' }}>
        <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
        <ThemeInit />
        {children}
        <StickyRadio />
        <BottomNav />
      </body>
    </html>
  );
}
