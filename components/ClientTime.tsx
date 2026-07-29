'use client';

import { useEffect, useState } from 'react';

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

export function RelativeTime({ date, className }: { date?: string; className?: string }) {
  const [texto, setTexto] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return tiempoCorto(date);
  });

  useEffect(() => {
    setTexto(tiempoCorto(date));
    const id = setInterval(() => setTexto(tiempoCorto(date)), 60000);
    return () => clearInterval(id);
  }, [date]);

  if (!texto) return null;
  return <time dateTime={date} className={className}>{texto}</time>;
}

export function FullRelativeTime({ date, className }: { date?: string; className?: string }) {
  const [texto, setTexto] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const diff = Date.now() - new Date(date || '').getTime();
      const d = Math.floor(diff / 86400000);
      if (d < 1) return 'hoy';
      if (d === 1) return 'ayer';
      return `hace ${d} d`;
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      const diff = Date.now() - new Date(date || '').getTime();
      const d = Math.floor(diff / 86400000);
      let t = 'hoy';
      if (d === 1) t = 'ayer';
      else if (d > 1) t = `hace ${d} d`;
      setTexto(t);
    } catch {
      setTexto('');
    }
  }, [date]);

  if (!texto) return null;
  return <time dateTime={date} className={className}>{texto}</time>;
}
