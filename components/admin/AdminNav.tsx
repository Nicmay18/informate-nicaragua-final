'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_LINKS = [
  { href: '/panel/nios', label: 'NIOS' },
  { href: '/panel/meni', label: 'Criterio Editorial' },
  { href: '/panel/meni-dashboard', label: 'Dashboard MENI' },
  { href: '/panel/centro-de-comando', label: 'CEO Agent' },
  { href: '/panel.html', label: 'Editor' },
  { href: '/panel.html', label: 'Correcciones' },
  { href: '/panel.html', label: 'Tráfico' },
  { href: '/panel/nios/performance', label: 'Growth' },
  { href: '/panel/entities', label: 'Entidades' },
  { href: '/panel/portada', label: 'Portada' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="whitespace-nowrap font-bold">Admin</span>
          {ADMIN_LINKS.map(link => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded px-3 py-1 text-sm ${
                  active ? 'bg-indigo-600 font-medium' : 'hover:bg-slate-700'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
