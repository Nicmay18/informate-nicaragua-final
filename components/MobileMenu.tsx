// File: components/MobileMenu.tsx
'use client';

import Link from 'next/link';

interface Category {
  slug: string;
  label: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export default function MobileMenu({
  isOpen,
  onClose,
  categories,
}: MobileMenuProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className="mobile-menu-overlay"
        data-open={isOpen}
        onClick={onClose}
        role="presentation"
      />

      {/* Menu */}
      <nav className="mobile-menu" data-open={isOpen}>
        <ul className="mobile-menu-list">
          <li className="mobile-menu-item">
            <Link
              href="/"
              className="mobile-menu-link"
              onClick={onClose}
            >
              Inicio
            </Link>
          </li>

          <li className="mobile-menu-item">
            <Link
              href="/noticias"
              className="mobile-menu-link"
              onClick={onClose}
            >
              Todas las noticias
            </Link>
          </li>

          <li className="mobile-menu-item" style={{ marginTop: 'var(--spacing-lg)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--spacing-md)' }}>
              Categorías
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="mobile-menu-link"
                    onClick={onClose}
                    style={{ fontSize: '14px' }}
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </>
  );
}
