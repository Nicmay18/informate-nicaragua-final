"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const NAVIGATION_ITEMS = [
  { label: 'Inicio', href: '/' },
  { label: 'Nacionales', href: '/categoria/nacionales' },
  { label: 'Internacionales', href: '/categoria/internacionales' },
  { label: 'Sucesos', href: '/categoria/sucesos' },
  { label: 'Deportes', href: '/categoria/deportes' },
  { label: 'Tecnología', href: '/categoria/tecnologia' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : 'unset';
  };

  return (
    <>
      <header className={`header-main ${isScrolled ? 'header-scrolled' : ''}`}>
        <div className="header-container">
          {/* Logo */}
          <Link href="/" className="header-logo">
            <Image
              src="/logo.png"
              alt="Nicaragua Informate"
              width={40}
              height={40}
              className="logo-image"
            />
            <div className="logo-text">
              <span className="logo-title">Nicaragua</span>
              <span className="logo-subtitle">Informate</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav-desktop">
            {NAVIGATION_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Header Actions */}
          <div className="header-actions">
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button className="search-button" aria-label="Buscar">
              <Search size={20} />
            </button>

            <button
              onClick={toggleMenu}
              className="mobile-menu-button"
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={toggleMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <Link href="/" className="mobile-logo" onClick={toggleMenu}>
                <Image
                  src="/logo.png"
                  alt="Nicaragua Informate"
                  width={32}
                  height={32}
                />
                <span>Nicaragua Informate</span>
              </Link>
              <button
                onClick={toggleMenu}
                className="mobile-menu-close"
                aria-label="Cerrar menú"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="mobile-nav">
              {NAVIGATION_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mobile-nav-link"
                  onClick={toggleMenu}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mobile-menu-footer">
              <button
                onClick={() => {
                  toggleTheme();
                  toggleMenu();
                }}
                className="mobile-theme-toggle"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                <span>Modo {theme === 'light' ? 'oscuro' : 'claro'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}