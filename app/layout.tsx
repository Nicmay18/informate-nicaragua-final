import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import './pro-design.css';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/schema';
import ClientOnly from '@/components/ClientOnly';
import ScrollToTop from '@/components/ScrollToTop';
import CookieBanner from '@/components/CookieBanner';
import DeferredAds from '@/components/DeferredAds';
import ConsentScript from '@/components/ConsentScript';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const merriweather = Merriweather({ weight: ['400', '700', '900'], subsets: ['latin'], variable: '--font-merri', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://nicaraguainformate.com'),
  manifest: '/manifest.json',
  title: { default: 'Nicaragua Informate — Noticias de Nicaragua', template: '%s | Nicaragua Informate' },
  description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Managua.',
  robots: 'index, follow',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: 'https://nicaraguainformate.com',
    siteName: 'Nicaragua Informate',
    title: 'Nicaragua Informate — Noticias de Nicaragua',
    description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Managua.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nicaragua Informate — Noticias de Nicaragua',
    description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Managua.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-NI" className={`${inter.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.weserv.nl" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <meta name="google-adsense-account" content="ca-pub-4115203339551838" />
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
      <body suppressHydrationWarning className="ni-body">
        <a href="#main-content" className="skip-link">Saltar al contenido</a>
        {children}
        <ClientOnly fallback={<div style={{ height: 48 }} />}>
          <CookieBanner />
        </ClientOnly>
        <ConsentScript />
        <DeferredAds />
        <ClientOnly>
          <ScrollToTop />
        </ClientOnly>
      </body>
    </html>
  );
}
