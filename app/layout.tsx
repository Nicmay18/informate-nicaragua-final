import type { Metadata } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { ThemeInit } from '@/components/ThemeInit';
import { buildOrganizationJsonLd } from '@/lib/schema';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-merri' });

export const metadata: Metadata = {
  metadataBase: new URL('https://nicaraguainformate.com'),
  title: {
    default: 'Nicaragua Informate | Periodismo de Precisión',
    template: '%s | Nicaragua Informate',
  },
  description: 'Noticias de Nicaragua en tiempo real: Sucesos, Nacionales, Deportes, Internacionales y Espectáculos.',
  keywords: ['noticias nicaragua', 'periodismo nicaragua', 'sucesos', 'nacionales', 'deportes'],
  authors: [{ name: 'Nicaragua Informate' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    url: 'https://nicaraguainformate.com',
    title: 'Nicaragua Informate | Periodismo de Precisión',
    description: 'Noticias de Nicaragua al instante.',
    images: ['https://nicaraguainformate.com/og-image.jpg'],
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://nicaraguainformate.com/feed.xml',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = buildOrganizationJsonLd();

  return (
    <html lang="es" data-theme="dark" className={`${inter.variable} ${merriweather.variable}`}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4115203339551838" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
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
      <body className="bg-[var(--paper)] text-[var(--ink)] antialiased">
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
