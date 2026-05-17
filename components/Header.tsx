'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X, Search, Radio } from 'lucide-react';
import { categoryToSlug } from '@/lib/types';

const THEME_STORAGE_KEY = 'ni_theme';
type ThemeType = 'light' | 'dark';

interface HeaderProps {
  activeCategory?: string;
}

const NAV_LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Sucesos', href: '/sucesos' },
  { label: 'Nacionales', href: '/nacionales' },
  { label: 'Internacionales', href: '/internacionales' },
  { label: 'Deportes', href: '/deportes' },
  { label: 'Tecnología', href: '/tecnologia' },
  { label: 'Espectáculos', href: '/espectaculos' },
];

export default function Header({ activeCategory = 'Todas' }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('light');
  const [today, setToday] = useState('');
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeType | null;
      const initial = saved === 'dark' ? 'dark' : 'light';
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    } catch { setTheme('light'); }

    setToday(new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

    const handleScroll = () => {
      const current = window.scrollY;
      setScrolled(current > 30);
      // Móvil: oculta al bajar, revela al subir (>100px)
      if (window.innerWidth < 768) {
        if (current > lastScrollY && current > 100) setHidden(true);
        else setHidden(false);
      }
      setLastScrollY(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleTheme = () => {
    const next: ThemeType = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
  };

  const isActive = (href: string) => {
    if (href === '/') return activeCategory === 'Todas';
    return href === `/${categoryToSlug(activeCategory)}`;
  };

  return (
    <>
      {/* ─── TOP BAR ─── Escritorio visible, móvil oculto */}
      <div className="ni-topbar">
        <div className="ni-topbar-inner">
          <div className="ni-topbar-left">
            <span>📍 Managua, Nicaragua</span>
            <span className="ni-topbar-sep">|</span>
            <span suppressHydrationWarning>{today}</span>
          </div>
          <div className="ni-topbar-right">
            <Link href="/nosotros">Sobre Nosotros</Link>
            <Link href="/contacto">Contacto</Link>
            <Link href="/feed.xml">RSS</Link>
          </div>
        </div>
      </div>

      {/* ─── HEADER PRINCIPAL ─── */}
      <header className={`ni-header${hidden ? ' ni-header--hidden' : ''}${scrolled ? ' ni-header--scrolled' : ''}`}>
        <div className="ni-header-inner">
          {/* Móvil: Menú hamburguesa */}
          <button className="ni-header-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link href="/" className="ni-header-logo">
            <span className="ni-header-logo-bold">Nicaragua</span>
            <span className="ni-header-logo-light">Informate</span>
          </Link>

          {/* Escritorio: Navegación */}
          <nav className="ni-header-nav">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`ni-header-nav-link${isActive(link.href) ? ' active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Acciones derecha: escritorio tiene search + radio + theme */}
          <div className="ni-header-actions">
            <button className="ni-header-icon-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar">
              <Search size={20} />
            </button>
            <button className="ni-header-icon-btn ni-header-radio-btn" aria-label="Radio">
              <Radio size={20} />
            </button>
            <button className="ni-header-icon-btn ni-header-theme-btn" onClick={toggleTheme} aria-label="Cambiar tema">
              <span suppressHydrationWarning>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </span>
            </button>
          </div>
        </div>

        {/* Barra de búsqueda expandible */}
        {searchOpen && (
          <div className="ni-header-search">
            <form action="/buscar" method="GET" className="ni-header-search-form">
              <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="search"
                name="q"
                placeholder="Buscar noticias..."
                autoFocus
                className="ni-header-search-input"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="ni-header-search-close">
                <X size={18} />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ─── MOBILE DRAWER ─── */}
      <div className={`ni-drawer${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className="ni-drawer-panel" onClick={e => e.stopPropagation()}>
          <div className="ni-drawer-header">
            <span className="ni-header-logo">
              <span className="ni-header-logo-bold">Nicaragua</span>
              <span className="ni-header-logo-light">Informate</span>
            </span>
            <button className="ni-header-icon-btn" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
              <X size={24} />
            </button>
          </div>
          <nav className="ni-drawer-nav">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`ni-drawer-link${isActive(link.href) ? ' active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="ni-drawer-divider" />
            <Link href="/nosotros" className="ni-drawer-link" onClick={() => setMenuOpen(false)}>Sobre Nosotros</Link>
            <Link href="/contacto" className="ni-drawer-link" onClick={() => setMenuOpen(false)}>Contacto</Link>
            <Link href="/politica-editorial" className="ni-drawer-link" onClick={() => setMenuOpen(false)}>Política Editorial</Link>
            <div className="ni-drawer-divider" />
            <button className="ni-drawer-link" onClick={() => { toggleTheme(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span suppressHydrationWarning style={{ display: 'flex', alignItems: 'center' }}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </span>
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
