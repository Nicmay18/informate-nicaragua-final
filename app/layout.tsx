import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather, Spectral, IBM_Plex_Mono } from 'next/font/google';
// import localFont from 'next/font/local'; // Descomenta cuando agregues los archivos .woff2
import './styles/globals.css';
import './styles/components.css';
import './styles/responsive.css';
import './styles/clock-widget.css';
import './pro-design.css';
import './styles/tailwind.css';
import './styles/nios.css';
import './styles/command-center.css';
import {
  buildOrganizationJsonLdEnhanced,
  buildWebSiteJsonLdEnhanced,
} from '@/lib/seo/schema';
import { escapeJsonLd } from '@/lib/jsonld';
import CookieBanner from '@/components/CookieBanner';
import ConsentScript from '@/components/ConsentScript';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ThemeScript from '@/components/ThemeScript';
import { WebVitalsReporter } from '@/components/WebVitalsReporter';
import { criticalCss } from '@/lib/critical-css';
import { getCspNonce } from '@/lib/nonce';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', preload: true });
const merriweather = Merriweather({ weight: ['400', '700', '900'], subsets: ['latin'], variable: '--font-merri', display: 'swap', preload: false });
const spectral = Spectral({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-spectral', display: 'swap', preload: false });
const ibmPlexMono = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-ibm-plex-mono', display: 'swap', preload: false });

/* ─── CONFIGURACIÓN next/font/local (cuando tengas los .woff2) ───
 * 1. Descarga Inter y Merriweather como .woff2
 * 2. Colócalos en public/fonts/:
 *      public/fonts/Inter-Regular.woff2
 *      public/fonts/Inter-Bold.woff2
 *      public/fonts/Merriweather-Regular.woff2
 *      public/fonts/Merriweather-Bold.woff2
 * 3. Descomenta las líneas siguientes y elimina los imports de next/font/google arriba.
 *
 * const interLocal = localFont({
 *   src: [
 *     { path: '../public/fonts/Inter-Regular.woff2', weight: '400', style: 'normal' },
 *     { path: '../public/fonts/Inter-Bold.woff2', weight: '700', style: 'normal' },
 *   ],
 *   variable: '--font-inter',
 *   display: 'swap',
 *   preload: true,
 * });
 *
 * const merriweatherLocal = localFont({
 *   src: [
 *     { path: '../public/fonts/Merriweather-Regular.woff2', weight: '400', style: 'normal' },
 *     { path: '../public/fonts/Merriweather-Bold.woff2', weight: '700', style: 'normal' },
 *   ],
 *   variable: '--font-merri',
 *   display: 'swap',
 *   preload: true,
 * });
 *
 * Luego reemplaza en <html className={`${interLocal.variable} ${merriweatherLocal.variable}`}>
 */

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
  // keywords eliminadas — Google ignora meta keywords desde 2009; usar keywords en schema JSON-LD
  title: { default: 'Nicaragua Informate — Noticias de Nicaragua al Instante', template: '%s | Nicaragua Informate' },
  description: 'Últimas noticias de Nicaragua hoy: sucesos, nacionales, deportes, espectáculos y tecnología. Periodismo verificado desde Managua. Entérate al instante.',
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
    apple: '/icon-192x192.webp',
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
    images: [
      {
        url: 'https://nicaraguainformate.com/logo.webp',
        width: 512,
        height: 512,
        alt: 'Nicaragua Informate — Portal de noticias de Nicaragua',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@NicInformate',
    creator: '@NicInformate',
    images: ['https://nicaraguainformate.com/logo.webp'],
  },
  alternates: {
    canonical: 'https://nicaraguainformate.com',
    types: {
      'application/rss+xml': 'https://nicaraguainformate.com/feed.xml',
    },
  },
  verification: {
    google: 'T7lLAvE_TV9sflSwVqW9lqgOQN99uve_o4RkuQswsBQ',
    ...(process.env.NEXT_PUBLIC_BING_VERIFICATION && { other: { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION } }),
  },
  other: {
    'publisher': 'Nicaragua Informate',
    'msapplication-TileColor': '#0A192F',
    'msapplication-TileImage': '/icon-192x192.webp',
    'apple-mobile-web-app-title': 'Nicaragua Informate',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = await getCspNonce();
  return (
    <html lang="es-NI" className={`${inter.variable} ${merriweather.variable} ${spectral.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Google Analytics 4 — carga diferida tras interaccion del usuario (no bloquea LCP) */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://images.weserv.nl" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        {/* Google Analytics 4 — gtag.js */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-W1B5J61WEP"></script>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-W1B5J61WEP');
            `,
          }}
        />
        {/* AdSense script se carga lazy via IntersectionObserver en AdsenseUnit — no duplicar en head */}
        {/* Monetag — zone 11065476 (quge5.com) para diversificación de revenue */}
        <script
          async
          dangerouslySetInnerHTML={{
            __html: `(function(q,u,e,s,t,o,y){q['Quge5Object']=t;q[t]=q[t]||function(){(q[t].q=q[t].q||[]).push(arguments)},q[t].l=1*new Date();o=u.createElement(e),y=u.getElementsByTagName(e)[0];o.async=1;o.src=s;y.parentNode.insertBefore(o,y)})(window,document,'script','https://quge5.com/11065476.js','quge5');`,
          }}
        />
        {/* Critical CSS inyectado de forma segura (string controlado en build-time) */}
        <style nonce={nonce} dangerouslySetInnerHTML={{ __html: criticalCss }} />
        {/* AdSense script se carga lazy via IntersectionObserver en AdsenseUnit */}
        <link rel="alternate" type="application/rss+xml" title="RSS Nicaragua Informate" href="https://nicaraguainformate.com/feed.xml" />
        <link rel="alternate" type="application/feed+json" title="JSON Feed Nicaragua Informate" href="https://nicaraguainformate.com/feed.json" />
        {/* JSON-LD escapado para prevenir cierre prematuro de script */}
        <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: escapeJsonLd(buildOrganizationJsonLdEnhanced()) }} />
        <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: escapeJsonLd(buildWebSiteJsonLdEnhanced()) }} />
      </head>
      <body suppressHydrationWarning className="ni-body">
        <a href="#main-content" className="skip-to-content">Saltar al contenido principal</a>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <div className="site-shell">
            <TopBar />
            <Header />
          </div>
          <main id="main-content" role="main" aria-label="Contenido principal" style={{ flex: 1 }}>
            {children}
          </main>
          <div className="site-shell">
            <Footer />
          </div>
        </div>
        <Suspense fallback={null}>
          <CookieBanner />
        </Suspense>
        <ConsentScript />
        <ThemeScript />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
