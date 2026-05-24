// File: components/Header.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sun, Moon, Menu, X, Search } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import MobileMenu from './MobileMenu';

const CATEGORIES = [
  { slug: 'nacionales', label: 'Nacionales' },
  { slug: 'sucesos', label: 'Sucesos' },
  { slug: 'internacionales', label: 'Internacionales' },
  { slug: 'tecnologia', label: 'Tecnología' },
  { slug: 'economia', label: 'Economía' },
  { slug: 'deportes', label: 'Deportes' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme, isLoaded: isMounted } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/buscar?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">
            <span>Nicaragua Informate</span>
          </Link>

          <nav className="nav">
            <li><Link href="/">Inicio</Link></li>
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/categoria/${cat.slug}`}>{cat.label}</Link>
              </li>
            ))}
          </nav>

          <div className="header-actions">
            <form
              className={`header-search${searchExpanded ? ' expanded' : ''}`}
              onSubmit={handleSearch}
            >
              <input
                type="text"
                className="header-search-input"
                placeholder="Buscar noticias de Nicaragua..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar noticias"
              />
              <button
                type="button"
                className="header-search-btn"
                onClick={() => setSearchExpanded(!searchExpanded)}
                aria-label="Abrir búsqueda"
              >
                <Search size={20} />
              </button>
            </form>

            {isMounted && (
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon size={18} />
                ) : (
                  <Sun size={18} />
                )}
              </button>
            )}

            <button
              className="menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        categories={CATEGORIES}
      />
    </>
  );
}
