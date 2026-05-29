import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter, Merriweather } from 'next/font/google';
import './styles/globals.css';
import './styles/components.css';
import './styles/responsive.css';
import './pro-design.css';
import {
  buildOrganizationJsonLdEnhanced,
  buildWebSiteJsonLdEnhanced,
} from '@/lib/seo/schema';
import CookieBanner from '@/components/CookieBanner';
import ConsentScript from '@/components/ConsentScript';
import Analytics from '@/components/Analytics';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const merriweather = Merriweather({ weight: ['400', '700', '900'], subsets: ['latin'], variable: '--font-merri', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A192F',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://nicaraguainformate.com'),
  manifest: '/manifest.json',
  applicationName: 'Nicaragua Informate',
  authors: [{ name: 'Keyling Elieth Rivera Muñoz', url: 'https://nicaraguainformate.com/nosotros' }],
  generator: 'Next.js',
  keywords: ['Nicaragua', 'noticias Nicaragua', 'actualidad Nicaragua', 'periodismo Nicaragua', 'Managua', 'Noticias de hoy'],
  title: { default: 'Nicaragua Informate — Noticias de Nicaragua', template: '%s | Nicaragua Informate' },
  description: 'Noticias de Nicaragua con cobertura nacional e internacional. Nacionales, sucesos, espectáculos, tecnología y deportes desde Managua.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon-192x192.png',
    other: [
      { rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' },
      { rel: 'mask-icon', url: '/favicon.svg', color: '#0A192F' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: 'https://nicaraguainformate.com',
    siteName: 'Nicaragua Informate',
    title: 'Nicaragua Informate — Noticias de Nicaragua',
    description: 'Noticias de Nicaragua con cobertura nacional e internacional. Nacionales, sucesos, espectáculos, tecnología y deportes desde Managua.',
    images: [
      {
        url: 'https://nicaraguainformate.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Nicaragua Informate — Portal de noticias de Nicaragua',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@NicInformate',
    creator: '@NicInformate',
    title: 'Nicaragua Informate — Noticias de Nicaragua',
    description: 'Noticias de Nicaragua con cobertura nacional e internacional. Nacionales, sucesos, espectáculos, tecnología y deportes desde Managua.',
    images: ['https://nicaraguainformate.com/logo.png'],
  },
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
    types: {
      'application/rss+xml': 'https://nicaraguainformate.com/feed.xml',
    },
  },
  verification: {
    ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION && { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }),
    ...(process.env.NEXT_PUBLIC_BING_VERIFICATION && { other: { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION } }),
  },
  other: {
    'publisher': 'Nicaragua Informate',
    'msapplication-TileColor': '#0A192F',
    'msapplication-TileImage': '/icon-192x192.png',
    'apple-mobile-web-app-title': 'Nicaragua Informate',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-NI" className={`${inter.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="alternate" type="application/rss+xml" title="RSS Nicaragua Informate" href="https://nicaraguainformate.com/feed.xml" />
        
        {/* CORRECCIÓN: Se remueve la metaetiqueta duplicada de google-site-verification ya que Next.js la inyecta mediante el objeto metadata */}
        <meta name="monetag" content="b6b5bd78135f12004d0d90c7c2b82f6c" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLdEnhanced()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLdEnhanced()) }} />
      </head>
      <body suppressHydrationWarning className="ni-body">
        <a href="#main-content" className="skip-to-content">Saltar al contenido principal</a>
        <main id="main-content" role="main" aria-label="Contenido principal" style={{ flex: 1 }}>
          {children}
        </main>
        
        <CookieBanner />
        <ConsentScript />
        <Analytics />

        {/* Monetag scripts */}
        <Script
          id="monetag-244075"
          src="https://quge5.com/88/tag.min.js"
          data-zone="244075"
          async
          data-cfasync="false"
          strategy="afterInteractive"
        />
        <Script
          id="monetag-243623"
          src="https://quge5.com/88/tag.min.js"
          data-zone="243623"
          async
          data-cfasync="false"
          strategy="afterInteractive"
        />

        <script
          defer
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
      </body>
    </html>
  );
}
