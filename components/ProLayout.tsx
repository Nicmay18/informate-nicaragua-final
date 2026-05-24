'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Menu, X, Moon, Sun, Home, Globe, Radio, MessageSquare, User,
  MessageCircle, Send, Mail,
} from 'lucide-react';
import type { Noticia } from '@/lib/types';
import WorldClock from './WorldClock';
import RadioPlayer from './RadioPlayer';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/categoria/nacionales', label: 'Nacionales' },
  { href: '/categoria/sucesos', label: 'Sucesos' },
  { href: '/categoria/internacionales', label: 'Internacionales' },
  { href: '/categoria/tecnologia', label: 'Tecnología' },
  { href: '/categoria/economia', label: 'Economía' },
  { href: '/categoria/deportes', label: 'Deportes' },
];

const SOCIAL_LINKS = [
  { href: 'https://facebook.com/profile.php?id=61578261125687', label: 'Facebook' },
  { href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17', label: 'WhatsApp' },
  { href: 'https://t.me/+fHHjncJqMQM3NjZh', label: 'Telegram' },
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
  const [dateStr, setDateStr] = useState('');
  const { theme, toggle } = useTheme();
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    if (!tickerItems?.length) return;
    const t = setInterval(() => setTickerIdx(p => (p + 1) % tickerItems.length), 5000);
    return () => clearInterval(t);
  }, [tickerItems]);

  useEffect(() => {
    const hoy = new Date();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    setDateStr(`${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`);
  }, []);

  // Progress bar scroll
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop || document.body.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      setScrollProgress(height > 0 ? (scrolled / height) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Progress Bar */}
      <div className="progress-bar" style={{ width: `${scrollProgress}%` }} />

      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-inner">
          <time className="top-bar-date" dateTime={new Date().toISOString().split('T')[0]} suppressHydrationWarning>{dateStr}</time>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <WorldClock />
            <ul className="top-bar-social">
              {SOCIAL_LINKS.map(link => (
                <li key={link.label}><a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">
            <img src="/logo.png" alt="Nicaragua Informate" width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            <div className="logo-text">
              Nicaragua Informate
              <small>Noticias de Nicaragua y el mundo</small>
            </div>
          </Link>
          <span className="tagline-desktop">Periodismo verificado desde Estelí, Nicaragua</span>
          <nav aria-label="Navegación principal">
            <ul className="nav">
              {NAV_LINKS.map(link => (
                <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
              ))}
            </ul>
          </nav>
          <div className="header-actions">
            {/* Buscador visible en desktop */}
            <div className="header-search-desktop">
              <input
                type="text"
                placeholder="Buscar..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const q = (e.target as HTMLInputElement).value;
                    if (q) window.location.href = `/buscar?q=${encodeURIComponent(q)}`;
                  }
                }}
                aria-label="Buscar noticias"
              />
              <Search size={14} />
            </div>
            <button className="search-icon" title="Buscar" onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar">
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
            <button className="theme-toggle" onClick={toggle} title="Cambiar tema" aria-label="Cambiar tema">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} title="Menú" aria-label="Menú">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
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
              <li key={link.href}><Link href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link></li>
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

      {/* Footer Premium */}
      <footer className="footer-premium">
        <div className="footer-premium-inner">
          {/* Main Grid */}
          <div className="footer-premium-grid">
            {/* Brand */}
            <div className="footer-premium-brand">
              <Link href="/" className="footer-premium-logo">
                <img src="/logo.png" alt="" width={40} height={40} />
                <div>
                  <span>Nicaragua Informate</span>
                  <small>Periodismo verificado desde Estelí</small>
                </div>
              </Link>
              <p className="footer-premium-desc">
                Portal de noticias líder de Nicaragua. Cobertura periodística verificada sobre política, economía, deportes, tecnología, sucesos y cultura.
              </p>
              <div className="footer-premium-social">
                <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <Globe size={16} strokeWidth={2} />
                </a>
                <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <MessageCircle size={16} strokeWidth={2} />
                </a>
                <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                  <Send size={16} strokeWidth={2} />
                </a>
                <a href="mailto:info@nicaraguainformate.com" aria-label="Email">
                  <Mail size={16} strokeWidth={2} />
                </a>
              </div>
            </div>

            {/* Secciones */}
            <div className="footer-premium-col">
              <h4>Secciones</h4>
              <ul>
                <li><Link href="/categoria/nacionales">Nacionales</Link></li>
                <li><Link href="/categoria/sucesos">Sucesos</Link></li>
                <li><Link href="/categoria/internacionales">Internacionales</Link></li>
                <li><Link href="/categoria/deportes">Deportes</Link></li>
                <li><Link href="/categoria/economia">Economía</Link></li>
                <li><Link href="/categoria/tecnologia">Tecnología</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="footer-premium-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/nosotros">Nosotros</Link></li>
                <li><Link href="/privacidad">Privacidad</Link></li>
                <li><Link href="/terminos">Términos</Link></li>
                <li><Link href="/cookies">Cookies</Link></li>
                <li><Link href="/contacto">Contacto</Link></li>
              </ul>
            </div>

            {/* Redes */}
            <div className="footer-premium-col">
              <h4>Síguenos</h4>
              <ul>
                <li><a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                <li><a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
                <li><a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener noreferrer">Telegram</a></li>
              </ul>
            </div>

            {/* Contacto */}
            <div className="footer-premium-col">
              <h4>Contacto</h4>
              <ul>
                <li><Link href="/contacto">Redacción</Link></li>
                <li><Link href="/contacto">Publicidad</Link></li>
                <li><span>Estelí, Nicaragua</span></li>
                <li><a href="mailto:info@nicaraguainformate.com">info@nicaraguainformate.com</a></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="footer-premium-divider" />

          {/* Bottom */}
          <div className="footer-premium-bottom">
            <p>© {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados.</p>
            <nav aria-label="Enlaces legales">
              <Link href="/terminos">Términos</Link>
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/cookies">Cookies</Link>
              <Link href="/politica-editorial">Política Editorial</Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* Bottom Nav Mobile */}
      <nav className="bottom-nav">
        <Link href="/" className="bottom-nav-item active"><Home size={22} strokeWidth={1.5} /><span>Inicio</span></Link>
        <Link href="/categoria/internacionales" className="bottom-nav-item"><Globe size={22} strokeWidth={1.5} /><span>Mundo</span></Link>
        <Link href="/radio" className="bottom-nav-item"><Radio size={22} strokeWidth={1.5} /><span>Radio</span></Link>
        <Link href="/contacto" className="bottom-nav-item"><MessageSquare size={22} strokeWidth={1.5} /><span>Chat</span></Link>
        <Link href="/nosotros" className="bottom-nav-item"><User size={22} strokeWidth={1.5} /><span>Perfil</span></Link>
      </nav>
    </>
  );
}
