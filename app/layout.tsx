import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import localFont from 'next/font/local';
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
import JourneyTracker from '@/components/JourneyTracker';
import { WebVitalsReporter } from '@/components/WebVitalsReporter';
import { criticalCss } from '@/lib/critical-css';
import { getCspNonce } from '@/lib/nonce';
import { Suspense } from 'react';

// Fuentes autoalojadas (public/fonts/) — next/font/local elimina el
// fetch a Google Fonts en build-time, cuya respuesta fallida causaba el
// crash `Cannot read properties of null (reading '1')` en Vercel.
const inter = localFont({
  src: '../public/fonts/Inter-Variable.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
  preload: true,
});
// display:'optional' en fuentes no críticas: si no llegan a tiempo el
// navegador conserva el fallback en vez de intercambiar → evita el
// layout shift por font-swap tardío (CLS ~0.10 medido en Lighthouse CI).
const merriweather = localFont({
  src: '../public/fonts/Merriweather-var.woff2',
  variable: '--font-merri',
  weight: '300 900',
  display: 'optional',
  preload: false,
});
const spectral = localFont({
  src: [
    { path: '../public/fonts/Spectral-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/Spectral-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/Spectral-600.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/Spectral-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-spectral',
  display: 'optional',
  preload: false,
});
const ibmPlexMono = localFont({
  src: [
    { path: '../public/fonts/IBMPlexMono-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/IBMPlexMono-500.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-ibm-plex-mono',
  display: 'optional',
  preload: false,
});

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
    // Verificación de sitio para AdSense: el bot de revisión necesita ver el
    // publisher ID en el HTML inicial; el script se carga diferido en cliente
    // y no es detectable sin JS. ads.txt ya está correcto en producción.
    'google-adsense-account': 'ca-pub-4115203339551838',
    'publisher': 'Nicaragua Informate',
    'msapplication-TileColor': '#0A192F',
    'msapplication-TileImage': '/icon-192x192.webp',
    'apple-mobile-web-app-title': 'Nicaragua Informate',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

// Measurement ID de GA4: NEXT_PUBLIC_GA_ID con fallback a la propiedad
// actual de producción. Validación de formato para no inicializar GA con
// un valor vacío o mal formado (p. ej. env de CI).
const GA_ID = (() => {
  const id = (process.env.NEXT_PUBLIC_GA_ID || 'G-W1B5J61WEP').trim();
  return /^G-[A-Z0-9]{6,}$/i.test(id) ? id : '';
})();

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
        {/* Google Analytics 4 — gtag.js. El Measurement ID se resuelve de
            NEXT_PUBLIC_GA_ID; el fallback preserva la propiedad actual de
            producción. En entornos no productivos definir NEXT_PUBLIC_GA_ID
            con el ID de la propiedad de staging (o dejar Vercel sin valor
            solo donde no deba medirse: basta omitir el script con un ID
            vacío en el env de ese entorno). Si el valor no es un ID GA4
            válido (G-XXXXXXXXXX) no se carga GA. */}
        {GA_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              nonce={nonce}
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              nonce={nonce}
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  var niA = 'denied', niAd = 'denied';
                  try {
                    var niP = JSON.parse(localStorage.getItem('ni_cookie_preferences') || localStorage.getItem('cookie_preferences_ni') || 'null');
                    if (niP) { niA = niP.analytics ? 'granted' : 'denied'; niAd = niP.ads ? 'granted' : 'denied'; }
                  } catch (e) {}
                  gtag('consent', 'default', {
                    analytics_storage: niA,
                    ad_storage: niAd,
                    ad_user_data: niAd,
                    ad_personalization: niAd
                  });
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}');
                `,
              }}
            />
          </>
        )}
        {/* AdSense script se carga lazy via IntersectionObserver en AdsenseUnit — no duplicar en head */}
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
        <Suspense fallback={null}>
          <JourneyTracker />
        </Suspense>
        <WebVitalsReporter />
      </body>
    </html>
  );
}
