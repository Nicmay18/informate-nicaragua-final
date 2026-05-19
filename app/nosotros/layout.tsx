import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Nicaragua Informate',
  description:
    'Conoce al equipo de Nicaragua Informate. Periodismo verificado desde Managua con cobertura de Sucesos, Nacionales, Deportes, Internacionales, Tecnología y Espectáculos.',
  alternates: { canonical: 'https://nicaraguainformate.com/nosotros' },
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: 'https://nicaraguainformate.com/nosotros',
    siteName: 'Nicaragua Informate',
    title: 'Sobre Nosotros | Nicaragua Informate',
    description:
      'Periodismo verificado desde Managua. Equipo editorial comprometido con la información precisa y responsable.',
    images: [
      {
        url: 'https://nicaraguainformate.com/logo.png',
        width: 512,
        height: 512,
        alt: 'Nicaragua Informate',
      },
    ],
  },
};

export default function NosotrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
