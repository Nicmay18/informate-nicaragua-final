'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setVisible(currentScrollY < lastScrollY || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // No mostrar en páginas de admin
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 transition-transform duration-300"
      style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
    >
      <div className="flex justify-around items-center py-2">
        <a
          href="/"
          className={`flex flex-col items-center p-2 text-xs ${pathname === '/' ? 'text-red-600' : 'text-gray-600'}`}
        >
          <i className="fas fa-home text-lg mb-1" />
          Inicio
        </a>
        <a
          href="/noticias"
          className={`flex flex-col items-center p-2 text-xs ${pathname === '/noticias' ? 'text-red-600' : 'text-gray-600'}`}
        >
          <i className="fas fa-newspaper text-lg mb-1" />
          Noticias
        </a>
        <a
          href="/contacto"
          className={`flex flex-col items-center p-2 text-xs ${pathname === '/contacto' ? 'text-red-600' : 'text-gray-600'}`}
        >
          <i className="fas fa-envelope text-lg mb-1" />
          Contacto
        </a>
      </div>
    </nav>
  );
}
