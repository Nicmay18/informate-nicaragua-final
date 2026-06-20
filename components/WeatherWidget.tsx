'use client';
import { useState, useEffect, useCallback } from 'react';
import { Droplets, Wind, Loader2 } from 'lucide-react';

interface City {
  name: string;
  region: string;
  lat: number;
  lon: number;
}

const CITIES: City[] = [
  { name: 'Managua', region: 'Managua', lat: 12.1328, lon: -86.2504 },
  { name: 'León', region: 'León', lat: 12.4379, lon: -86.8780 },
  { name: 'Granada', region: 'Granada', lat: 11.9299, lon: -85.9560 },
  { name: 'Estelí', region: 'Estelí', lat: 13.0850, lon: -86.3630 },
  { name: 'Matagalpa', region: 'Matagalpa', lat: 12.9250, lon: -85.9170 },
  { name: 'Jinotega', region: 'Jinotega', lat: 13.0910, lon: -86.0010 },
  { name: 'Masaya', region: 'Masaya', lat: 11.9734, lon: -86.0730 },
  { name: 'Carazo', region: 'Carazo', lat: 11.8589, lon: -86.2394 },
  { name: 'Rivas', region: 'Rivas', lat: 11.4372, lon: -85.8263 },
  { name: 'Boaco', region: 'Boaco', lat: 12.4722, lon: -85.6596 },
  { name: 'Bluefields', region: 'RAAS', lat: 12.0067, lon: -83.7651 },
  { name: 'Siuna', region: 'RACCN', lat: 13.7333, lon: -84.7667 },
  { name: 'Río San Juan', region: 'Río San Juan', lat: 11.1233, lon: -84.7771 },
  { name: 'Chontales', region: 'Chontales', lat: 12.1063, lon: -85.3645 },
];

interface WeatherData {
  temp: number;
  humidity: number;
  wind: number;
  code: number;
}

function wmoToEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 55) return '🌦️';
  if (code >= 61 && code <= 65) return '🌧️';
  if (code >= 71 && code <= 75) return '🌨️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

function wmoToLabel(code: number): string {
  if (code === 0) return 'Despejado';
  if (code === 1) return 'Casi despejado';
  if (code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code === 45 || code === 48) return 'Niebla';
  if (code >= 51 && code <= 55) return 'Llovizna';
  if (code >= 61 && code <= 65) return 'Lluvia';
  if (code >= 71 && code <= 75) return 'Nieve';
  if (code >= 80 && code <= 82) return 'Chubascos';
  if (code >= 95) return 'Tormenta';
  return 'Variable';
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America%2FManagua`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Open-Meteo error');
  const data = await res.json();
  return {
    temp: Math.round(data.current.temperature_2m),
    humidity: data.current.relative_humidity_2m,
    wind: Math.round(data.current.wind_speed_10m),
    code: data.current.weather_code,
  };
}

export default function WeatherWidget() {
  const [cityIdx, setCityIdx] = useState(0);
  const [weather, setWeather] = useState<Record<string, WeatherData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all cities on mount + refresh every 10 min
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const results: Record<string, WeatherData> = {};
        // Fetch paralelo: todas las ciudades al mismo tiempo
        const promises = CITIES.map(async (city) => {
          try {
            return { name: city.name, data: await fetchWeather(city.lat, city.lon) };
          } catch {
            return { name: city.name, data: { temp: 0, humidity: 0, wind: 0, code: -1 } as WeatherData };
          }
        });
        const settled = await Promise.all(promises);
        if (cancelled) return;
        for (const { name, data } of settled) {
          results[name] = data;
        }
        setWeather(results);
      } catch {
        if (!cancelled) setError('No se pudo cargar el clima');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const refresh = setInterval(load, 600000); // 10 min
    return () => { cancelled = true; clearInterval(refresh); };
  }, []);

  // Auto-rotate every 4 seconds
  useEffect(() => {
    const t = setInterval(() => {
      setCityIdx((prev) => (prev + 1) % CITIES.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const city = CITIES[cityIdx];
  const w = weather[city.name];

  const handleClick = useCallback((i: number) => setCityIdx(i), []);

  if (loading) {
    return (
      <div className="weather-widget-full">
        <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 14, justifyContent: 'center' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Cargando clima real...
        </div>
        <style>{'@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-widget-full">
        <div style={{ padding: 20, color: '#f87171', fontSize: 14, textAlign: 'center' }}>{error}</div>
      </div>
    );
  }

  const temp = w?.temp ?? 0;
  const humidity = w?.humidity ?? 0;
  const wind = w?.wind ?? 0;
  const code = w?.code ?? -1;

  return (
    <div className="weather-widget-full">
      <div style={{ textAlign: 'center', marginBottom: 16, position: 'relative' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {city.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>
          {city.region}, Nicaragua
        </div>
      </div>

      <div className="weather-current">
        <div className="weather-current-main">
          <span style={{ fontSize: 44, lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}>
            {wmoToEmoji(code)}
          </span>
          <div>
            <div className="weather-current-temp">{temp}°</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>{wmoToLabel(code)}</div>
          </div>
        </div>
        <div className="weather-current-details">
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Droplets size={12} /> {humidity}%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wind size={12} /> {wind} km/h
          </span>
        </div>
      </div>
      <div className="weather-cities" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {CITIES.map((c, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={`weather-city-pill${i === cityIdx ? ' active' : ''}`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
