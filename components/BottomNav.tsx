'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Home, Newspaper, Radio, Search, Menu } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Noticias', href: '/noticias', icon: Newspaper },
  { label: 'Radio', href: '#radio', icon: Radio },
  { label: 'Buscar', href: '/buscar', icon: Search },
  { label: 'Menú', href: '#menu', icon: Menu },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > lastScrollY && current > 100) setIsVisible(false);
      else setIsVisible(true);
      setLastScrollY(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav className={`ni-bottomnav${isVisible ? '' : ' ni-bottomnav--hidden'}`}>
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link key={item.label} href={item.href} className={`ni-bottomnav-item${isActive ? ' active' : ''}`}>
            {isActive && <span className="ni-bottomnav-indicator" />}
            <span className="ni-bottomnav-icon"><Icon size={20} strokeWidth={isActive ? 2.5 : 2} /></span>
            <span className="ni-bottomnav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
