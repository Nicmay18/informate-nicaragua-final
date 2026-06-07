'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const CATEGORIES = [
  { slug: 'sucesos', label: 'Sucesos' },
  { slug: 'nacionales', label: 'Nacionales' },
  { slug: 'espectaculos', label: 'Espectáculos' },
  { slug: 'deportes', label: 'Deportes' },
  { slug: 'tecnologia', label: 'Tecnología' },
  { slug: 'internacionales', label: 'Internacionales' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerDateIso, setHeaderDateIso] = useState('');
  const [headerDateHuman, setHeaderDateHuman] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const now = new Date();
    setHeaderDateIso(now.toISOString());
    setHeaderDateHuman(
      now.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    );
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/buscar?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header className="ni-header">
        {/* Top bar: logo + fecha + acciones */}
        <div className="ni-header__top">
          <Link href="/" className="ni-logo" aria-label="Nicaragua Informate — Ir a la portada">
            <Image
              src="/logo.svg"
              alt="Nicaragua Informate"
              width={42}
              height={42}
              className="ni-logo__img"
              priority
            />
            <div className="ni-logo__text">
              <strong>Nicaragua Informate</strong>
              <span className="ni-logo__tagline">INFORMATE AL INSTANTE</span>
            </div>
          </Link>

          <time className="ni-header__date" dateTime={headerDateIso} suppressHydrationWarning>
            {headerDateHuman}
          </time>

          <div className="ni-header__actions">
            {/* Buscador */}
            <form
              onSubmit={handleSearch}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                aria-label="Buscar noticias"
                style={{
                  width: 140,
                  height: 36,
                  padding: '0 12px',
                  border: '1px solid #e5e5e5',
                  borderRadius: 20,
                  fontSize: 13,
                  outline: 'none',
                  transition: 'width 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.width = '200px'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.05)'; }}
                onBlur={(e) => { if (!searchQuery) { e.currentTarget.style.width = '140px'; e.currentTarget.style.boxShadow = 'none'; } }}
              />
              <button
                type="submit"
                className="ni-search-btn"
                aria-label="Buscar noticias"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>

            {/* Menú hamburguesa */}
            <button
              className="ni-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Barra de navegación */}
        <nav className="ni-header__nav" aria-label="Navegación principal">
          <ul className="ni-nav">
            <li><Link href="/">Inicio</Link></li>
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/categoria/${cat.slug}`}>{cat.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="ni-mobile-menu" role="dialog" aria-modal="true">
          <div className="ni-mobile-menu__overlay" onClick={() => setMenuOpen(false)} />
          <nav className="ni-mobile-menu__content">
            <button
              className="ni-mobile-menu__close"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
            <ul className="ni-mobile-menu__nav">
              <li><Link href="/" onClick={() => setMenuOpen(false)}>Inicio</Link></li>
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`} onClick={() => setMenuOpen(false)}>
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
