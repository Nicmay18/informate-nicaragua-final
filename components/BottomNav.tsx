'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Home, Newspaper, LayoutGrid, Info, Mail } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/', icon: <Home size={20} /> },
  { label: 'Noticias', href: '/noticias', icon: <Newspaper size={20} /> },
  { label: 'Categorías', href: '/noticias', icon: <LayoutGrid size={20} /> },
  { label: 'Nosotros', href: '/nosotros', icon: <Info size={20} /> },
  { label: 'Contacto', href: '/contacto', icon: <Mail size={20} /> },
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
      style={{
        position: 'fixed',
        bottom: isVisible ? '0' : '-100%',
        left: 0,
        right: 0,
        background: 'rgba(15,15,15,0.97)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 'env(safe-area-inset-bottom) 0 0 0',
        height: 'calc(64px + env(safe-area-inset-bottom))',
        zIndex: 9999,
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.label}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0', minHeight: '48px',
              color: isActive ? '#8c1d18' : '#737373',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute',
                top: 0,
                width: 20,
                height: 3,
                background: '#8c1d18',
                borderRadius: '0 0 4px 4px',
              }} />
            )}
            <span style={{
              marginBottom: '3px',
              transition: 'transform 0.2s ease',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              display: 'inline-flex',
            }}>
              {item.icon}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
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
