'use client';

import { useState, useEffect } from 'react';

const CITIES = [
  { country: 'Managua', flag: '🇳🇮', tz: 'America/Managua' },
  { country: 'Ciudad de México', flag: '🇲🇽', tz: 'America/Mexico_City' },
  { country: 'Miami', flag: '🇺🇸', tz: 'America/New_York' },
  { country: 'Madrid', flag: '🇪🇸', tz: 'Europe/Madrid' },
  { country: 'Moscú', flag: '🇷🇺', tz: 'Europe/Moscow' },
  { country: 'Beijing', flag: '🇨🇳', tz: 'Asia/Shanghai' },
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
  const [active, setActive] = useState(0);
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

  useEffect(() => {
    const rotate = setInterval(() => {
      setActive(p => (p + 1) % CITIES.length);
    }, 4000);
    return () => clearInterval(rotate);
  }, []);

  const current = CITIES[active];

  return (
    <div className="clock-widget" role="region" aria-label="Reloj mundial">
      <div className="clock-widget__featured" key={active}>
        <span className="clock-widget__big-flag">{current.flag}</span>
        <div className="clock-widget__featured-info">
          <span className="clock-widget__featured-city">{current.country}</span>
          <span className="clock-widget__featured-time">{times[current.country] || '--:--:--'}</span>
        </div>
      </div>
      <div className="clock-widget__list">
        {CITIES.map((c, i) => (
          <button
            key={c.country}
            className={`clock-widget__item${i === active ? ' is-active' : ''}`}
            onClick={() => setActive(i)}
          >
            <span>{c.flag}</span>
            <span className="clock-widget__item-name">{c.country.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
