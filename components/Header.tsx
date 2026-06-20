'use client';

import Link from 'next/link';

const NoPrefetchLink = (props: React.ComponentProps<typeof Link>) => (
  <Link {...props} prefetch={false} />
);
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerDateIso, setHeaderDateIso] = useState('');
  const [headerDateHuman, setHeaderDateHuman] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

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
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="ni-header">
        {/* Top bar: logo + fecha + acciones */}
        <div className="ni-header__top">
          <NoPrefetchLink href="/" className="ni-logo" aria-label="Nicaragua Informate — Ir a la portada">
            <Image
              src="/logo.webp"
              alt="Nicaragua Informate"
              width={128}
              height={128}
              sizes="128px"
              className="ni-logo__img"
            />
            <div className="ni-logo__text">
              <strong>Nicaragua Informate</strong>
              <span className="ni-logo__tagline">INFORMATE AL INSTANTE</span>
            </div>
          </NoPrefetchLink>

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
                  width: searchFocused ? 200 : 140,
                  height: 36,
                  padding: '0 12px',
                  border: '1px solid #e5e5e5',
                  borderRadius: 20,
                  fontSize: 13,
                  outline: 'none',
                  transition: 'width 0.2s, box-shadow 0.2s',
                  boxShadow: searchFocused ? '0 0 0 2px rgba(0,0,0,0.05)' : 'none',
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
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
            <li><NoPrefetchLink href="/">Inicio</NoPrefetchLink></li>
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <NoPrefetchLink href={`/categoria/${cat.slug}`}>{cat.label}</NoPrefetchLink>
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
              <li><NoPrefetchLink href="/" onClick={() => setMenuOpen(false)}>Inicio</NoPrefetchLink></li>
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <NoPrefetchLink href={`/categoria/${cat.slug}`} onClick={() => setMenuOpen(false)}>
                    {cat.label}
                  </NoPrefetchLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
