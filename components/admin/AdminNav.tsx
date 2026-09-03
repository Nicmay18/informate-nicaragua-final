'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_LINKS = [
  { href: '/admin/centro-de-comando', label: '🏢 Centro de Comando' },
  { href: '/admin/nios', label: 'NIOS' },
  { href: '/admin/meni', label: 'Criterio Editorial' },
  { href: '/admin/meni-dashboard', label: 'Dashboard MENI' },
  { href: '/admin/ceo-agent', label: 'CEO Agent' },
  { href: '/admin/editor', label: 'Editor' },
  { href: '/admin/correcciones', label: 'Correcciones' },
  { href: '/admin/trafico', label: 'Tráfico' },
  { href: '/admin/growth', label: 'Growth' },
  { href: '/admin/entities', label: 'Entidades' },
  { href: '/admin/portada', label: 'Portada' },
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
