'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const CATEGORIES = [
  { label: 'Inicio', icon: 'fa-home', value: 'Todas' },
  { label: 'Sucesos', icon: 'fa-exclamation-triangle', value: 'Sucesos', color: 'var(--cat-sucesos)' },
  { label: 'Nacionales', icon: 'fa-building-columns', value: 'Nacionales', color: 'var(--cat-nacionales)' },
  { label: 'Deportes', icon: 'fa-futbol', value: 'Deportes', color: 'var(--cat-deportes)' },
  { label: 'Internacionales', icon: 'fa-globe', value: 'Internacionales', color: 'var(--cat-internacionales)' },
  { label: 'Espectáculos', icon: 'fa-film', value: 'Espectáculos', color: 'var(--cat-espectaculo)' },
];

interface HeaderProps {
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
}

export default function Header({ activeCategory = 'Todas', onCategoryChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [today, setToday] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('ni_theme') as 'light' | 'dark' | null;
    const initial = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);

    setToday(
      new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    );
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ni_theme', next);
  };

  const handleCategory = (cat: string) => {
    setMenuOpen(false);
    onCategoryChange?.(cat);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar" style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div className="top-bar-inner">
          <div className="top-bar-left">
            <span><i className="far fa-calendar-alt" style={{ color: '#e53e3e' }} /> {today}</span>
            <span><i className="fas fa-map-marker-alt" style={{ color: '#e53e3e' }} /> Managua, Nicaragua</span>
          </div>
          <div className="top-bar-right">
            <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener" aria-label="Facebook" className="top-icon-hover">
              <i className="fab fa-facebook-f" />
            </a>
            <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener" aria-label="WhatsApp" className="top-icon-hover">
              <i className="fab fa-whatsapp" />
            </a>
            <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener" aria-label="Telegram" className="top-icon-hover">
              <i className="fab fa-telegram-plane" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="header glass" id="header" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(140,29,24,0.15)' }}>
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Nicaragua Informate - Inicio">
            <Image src="/logo.png" className="brand-logo logo-hover" alt="Nicaragua Informate" width={48} height={48} />
            <div className="brand-info">
              <span className="brand-title">Nicaragua Informate</span>
              <span className="brand-tagline">Periodismo de Precisión</span>
            </div>
          </Link>

          <nav className="nav" role="navigation" aria-label="Navegación principal">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={`nav-link nav-red-hover${activeCategory === cat.value ? ' active' : ''}`}
                onClick={() => handleCategory(cat.value)}
              >
                <i className={`fas ${cat.icon}`} style={cat.color ? { color: cat.color } : undefined} aria-hidden="true" />
                {cat.label}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="mobile-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Menú"
              aria-expanded={menuOpen}
            >
              <i className="fas fa-bars" aria-hidden="true" />
            </button>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Cambiar tema"
            >
              <i className={`fas fa-${theme === 'dark' ? 'sun' : 'moon'}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
        <div className="mobile-menu-panel mobile-menu-panel-glass">
          <div className="mobile-menu-header">
            <span className="brand-title">Nicaragua Informate</span>
            <button className="mobile-menu-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
              <i className="fas fa-times" />
            </button>
          </div>
          <nav className="mobile-menu-nav">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={`mobile-menu-link${activeCategory === cat.value ? ' active' : ''}`}
                onClick={() => handleCategory(cat.value)}
                style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
              >
                <i className={`fas ${cat.icon}`} style={cat.color ? { color: cat.color } : undefined} />
                {cat.label}
              </button>
            ))}
            <Link href="/noticias" className="mobile-menu-link" onClick={() => setMenuOpen(false)}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, color: '#8c1d18', fontWeight: 700, borderTop: '1px solid rgba(140,29,24,0.15)', marginTop: 8 }}>
              <i className="fas fa-newspaper" style={{ color: '#8c1d18' }} />
              Todas las Noticias
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
