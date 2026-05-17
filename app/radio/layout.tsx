import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Radio Nicaragua Informate | En Vivo',
  description: 'Escucha Radio Nicaragua Informate en vivo. Noticias, música y programación local.',
  openGraph: {
    title: 'Radio Nicaragua Informate | En Vivo',
    description: 'Escucha nuestra programación en vivo.',
    type: 'website',
  },
};

export default function RadioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
