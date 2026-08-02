import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllEvergreen } from '@/lib/evergreen';
import { BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Biblioteca Nicaragua Informate' },
  description: 'Guías, trámites, historia y contenido útil sobre Nicaragua. Activos evergreen para consultar en cualquier momento.',
  alternates: { canonical: 'https://nicaraguainformate.com/biblioteca' },
};

export default function BibliotecaPage() {
  const guias = getAllEvergreen();
  const categorias = Array.from(new Set(guias.map((g) => g.category)));

  return (
    <main className="article-page" style={{ paddingTop: 40 }}>
      <nav className="ni-breadcrumbs" aria-label="Miga de pan" style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px 0' }}>
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>Biblioteca</span>
      </nav>

      <section className="article-hero" style={{ height: 'auto', minHeight: 220 }}>
        <div style={{ background: 'var(--primary)', position: 'absolute', inset: 0 }} />
        <div className="article-hero-content" style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 12, color: 'white' }}>
            Biblioteca Nicaragua Informate
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 640 }}>
            Guías prácticas, trámites, turismo, historia y economía. Contenido útil que trabaja todo el año.
          </p>
        </div>
      </section>

      <div className="article-content-wrapper">
        <p className="article-body" style={{ marginBottom: 32 }}>
          La biblioteca reúne páginas evergreen: contenido de referencia que no caduca y que atrae tráfico orgánico constante desde Google.
        </p>

        {categorias.map((cat) => (
          <div key={cat} style={{ marginBottom: 40 }}>
            <h2 className="article-summary-title" style={{ marginBottom: 20 }}>
              <BookOpen size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
              {cat}
            </h2>
            <div className="article-related-grid">
              {guias.filter((g) => g.category === cat).map((g) => (
                <Link key={g.slug} href={`/guia/${g.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="sidebar-widget" style={{ height: '100%' }}>
                    <h3 style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>{g.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>{g.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
