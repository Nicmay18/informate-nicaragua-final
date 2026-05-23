'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const CITIES = [
  { country: 'Managua', flag: '🇳🇮', tz: 'America/Managua' },
  { country: 'CDMX', flag: '🇲🇽', tz: 'America/Mexico_City' },
  { country: 'Miami', flag: '🇺🇸', tz: 'America/New_York' },
  { country: 'Madrid', flag: '🇪🇸', tz: 'Europe/Madrid' },
  { country: 'B. Aires', flag: '🇦🇷', tz: 'America/Argentina/Buenos_Aires' },
  { country: 'Bogotá', flag: '🇨🇴', tz: 'America/Bogota' },
];

function getTime(tz: string) {
  try {
    return new Date().toLocaleTimeString('es-NI', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '--:--';
  }
}

export default function WorldClock() {
  const [open, setOpen] = useState(false);
  const [times, setTimes] = useState<Record<string, string>>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const t: Record<string, string> = {};
      CITIES.forEach(c => { t[c.country] = getTime(c.tz); });
      setTimes(t);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 700, color: 'white',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 100, padding: '4px 10px', cursor: 'pointer',
          whiteSpace: 'nowrap', letterSpacing: '0.3px',
        }}
      >
        <span style={{ fontSize: 13 }}>🌍</span>
        <span>{times['Managua'] || '--:--'}</span>
        <ChevronDown size={12} style={{ opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '8px 0', minWidth: 180,
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)', zIndex: 10000,
        }}>
          {CITIES.map(c => (
            <div key={c.country} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 14px', fontSize: 12, color: 'rgba(255,255,255,0.85)',
              gap: 16,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{c.flag}</span>
                <span style={{ fontWeight: 600 }}>{c.country}</span>
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--accent)', fontSize: 11 }}>
                {times[c.country] || '--:--'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
