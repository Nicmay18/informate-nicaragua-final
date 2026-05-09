'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/', icon: 'fa-home' },
  { label: 'Noticias', href: '/noticias', icon: 'fa-newspaper' },
  { label: 'Categorías', href: '/noticias', icon: 'fa-th-large' },
  { label: 'Nosotros', href: '/nosotros', icon: 'fa-info-circle' },
  { label: 'Contacto', href: '/contacto', icon: 'fa-envelope' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav
      className="bottom-nav"
      style={{
        position: 'fixed',
        bottom: isVisible ? '0' : '-100%',
        left: 0,
        right: 0,
        background: 'var(--paper)',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 'env(safe-area-inset-bottom) 0 0 0',
        height: 'calc(60px + env(safe-area-inset-bottom))',
        zIndex: 9999,
        transition: 'transform 0.3s ease',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className="bottom-nav-item"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0',
              color: isActive ? 'var(--brand)' : 'var(--ink-muted)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <i
              className={`fas ${item.icon}`}
              style={{
                fontSize: '20px',
                marginBottom: '4px',
                transition: 'transform 0.2s ease',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: isActive ? 600 : 500,
                letterSpacing: '0.02em',
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
