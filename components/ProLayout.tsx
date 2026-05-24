'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Menu, X, Home, Globe, Radio, MessageSquare, User,
  MessageCircle, Send, Mail,
} from 'lucide-react';
import type { Noticia } from '@/lib/types';
import RadioPlayer from './RadioPlayer';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/categoria/nacionales', label: 'Nacionales' },
  { href: '/categoria/sucesos', label: 'Sucesos' },
  { href: '/categoria/espectaculos', label: 'Espectáculos' },
  { href: '/categoria/deportes', label: 'Deportes' },
  { href: '/categoria/tecnologia', label: 'Tecnología' },
  { href: '/categoria/internacionales', label: 'Internacionales' },
];

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ni_theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {}
  }, []);
  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('ni_theme', next); } catch {}
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);
  return { theme, toggle };
}

export default function ProLayout({
  children,
  tickerItems,
}: {
  children: React.ReactNode;
  tickerItems?: Noticia[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  useTheme();
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    if (!tickerItems?.length) return;
    const t = setInterval(() => setTickerIdx(p => (p + 1) % tickerItems.length), 5000);
    return () => clearInterval(t);
  }, [tickerItems]);

  // Progress bar scroll + header compacto
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop || document.body.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      setScrollProgress(height > 0 ? (scrolled / height) * 100 : 0);
      
      // Header compacto al hacer scroll
      const header = document.querySelector('.header');
      if (header) {
        if (scrolled > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Progress Bar */}
      <div className="progress-bar" style={{ width: `${scrollProgress}%` }} />

      {/* Radio en Vivo Bar */}
      <div className="radio-live-bar" aria-live="polite">
        <div className="radio-live-indicator" />
        <span className="radio-live-text">Radio en Vivo</span>
      </div>

      {/* Header profesional TN8 */}
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">
            <img src="/logo.png" alt="Nicaragua Informate" width={32} height={32} />
            <div className="logo-text">
              Nicaragua Informate
              <small>Noticias de Nicaragua y el mundo</small>
            </div>
          </Link>
          <nav aria-label="Navegación principal">
            <ul className="nav">
              {NAV_LINKS.map(link => (
                <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
              ))}
            </ul>
          </nav>
          <div className="header-actions">
            <div className="header-social">
              <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Globe size={14} />
              </a>
              <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <MessageCircle size={14} />
              </a>
              <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <Send size={14} />
              </a>
            </div>
            <button className="search-icon" title="Buscar" onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar">
              {searchOpen ? <X size={16} /> : <Search size={16} />}
            </button>
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} title="Menú" aria-label="Menú">
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="mobile-search-overlay" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 12px' }}>
            <input
              type="text"
              placeholder="Buscar noticias..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const q = (e.target as HTMLInputElement).value;
                  if (q) window.location.href = `/buscar?q=${encodeURIComponent(q)}`;
                }
              }}
              aria-label="Buscar noticias"
            />
          </div>
        )}
        <div className={`mobile-nav${menuOpen ? ' active' : ''}`}>
          <ul>
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link 
                  href={link.href} 
                  onClick={() => setMenuOpen(false)}
                  data-cat={link.href.includes('categoria/') ? link.href.split('/')[2] : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* Radio Player */}
      <RadioPlayer />

      {/* Breaking Bar with carousel */}
      {tickerItems && tickerItems.length > 0 && (
        <div className="breaking-bar">
          <div className="breaking-inner">
            <span className="breaking-label">Última Hora</span>
            <div className="breaking-ticker" style={{ overflow: 'hidden', flex: 1, position: 'relative', height: 44 }}>
              {tickerItems.map((n, i) => (
                <Link
                  key={n.id}
                  href={`/noticias/${n.slug}`}
                  className="breaking-item"
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    opacity: i === tickerIdx ? 1 : 0,
                    transform: i === tickerIdx ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease',
                    pointerEvents: i === tickerIdx ? 'auto' : 'none',
                  }}
                >
                  <span className="time">AHORA</span>
                  {n.titulo}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main id="main-content">{children}</main>

      {/* Footer Profesional (El Espectador style) */}
      <footer className="footer-premium">
        <div className="footer-premium-inner">
          {/* Línea dorada decorativa */}
          <div className="footer-premium-line" />

          {/* Fila superior: Logo + redes + links principales */}
          <div className="footer-premium-top">
            <div className="footer-premium-top-left">
              <img src="/logo.png" alt="Nicaragua Informate" width={40} height={40} />
              <div>
                <div className="brand-name">Nicaragua Informate</div>
                <div className="brand-tag">Periodismo verificado desde Estelí</div>
              </div>
            </div>
            <div className="footer-premium-top-social">
              <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Globe size={14} strokeWidth={2} />
              </a>
              <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <MessageCircle size={14} strokeWidth={2} />
              </a>
              <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <Send size={14} strokeWidth={2} />
              </a>
              <a href="mailto:info@nicaraguainformate.com" aria-label="Email">
                <Mail size={14} strokeWidth={2} />
              </a>
            </div>
            <div className="footer-premium-top-links">
              <Link href="/nosotros">Nosotros</Link>
              <Link href="/contacto">Contacto</Link>
              <Link href="/politica-editorial">Política Editorial</Link>
            </div>
          </div>

          {/* Fila legal con separadores */}
          <div className="footer-premium-legal">
            <Link href="/terminos">Términos y condiciones</Link>
            <span className="sep">|</span>
            <Link href="/privacidad">Política de privacidad</Link>
            <span className="sep">|</span>
            <Link href="/cookies">Política de cookies</Link>
            <span className="sep">|</span>
            <Link href="/mapa-del-sitio">Mapa del sitio</Link>
          </div>

          {/* Copyright */}
          <div className="footer-premium-copyright">
            © {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados. Portal de noticias líder de Nicaragua con cobertura periodística verificada sobre política, economía, deportes, tecnología, sucesos y cultura. Estelí, Nicaragua.
          </div>
        </div>
      </footer>

      {/* Bottom Nav Mobile */}
      <nav className="bottom-nav">
        <Link href="/" className="bottom-nav-item active"><Home size={22} strokeWidth={1.5} /><span>Inicio</span></Link>
        <Link href="/categoria/internacionales" className="bottom-nav-item"><Globe size={22} strokeWidth={1.5} /><span>Mundo</span></Link>
        <Link href="/radio" className="bottom-nav-item"><Radio size={22} strokeWidth={1.5} /><span>Radio</span></Link>
        <Link href="/contacto" className="bottom-nav-item"><MessageSquare size={22} strokeWidth={1.5} /><span>Contacto</span></Link>
        <Link href="/nosotros" className="bottom-nav-item"><User size={22} strokeWidth={1.5} /><span>Nosotros</span></Link>
      </nav>
    </>
  );
}
