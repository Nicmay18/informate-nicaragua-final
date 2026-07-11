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

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  ...CATEGORIES.map(c => ({ href: `/categoria/${c.slug}`, label: c.label })),
];

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className={`ni-header ${scrolled ? 'ni-header--scrolled' : ''}`}>
        <div className="ni-header__inner">
          <NoPrefetchLink href="/" className="ni-logo" aria-label="Nicaragua Informate — Ir a la portada">
            <Image
              src="/logo.webp"
              alt="Nicaragua Informate"
              width={128}
              height={128}
              sizes="128px"
              className="ni-logo__img"
            />
            <span className="ni-logo__wordmark">NICARAGUA INFORMATE</span>
          </NoPrefetchLink>

          <nav className="ni-header__nav" aria-label="Navegación principal">
            <ul className="ni-nav">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <NoPrefetchLink href={link.href} className="ni-nav-link">
                    {link.label}
                  </NoPrefetchLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ni-header__actions">
            <NoPrefetchLink href="/radio" className="ni-live-btn" aria-label="Radio en vivo">
              <span className="ni-live-dot" aria-hidden="true" />
              EN VIVO
            </NoPrefetchLink>

            <form onSubmit={handleSearch} className="ni-search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                aria-label="Buscar noticias"
                className="ni-search-input"
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
      </header>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="ni-mobile-menu" role="dialog" aria-modal="true">
          <div className="ni-mobile-menu__overlay" onClick={() => setMenuOpen(false)} role="button" aria-label="Cerrar menú" tabIndex={-1} />
          <nav className="ni-mobile-menu__content">
            <button
              className="ni-mobile-menu__close"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
            <ul className="ni-mobile-menu__nav">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <NoPrefetchLink href={link.href} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </NoPrefetchLink>
                </li>
              ))}
              <li><NoPrefetchLink href="/radio" onClick={() => setMenuOpen(false)}>Radio en vivo</NoPrefetchLink></li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
