// File: components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
// import { Mail, Heart } from 'lucide-react';
import type { Noticia } from '@/lib/types';

interface SidebarProps {
  trendingNews?: Noticia[];
  tags?: string[];
}

export default function Sidebar({
  trendingNews = [],
  tags = ['Nicaragua', 'Noticias', 'Sucesos', 'Política', 'Tecnología', 'Deportes'],
}: SidebarProps) {
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setNewsletterStatus('loading');
    try {
      // Aquí iría la llamada a tu API de newsletter
      // const res = await fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) });
      setNewsletterStatus('success');
      setEmail('');
      setTimeout(() => setNewsletterStatus('idle'), 3000);
    } catch (error) {
      setNewsletterStatus('error');
      setTimeout(() => setNewsletterStatus('idle'), 3000);
    }
  };

  return (
    <aside className="sidebar">
      {/* Destacados esta semana */}
      {trendingNews.length > 0 && (
        <div className="sidebar-section">
          <h3 className="sidebar-title">
            <span style={{ color: 'var(--accent)' }}>🔥</span> Destacados esta semana
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {trendingNews.slice(0, 5).map((noticia, idx) => (
              <Link
                key={noticia.id}
                href={`/noticias/${noticia.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="trending-item">
                  <div className="trending-number">{idx + 1}</div>
                  <div className="trending-content">
                    <div className="trending-link">{noticia.titulo}</div>
                    <div className="trending-meta">{noticia.categoria}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter */}
      <div className="sidebar-section">
        <h3 className="sidebar-title">
          <span style={{ marginRight: '4px' }}>✉️</span> Newsletter
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', lineHeight: 1.5 }}>
          Recibe noticias de Nicaragua directamente en tu bandeja de entrada.
        </p>
        <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
          <input
            type="email"
            className="newsletter-input"
            placeholder="Tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={newsletterStatus === 'loading'}
          />
          <button
            type="submit"
            className="newsletter-button"
            disabled={newsletterStatus === 'loading'}
            style={{
              opacity: newsletterStatus === 'loading' ? 0.6 : 1,
              cursor: newsletterStatus === 'loading' ? 'not-allowed' : 'pointer',
            }}
          >
            {newsletterStatus === 'loading' && '⏳ Enviando...'}
            {newsletterStatus === 'success' && '✓ Suscrito'}
            {newsletterStatus === 'error' && '✗ Error'}
            {newsletterStatus === 'idle' && 'Suscribirse'}
          </button>
          {newsletterStatus === 'success' && (
            <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '4px' }}>
              ¡Gracias por suscribirte! Revisa tu email.
            </p>
          )}
        </form>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="sidebar-section">
          <h3 className="sidebar-title">
            <span style={{ marginRight: '4px' }}>🏷️</span> Temas
          </h3>
          <div className="tags-container">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/noticias?tag=${encodeURIComponent(tag)}`}
                className="tag"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Información */}
      <div className="sidebar-section" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)' }}>
        <div style={{ color: 'var(--primary)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 'var(--spacing-sm)', color: 'var(--primary)' }}>
            Sobre nosotros
          </h3>
          <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--primary)' }}>
            Nicaragua Informate es tu fuente confiable de noticias verificadas de Nicaragua, Centroamérica y el mundo.
          </p>
          <Link
            href="/nosotros"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: 'var(--spacing-sm)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--primary)',
              textDecoration: 'underline',
            }}
          >
            Conoce más
            <span>→</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
