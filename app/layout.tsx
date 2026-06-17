import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
// import localFont from 'next/font/local'; // Descomenta cuando agregues los archivos .woff2
import './styles/globals.css';
import './styles/components.css';
import './styles/responsive.css';
import './styles/clock-widget.css';
import './pro-design.css';
import {
  buildOrganizationJsonLdEnhanced,
  buildWebSiteJsonLdEnhanced,
} from '@/lib/seo/schema';
import { escapeJsonLd } from '@/lib/sanitize';
import CookieBanner from '@/components/CookieBanner';
import ConsentScript from '@/components/ConsentScript';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ThemeScript from '@/components/ThemeScript';
import ThirdPartyScripts from '@/components/ThirdPartyScripts';
import OneSignalProvider from '@/components/OneSignalProvider';
import { criticalCss } from '@/lib/critical-css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const merriweather = Merriweather({ weight: ['400', '700', '900'], subsets: ['latin'], variable: '--font-merri', display: 'swap' });

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
    title: 'Nicaragua Informate — Noticias de Nicaragua',
    description: 'Noticias de Nicaragua con cobertura nacional e internacional. Nacionales, sucesos, espectáculos, tecnología y deportes desde Managua.',
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
    title: 'Nicaragua Informate — Noticias de Nicaragua',
    description: 'Noticias de Nicaragua con cobertura nacional e internacional. Nacionales, sucesos, espectáculos, tecnología y deportes desde Managua.',
    images: ['https://nicaraguainformate.com/logo.webp'],
  },
  alternates: {
    languages: {
      'x-default': 'https://nicaraguainformate.com',
    },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-NI" className={`${inter.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* Critical CSS inyectado de forma segura (string controlado en build-time) */}
        <style dangerouslySetInnerHTML={{ __html: criticalCss }} />
        {/* AdSense cargado vía ThirdPartyScripts (lazy al scroll) */}
        <link rel="alternate" type="application/rss+xml" title="RSS Nicaragua Informate" href="https://nicaraguainformate.com/feed.xml" />
        {/* JSON-LD escapado para prevenir cierre prematuro de script */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(buildOrganizationJsonLdEnhanced()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(buildWebSiteJsonLdEnhanced()) }} />
      </head>
      <body suppressHydrationWarning className="ni-body">
        <a href="#main-content" className="skip-to-content">Saltar al contenido principal</a>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main id="main-content" role="main" aria-label="Contenido principal" style={{ flex: 1 }}>
            {children}
          </main>
          <Footer />
        </div>
        <CookieBanner />
        <ConsentScript />
        <ThemeScript />
        <ThirdPartyScripts />
        <OneSignalProvider />
      </body>
    </html>
  );
}
