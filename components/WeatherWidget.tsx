'use client';
import { useState, useEffect } from 'react';
import { Droplets, Wind } from 'lucide-react';

const CITIES = [
  { name: 'Managua', temp: 31, humidity: 68, wind: 14, code: 2 },
  { name: 'León', temp: 34, humidity: 55, wind: 18, code: 1 },
  { name: 'Granada', temp: 32, humidity: 62, wind: 12, code: 2 },
  { name: 'Estelí', temp: 27, humidity: 58, wind: 16, code: 1 },
  { name: 'Matagalpa', temp: 24, humidity: 75, wind: 10, code: 3 },
];

const WX: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Despejado', emoji: '☀️' },
  1: { label: 'Casi despejado', emoji: '🌤️' },
  2: { label: 'Parcialmente nublado', emoji: '⛅' },
  3: { label: 'Nublado', emoji: '☁️' },
};

export default function WeatherWidget() {
  const [cityIdx, setCityIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const city = CITIES[cityIdx];
  const wx = WX[city.code] ?? { label: 'Variable', emoji: '🌡️' };

  if (!mounted) {
    return (
      <div className="weather-widget-full">
        <div style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>Cargando clima...</div>
      </div>
    );
  }

  return (
    <div className="weather-widget-full">
      {/* Ciudad grande arriba */}
      <div style={{ textAlign: 'center', marginBottom: 16, position: 'relative' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {city.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>
          Nicaragua
        </div>
      </div>

      <div className="weather-current">
        <div className="weather-current-main">
          <span style={{ fontSize: 44, lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}>{wx.emoji}</span>
          <div>
            <div className="weather-current-temp">{city.temp}°</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>{wx.label}</div>
          </div>
        </div>
        <div className="weather-current-details">
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Droplets size={12} /> {city.humidity}%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wind size={12} /> {city.wind} km/h
          </span>
        </div>
      </div>
      <div className="weather-cities">
        {CITIES.map((c, i) => (
          <button
            key={i}
            onClick={() => setCityIdx(i)}
            className={`weather-city-pill${i === cityIdx ? ' active' : ''}`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
