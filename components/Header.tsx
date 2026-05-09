'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { CATEGORIES } from '@/lib/types';

/**
 * URLs de redes sociales
 */
const SOCIAL_URLS = {
  facebook: 'https://facebook.com/profile.php?id=61578261125687',
  whatsapp: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
  telegram: 'https://t.me/+fHHjncJqMQM3NjZh',
} as const;

/**
 * Clave de localStorage para tema
 */
const THEME_STORAGE_KEY = 'ni_theme';

/**
 * Tipos de tema válidos
 */
type ThemeType = 'light' | 'dark';

/**
 * Props para Header
 */
interface HeaderProps {
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
}

/**
 * Componente de header del sitio
 * @param props Props del componente
 * @returns Header con navegación y controles de tema
 */
export default function Header({ activeCategory = 'Todas', onCategoryChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [today, setToday] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeType | null;
      const validThemes: ThemeType[] = ['light', 'dark'];
      const initial = saved && validThemes.includes(saved) 
        ? saved 
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    } catch (error) {
      console.error('[Header] Error reading theme from localStorage:', error instanceof Error ? error.message : String(error));
      const initial = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    }

    setToday(
      new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    );

    // Scroll detection for collapsible header
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    try {
      const next: ThemeType = theme === 'dark' ? 'light' : 'dark';
      setTheme(next);
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
      console.error('[Header] Error saving theme to localStorage:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleCategory = (cat: string) => {
    setMenuOpen(false);
    onCategoryChange?.(cat);
  };

  return (
    <>
      {/* Top Bar - Hidden on scroll for PWA experience */}
      <div className="top-bar" style={{ 
        background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        transition: 'transform 0.3s ease',
        transform: isScrolled ? 'translateY(-100%)' : 'translateY(0)',
        position: 'relative',
        zIndex: 1001
      }}>
        <div className="top-bar-inner">
          <div className="top-bar-left">
            <span suppressHydrationWarning><i className="far fa-calendar-alt" style={{ color: '#e53e3e' }} /> {today}</span>
            <span><i className="fas fa-map-marker-alt" style={{ color: '#e53e3e' }} /> Estelí, Nicaragua</span>
          </div>
          <div className="top-bar-right">
            <a href={SOCIAL_URLS.facebook} target="_blank" rel="noopener" aria-label="Facebook" className="top-icon-hover">
              <i className="fab fa-facebook-f" />
            </a>
            <a href={SOCIAL_URLS.whatsapp} target="_blank" rel="noopener" aria-label="WhatsApp" className="top-icon-hover">
              <i className="fab fa-whatsapp" />
            </a>
            <a href={SOCIAL_URLS.telegram} target="_blank" rel="noopener" aria-label="Telegram" className="top-icon-hover">
              <i className="fab fa-telegram-plane" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Header - Collapsible on scroll */}
      <header 
        className="header glass" 
        id="header" 
        style={{ 
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
          borderBottom: '1px solid rgba(140,29,24,0.15)',
          transition: 'all 0.3s ease',
          position: isScrolled ? 'fixed' : 'relative',
          top: isScrolled ? '0' : 'auto',
          zIndex: isScrolled ? 1000 : 'auto'
        }}
      >
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Nicaragua Informate - Inicio">
            <Image 
              src="/logo.png" 
              className="brand-logo logo-hover" 
              alt="Nicaragua Informate" 
              width={isScrolled ? 40 : 48} 
              height={isScrolled ? 40 : 48} 
              style={{ transition: 'all 0.3s ease' }}
            />
            {!isScrolled && (
              <div className="brand-info" style={{ transition: 'opacity 0.3s ease' }}>
                <span className="brand-title">Nicaragua Informate</span>
                <span className="brand-tagline">Periodismo de Precisión</span>
              </div>
            )}
          </Link>

          <nav className="nav" role="navigation" aria-label="Navegación principal" style={{ transition: 'opacity 0.3s ease' }}>
            <button
              className={`nav-link nav-red-hover${activeCategory === 'Todas' ? ' active' : ''}`}
              onClick={() => handleCategory('Todas')}
            >
              <i className="fas fa-home" aria-hidden="true" />
              Inicio
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                className={`nav-link nav-red-hover${activeCategory === cat.name ? ' active' : ''}`}
                onClick={() => handleCategory(cat.name)}
              >
                <i className={`fas ${cat.icon}`} style={{ color: cat.color }} aria-hidden="true" />
                {cat.name}
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

      {/* Spacer for fixed header */}
      {isScrolled && <div style={{ height: '80px' }} />}

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
            <button
              className={`mobile-menu-link${activeCategory === 'Todas' ? ' active' : ''}`}
              onClick={() => handleCategory('Todas')}
              style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
            >
              <i className="fas fa-home" />
              Inicio
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                className={`mobile-menu-link${activeCategory === cat.name ? ' active' : ''}`}
                onClick={() => handleCategory(cat.name)}
                style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
              >
                <i className={`fas ${cat.icon}`} style={{ color: cat.color }} />
                {cat.name}
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
