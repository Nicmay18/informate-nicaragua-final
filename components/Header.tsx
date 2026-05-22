// File: components/Header.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import MobileMenu from './MobileMenu';

const CATEGORIES = [
  { slug: 'sucesos', label: 'Sucesos' },
  { slug: 'nacionales', label: 'Nacionales' },
  { slug: 'deportes', label: 'Deportes' },
  { slug: 'tecnologia', label: 'Tecnología' },
  { slug: 'espectaculos', label: 'Espectáculos' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme, isLoaded: isMounted } = useTheme();

  return (
    <>
      <header className="header">
        <div className="header-container">
          <Link href="/" className="header-logo">
            <span>🇳🇮</span>
            <span>Nicaragua Informate</span>
          </Link>

          <nav className="header-nav">
            <li><Link href="/">Inicio</Link></li>
            <li><Link href="/noticias">Noticias</Link></li>
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/categoria/${cat.slug}`}>{cat.label}</Link>
              </li>
            ))}
          </nav>

          <div className="header-actions">
            {isMounted && (
              <button
                className="btn-theme"
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
              className="btn-menu-toggle"
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
