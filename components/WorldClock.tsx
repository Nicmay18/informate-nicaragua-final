'use client';

import { useState, useEffect } from 'react';

const CITIES = [
  { country: 'Managua', flag: '🇳🇮', tz: 'America/Managua' },
  { country: 'México', flag: '🇲🇽', tz: 'America/Mexico_City' },
  { country: 'Miami', flag: '🇺🇸', tz: 'America/New_York' },
  { country: 'Madrid', flag: '🇪🇸', tz: 'Europe/Madrid' },
  { country: 'Buenos Aires', flag: '🇦🇷', tz: 'America/Argentina/Buenos_Aires' },
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
  const [idx, setIdx] = useState(0);
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(getTime(CITIES[idx].tz));
    const t = setInterval(() => setTime(getTime(CITIES[idx].tz)), 30000);
    return () => clearInterval(t);
  }, [idx]);

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % CITIES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const city = CITIES[idx];

  return (
    <div className="world-clock">
      <div className="world-clock-inner">
        <span className="world-clock-item">
          <span className="flag">{city.flag}</span>
          <span className="country">{city.country}</span>
          <span className="time">{time}</span>
        </span>
      </div>
    </div>
  );
}
