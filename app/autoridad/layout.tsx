import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Centro de Autoridad Editorial | Nicaragua Informate',
  description:
    'Conoce la metodología editorial, transparencia, autores, correcciones y prácticas de verificación de Nicaragua Informate.',
  alternates: {
    canonical: 'https://nicaraguainformate.com/autoridad',
  },
};

export default function AutoridadLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
