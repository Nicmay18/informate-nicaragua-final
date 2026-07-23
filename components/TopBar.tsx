'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CloudSun, Calendar } from 'lucide-react';

const NoPrefetchLink = (props: React.ComponentProps<typeof Link>) => (
  <Link {...props} prefetch={false} />
);

const QUICK_LINKS = [
  { href: '/nosotros', label: 'Sobre Nosotros' },
  { href: '/contacto', label: 'Contacto' },
  { href: '/privacidad', label: 'Privacidad' },
];

function formatDateNICR(date: Date): string {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dias[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
}

export default function TopBar() {
  const [now, setNow] = useState<Date | null>(null);
  const [temp, setTemp] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('https://wttr.in/Managua?format=%t&lang=es', { headers: { Accept: 'text/plain' } })
      .then(r => r.text())
      .then(t => { if (!cancelled && t) setTemp(t.trim()); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="ni-topbar" role="complementary" aria-label="Barra superior">
      <div className="ni-topbar__inner">
        <div className="ni-topbar__left">
          <span className="ni-topbar__date" title="Fecha actual">
            <Calendar size={13} aria-hidden="true" />
            {now ? formatDateNICR(now) : '\u00a0'}
          </span>
          {temp && (
            <span className="ni-topbar__weather" title="Clima en Managua">
              <CloudSun size={13} aria-hidden="true" />
              Managua {temp}
            </span>
          )}
        </div>
        <div className="ni-topbar__right">
          {QUICK_LINKS.map((link) => (
            <NoPrefetchLink key={link.href} href={link.href} className="ni-topbar__link">
              {link.label}
            </NoPrefetchLink>
          ))}
        </div>
      </div>
    </div>
  );
}
