'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { CATEGORIES, categoryToSlug } from '@/lib/types';

const THEME_STORAGE_KEY = 'ni_theme';
type ThemeType = 'light' | 'dark';

interface HeaderProps {
  activeCategory?: string;
}

export default function Header({ activeCategory = 'Todas' }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('light');
  const [today, setToday] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeType | null;
      const validThemes: ThemeType[] = ['light', 'dark'];
      const initial = saved && validThemes.includes(saved)
        ? saved
        : 'light';
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    } catch {
      setTheme('light');
    }

    setToday(
      new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    );

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const next: ThemeType = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
  };

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar" style={{
        transition: 'transform 0.3s ease',
        transform: isScrolled ? 'translateY(-100%)' : 'translateY(0)',
      }}>
        <div className="top-bar-inner">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', opacity: 0.8 }}>
            <span>📍 Managua, Nicaragua</span>
            <span suppressHydrationWarning>{today}</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/nosotros">Sobre Nosotros</Link>
            <Link href="/contacto">Contacto</Link>
            <Link href="/feed.xml">RSS</Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="header-pro">
        <div className="header-pro-inner">
          <Link href="/" className="logo-pro">
            Nicaragua <span>Informate</span>
          </Link>

          <nav>
            <ul className="nav-pro">
              <li><Link href="/" className={activeCategory === 'Todas' ? 'active' : ''}>Inicio</Link></li>
              {CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <Link href={`/${categoryToSlug(cat.name)}`} className={activeCategory === cat.name ? 'active' : ''}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="theme-btn" onClick={toggleTheme} aria-label="Cambiar tema">
              <span suppressHydrationWarning>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </span>
            </button>
            <button className="mobile-toggle" onClick={() => setMenuOpen(true)} aria-label="Menú">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer${menuOpen ? ' open' : ''}`}>
        <div className="mobile-drawer-header">
          <span className="logo-pro">Nicaragua <span>Informate</span></span>
          <button className="theme-btn" onClick={() => setMenuOpen(false)} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <nav className="mobile-drawer-nav">
          <Link href="/" className={activeCategory === 'Todas' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Inicio</Link>
          {CATEGORIES.map((cat) => (
            <Link key={cat.name} href={`/${categoryToSlug(cat.name)}`} className={activeCategory === cat.name ? 'active' : ''} onClick={() => setMenuOpen(false)}>
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
