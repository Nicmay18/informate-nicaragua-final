'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Menu, X, Moon, Sun, ArrowLeft, Home, Globe, Radio, MessageSquare, User,
} from 'lucide-react';
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
  tickerText,
}: {
  children: React.ReactNode;
  tickerText?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dateStr, setDateStr] = useState('');
  const { theme, toggle } = useTheme();

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

      {/* World Clock */}
      <WorldClock />

      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-inner">
          <span className="top-bar-date" suppressHydrationWarning>{dateStr}</span>
          <ul className="top-bar-social">
            {SOCIAL_LINKS.map(link => (
              <li key={link.label}><a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a></li>
            ))}
          </ul>
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
          <nav>
            <ul className="nav">
              {NAV_LINKS.map(link => (
                <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
              ))}
            </ul>
          </nav>
          <div className="header-actions">
            <button className="search-icon" title="Buscar" onClick={() => setSearchOpen(!searchOpen)}>
              {searchOpen ? <X size={16} /> : <Search size={16} />}
            </button>
            <button className="theme-toggle" onClick={toggle} title="Cambiar tema">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} title="Menú">
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
        {searchOpen && (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 12px' }}>
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

      {/* Breaking Bar with ticker animation */}
      {tickerText && (
        <div className="breaking-bar">
          <span className="breaking-label">Última Hora</span>
          <div className="breaking-ticker">
            <Link href="/noticias" className="breaking-item">
              <span className="time">AHORA</span>
              {tickerText}
            </Link>
            <Link href="/noticias" className="breaking-item">
              <span className="time">AHORA</span>
              {tickerText}
            </Link>
          </div>
        </div>
      )}

      {/* Main */}
      <main id="main-content">{children}</main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <Link href="/" className="footer-logo">
              Nicaragua Informate
              <small>Periodismo verificado</small>
            </Link>
            <Link href="/" className="footer-home-link"><ArrowLeft size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Volver al inicio</Link>
          </div>
          <div className="footer-grid">
            <div className="footer-column">
              <h3 className="footer-heading">Secciones</h3>
              <ul>
                <li><Link href="/categoria/nacionales">Nacionales</Link></li>
                <li><Link href="/categoria/sucesos">Sucesos</Link></li>
                <li><Link href="/categoria/internacionales">Internacionales</Link></li>
                <li><Link href="/categoria/deportes">Deportes</Link></li>
                <li><Link href="/categoria/economia">Economía</Link></li>
                <li><Link href="/categoria/tecnologia">Tecnología</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3 className="footer-heading">Legal</h3>
              <ul>
                <li><Link href="/nosotros">Nosotros</Link></li>
                <li><Link href="/privacidad">Privacidad</Link></li>
                <li><Link href="/terminos">Términos</Link></li>
                <li><Link href="/cookies">Cookies</Link></li>
                <li><Link href="/contacto">Contacto</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3 className="footer-heading">Síguenos</h3>
              <ul>
                <li><a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                <li><a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
                <li><a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener noreferrer">Telegram</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3 className="footer-heading">Contacto</h3>
              <ul>
                <li><Link href="/contacto">Redacción</Link></li>
                <li><Link href="/contacto">Publicidad</Link></li>
                <li><span>Estelí, Nicaragua</span></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados.</p>
            <ul className="footer-bottom-links">
              <li><Link href="/terminos">Términos</Link></li>
              <li><Link href="/privacidad">Privacidad</Link></li>
              <li><Link href="/cookies">Cookies</Link></li>
            </ul>
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
