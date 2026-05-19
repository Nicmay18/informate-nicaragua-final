import type { Metadata } from 'next';

const RADIO_URL = 'https://nicaraguainformate.com/radio';

export const metadata: Metadata = {
  title: 'Radio Nicaragua Informate | En Vivo',
  description: 'Escucha Radio Nicaragua Informate en vivo. Noticias, música y programación local.',
  alternates: { canonical: RADIO_URL },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Radio Nicaragua Informate | En Vivo',
    description: 'Escucha nuestra programación en vivo con señal estable y recomendada.',
    type: 'website',
    url: RADIO_URL,
    locale: 'es_NI',
    siteName: 'Nicaragua Informate',
    images: [{ url: 'https://nicaraguainformate.com/logo.png', width: 512, height: 512, alt: 'Nicaragua Informate' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Radio Nicaragua Informate | Escucha en vivo',
    description: 'Programación informativa y musical con emisoras verificadas.',
    images: ['https://nicaraguainformate.com/logo.png'],
  },
};

export default function RadioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
