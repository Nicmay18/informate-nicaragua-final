import type { Metadata } from 'next';
import Link from 'next/link';
import { getLatestNews } from '@/lib/db/homepage';
import { getAllEvergreen } from '@/lib/evergreen';
import NewsletterSignup from '@/components/NewsletterSignup';
import { Calendar, Sun, DollarSign, BookOpen, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Nicaragua Informate Hoy | Newsletter' },
  description: 'Cada mañana: 5 noticias importantes de Nicaragua, clima, dólar y agenda nacional. Suscríbete al boletín.',
  alternates: { canonical: 'https://nicaraguainformate.com/newsletter' },
};

export default async function NewsletterPage() {
  const today = new Date().toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' });
  const noticias = await getLatestNews(5);
  const guia = getAllEvergreen().slice(0, 1)[0];

  return (
    <main className="article-page" style={{ paddingTop: 40 }}>
      <nav className="ni-breadcrumbs" aria-label="Miga de pan" style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px 0' }}>
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>Newsletter</span>
      </nav>

      <section className="article-hero" style={{ height: 'auto', minHeight: 220 }}>
        <div style={{ background: 'var(--primary)', position: 'absolute', inset: 0 }} />
        <div className="article-hero-content" style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 12, color: 'white' }}>
            Nicaragua Informate Hoy
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 640 }}>
            Tu resumen diario de Nicaragua. 5 noticias importantes + contenido útil, en tu correo cada mañana.
          </p>
        </div>
      </section>

      <div className="article-content-wrapper">
        <div className="sidebar-widget" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}><Calendar size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />{today}</span>
            <span style={{ color: 'var(--text-secondary)' }}><Sun size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Clima: consulta el widget en portada</span>
            <span style={{ color: 'var(--text-secondary)' }}><DollarSign size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Dólar: ver Indicadores</span>
          </div>
          <NewsletterSignup />
        </div>

        <h2 className="article-summary-title" style={{ marginBottom: 20 }}>Noticias del día</h2>
        <div style={{ display: 'grid', gap: 16, marginBottom: 40 }}>
          {noticias.slice(0, 5).map((n, i) => (
            <article key={n.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                {i + 1}. {n.categoria}
              </div>
              <Link href={`/noticias/${n.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', marginBottom: 8, lineHeight: 1.35 }}>{n.titulo}</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{n.resumen}</p>
              </Link>
            </article>
          ))}
        </div>

        {guia && (
          <>
            <h2 className="article-summary-title" style={{ marginBottom: 16 }}>
              <BookOpen size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
              Contenido útil del día
            </h2>
            <div className="sidebar-widget" style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
                <Link href={`/guia/${guia.slug}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>{guia.title}</Link>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>{guia.description}</p>
            </div>
          </>
        )}

        <div className="sidebar-widget" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}>
          <h3 style={{ color: '#fff', marginBottom: 10 }}><Mail size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Recíbelo cada mañana</h3>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 16, fontSize: '0.95rem' }}>
            Noticias, clima, dólar y agenda nacional. Sin spam.
          </p>
          <NewsletterSignup />
        </div>
      </div>
    </main>
  );
}
