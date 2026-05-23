'use client';

import { useEffect, useState } from 'react';

interface ClockCity {
  id: string;
  name: string;
  timezone: string;
}

const cities: ClockCity[] = [
  { id: 'mga', name: 'Managua', timezone: 'America/Managua' },
  { id: 'ny', name: 'Nueva York', timezone: 'America/New_York' },
  { id: 'mad', name: 'Madrid', timezone: 'Europe/Madrid' },
  { id: 'mia', name: 'Miami', timezone: 'America/New_York' },
  { id: 'sj', name: 'San José', timezone: 'America/Costa_Rica' },
  { id: 'la', name: 'Los Ángeles', timezone: 'America/Los_Angeles' },
];

export default function WorldClock() {
  const [times, setTimes] = useState<Record<string, { time: string; date: string }>>({});

  useEffect(() => {
    const updateClocks = () => {
      const newTimes: Record<string, { time: string; date: string }> = {};
      cities.forEach((city) => {
        const now = new Date();
        const time = now.toLocaleTimeString('es-NI', {
          timeZone: city.timezone,
          hour: '2-digit',
          minute: '2-digit',
        });
        const date = now.toLocaleDateString('es-NI', {
          timeZone: city.timezone,
          day: 'numeric',
          month: 'short',
        });
        newTimes[city.id] = { time, date };
      });
      setTimes(newTimes);
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="clock-widget">
      <h3 className="clock-widget-title">🌍 Hora Mundial</h3>
      <div className="clock-grid">
        {cities.map((city) => (
          <div key={city.id} className="clock-city">
            <div className="clock-city-name">{city.name}</div>
            <div className="clock-city-time">{times[city.id]?.time || '--:--'}</div>
            <div className="clock-city-date">{times[city.id]?.date || '--'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
