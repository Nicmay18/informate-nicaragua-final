import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/types';
import { Flag, AlertTriangle, Globe, Cpu, Trophy, Star } from 'lucide-react';

const SITE_URL = 'https://nicaraguainformate.com';

const ICONS: Record<string, React.ReactNode> = {
  Nacionales: <Flag size={22} strokeWidth={2.2} />,
  Sucesos: <AlertTriangle size={22} strokeWidth={2.2} />,
  Internacionales: <Globe size={22} strokeWidth={2.2} />,
  Tecnología: <Cpu size={22} strokeWidth={2.2} />,
  Deportes: <Trophy size={22} strokeWidth={2.2} />,
  Espectáculos: <Star size={22} strokeWidth={2.2} />,
};

export const metadata: Metadata = {
  title: 'Categorías de noticias',
  description: 'Explora todas las secciones de Nicaragua Informate: Sucesos, Nacionales, Deportes, Internacionales, Tecnología y Espectáculos.',
  alternates: { canonical: `${SITE_URL}/categoria` },
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: `${SITE_URL}/categoria`,
    siteName: 'Nicaragua Informate',
    title: 'Categorías | Nicaragua Informate',
    description: 'Explora todas las secciones de Nicaragua Informate.',
    images: [{ url: `${SITE_URL}/logo.webp`, width: 512, height: 512, alt: 'Nicaragua Informate' }],
  },
};

export const revalidate = 86400;

export default function CategoriasPage() {
  return (
    <main id="main-content" className="ni-body" style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
      <nav className="ni-breadcrumbs" aria-label="Miga de pan" style={{ marginBottom: 24 }}>
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>Categorías</span>
      </nav>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: 12, fontFamily: 'var(--font-merri)', letterSpacing: '-0.02em' }}>
        Categorías
      </h1>
      <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 40 }}>
        Explora las noticias por tema. Selecciona una categoría para ver el contenido más reciente.
      </p>

      <div className="ni-cat-grid">
        {CATEGORIES.map((cat) => {
          const slug = cat.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
          return (
            <Link
              key={cat.name}
              href={`/categoria/${slug}`}
              className="ni-cat-tile"
            >
              <span className="ni-cat-tile__icon" style={{ background: `${cat.color}18`, color: cat.color }}>
                {ICONS[cat.name] || cat.name.charAt(0)}
              </span>
              <div className="ni-cat-tile__text">
                <h2>{cat.name}</h2>
                <p>Ver noticias de {cat.name.toLowerCase()}</p>
              </div>
              <span className="ni-cat-tile__arrow" aria-hidden="true">→</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
