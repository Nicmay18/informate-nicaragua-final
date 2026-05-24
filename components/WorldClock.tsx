'use client';

import { useState, useEffect } from 'react';

const CITIES = [
  { country: 'Managua', flag: '🇳🇮', tz: 'America/Managua' },
  { country: 'CDMX', flag: '🇲🇽', tz: 'America/Mexico_City' },
  { country: 'Miami', flag: '🇺🇸', tz: 'America/New_York' },
  { country: 'Madrid', flag: '🇪🇸', tz: 'Europe/Madrid' },
  { country: 'Buenos Aires', flag: '🇦🇷', tz: 'America/Argentina/Buenos_Aires' },
  { country: 'Bogotá', flag: '🇨🇴', tz: 'America/Bogota' },
];

function getTime(tz: string) {
  try {
    return new Date().toLocaleTimeString('es-NI', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  } catch {
    return '--:--:--';
  }
}

export default function WorldClock() {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const update = () => {
      const t: Record<string, string> = {};
      CITIES.forEach(c => { t[c.country] = getTime(c.tz); });
      setTimes(t);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="clock-widget" role="region" aria-label="Reloj mundial">
      {CITIES.map(c => (
        <div key={c.country} className="clock-widget__row">
          <span className="clock-widget__city">
            <span className="clock-widget__flag">{c.flag}</span>
            {c.country}
          </span>
          <span className="clock-widget__time">{times[c.country] || '--:--:--'}</span>
        </div>
      ))}
    </div>
  );
}
