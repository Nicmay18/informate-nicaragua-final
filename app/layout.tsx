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
  // Al no poner maximumScale, el navegador permite zoom natural en móvil
};

export const metadata: Metadata = {
  metadataBase: new URL('https://nicaraguainformate.com'),
  manifest: '/manifest.json',
  title: { default: 'Nicaragua Informate — Noticias de Nicaragua', template: '%s | Nicaragua Informate' },
  description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Estelí.',
  robots: 'index, follow',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  alternates: {
    canonical: '/',
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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLd()) }} />
      </head>
      <body style={{ background: '#ffffff', color: '#121212', fontFamily: 'var(--font-body)' }}>
        <a href="#main-content" style={{ position: 'absolute', top: -40, left: 0, background: '#8c1d18', color: '#fff', padding: '8px 16px', zIndex: 10000, transition: 'top 0.3s' }}>Saltar al contenido</a>
        <ThemeInit />
        {children}
        <StickyRadio />
        <BottomNav />
      </body>
    </html>
  );
}
