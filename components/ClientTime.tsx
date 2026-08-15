'use client';

import { useEffect, useMemo, useState } from 'react';

function tiempoCorto(fecha?: string): string {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

function tiempoCompleto(fecha?: string): string {
  if (!fecha) return '';
  try {
    const diff = Date.now() - new Date(fecha).getTime();
    const d = Math.floor(diff / 86400000);
    if (d < 1) return 'hoy';
    if (d === 1) return 'ayer';
    return `hace ${d} d`;
  } catch {
    return '';
  }
}

export function RelativeTime({ date, className }: { date?: string; className?: string }) {
  const inicial = useMemo(() => tiempoCorto(date), [date]);
  const [texto, setTexto] = useState(inicial);

  useEffect(() => {
    setTexto(tiempoCorto(date));
    const id = setInterval(() => setTexto(tiempoCorto(date)), 60000);
    return () => clearInterval(id);
  }, [date]);

  if (!texto) return null;
  return <time dateTime={date} className={className} suppressHydrationWarning>{texto}</time>;
}

export function FullRelativeTime({ date, className }: { date?: string; className?: string }) {
  const inicial = useMemo(() => tiempoCompleto(date), [date]);
  const [texto, setTexto] = useState(inicial);

  useEffect(() => {
    setTexto(tiempoCompleto(date));
    const id = setInterval(() => setTexto(tiempoCompleto(date)), 86400000);
    return () => clearInterval(id);
  }, [date]);

  if (!texto) return null;
  return <time dateTime={date} className={className} suppressHydrationWarning>{texto}</time>;
}
