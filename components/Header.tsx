'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { CATEGORIES } from '@/lib/types';

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
      <style>{`
        .theme-btn { width:36px; height:36px; border-radius:50%; border:1px solid var(--border); background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text-muted); transition:all .2s; }
        .theme-btn:hover { border-color:var(--accent); color:var(--accent); }
        .mobile-toggle { display:none; width:36px; height:36px; border-radius:8px; border:1px solid var(--border); background:transparent; cursor:pointer; align-items:center; justify-content:center; color:var(--text); }
        .mobile-toggle:hover { background:var(--bg-warm); }
        .mobile-drawer { position:fixed; inset:0; z-index:1001; display:flex; flex-direction:column; background:rgba(255,255,255,0.98); backdrop-filter:blur(16px); transform:translateX(100%); transition:transform .3s ease; }
        .mobile-drawer.open { transform:translateX(0); }
        .mobile-drawer-header { display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-bottom:1px solid var(--border); }
        .mobile-drawer-nav { display:flex; flex-direction:column; padding:16px 24px; gap:4px; }
        .mobile-drawer-nav a { padding:12px 16px; border-radius:var(--radius-sm); font-size:15px; font-weight:600; color:var(--text); text-decoration:none; display:flex; align-items:center; gap:10px; transition:all .15s; }
        .mobile-drawer-nav a:hover { background:var(--bg-warm); color:var(--accent); }
        .mobile-drawer-nav a.active { color:var(--accent); background:rgba(196,30,58,0.06); }
        @media (max-width:768px) { .nav-pro { display:none !important; } .mobile-toggle { display:flex !important; } }
      `}</style>

      {/* Top Bar */}
      <div className="top-bar" style={{
        transition: 'transform 0.3s ease',
        transform: isScrolled ? 'translateY(-100%)' : 'translateY(0)',
      }}>
        <div className="top-bar-inner">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', opacity: 0.8 }}>
            <span>📍 Estelí, Nicaragua</span>
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
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.name}>
                  <Link href={`/noticias?cat=${encodeURIComponent(cat.name)}`} className={activeCategory === cat.name ? 'active' : ''}>
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
            <Link key={cat.name} href={`/noticias?cat=${encodeURIComponent(cat.name)}`} className={activeCategory === cat.name ? 'active' : ''} onClick={() => setMenuOpen(false)}>
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
