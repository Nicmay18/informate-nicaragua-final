'use client';
import { useState, useEffect, useCallback } from 'react';
import { Droplets, Wind, Loader2 } from 'lucide-react';

interface City {
  name: string;
  region: string;
}

const CITIES: City[] = [
  { name: 'Managua', region: 'Managua' },
  { name: 'León', region: 'León' },
  { name: 'Granada', region: 'Granada' },
  { name: 'Estelí', region: 'Estelí' },
  { name: 'Matagalpa', region: 'Matagalpa' },
  { name: 'Jinotega', region: 'Jinotega' },
  { name: 'Masaya', region: 'Masaya' },
  { name: 'Carazo', region: 'Carazo' },
  { name: 'Rivas', region: 'Rivas' },
  { name: 'Boaco', region: 'Boaco' },
  { name: 'Bluefields', region: 'RAAS' },
  { name: 'Siuna', region: 'RACCN' },
  { name: 'Río San Juan', region: 'Río San Juan' },
  { name: 'Chontales', region: 'Chontales' },
];

interface WeatherData {
  temp: number;
  humidity: number;
  wind: number;
  code: number;
}

const CACHE_KEY = 'ni_weather_all_v1';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

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

async function fetchAllWeather(): Promise<Record<string, WeatherData>> {
  const res = await fetch('/api/weather/all', { cache: 'no-store' });
  if (!res.ok) throw new Error('Weather API error');
  return res.json();
}

function getCachedWeather(): Record<string, WeatherData> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw) as { value: Record<string, WeatherData>; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return value;
  } catch {
    return null;
  }
}

function setCachedWeather(value: Record<string, WeatherData>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ value, ts: Date.now() }));
  } catch {
    /* ignore */
  }
}

export default function WeatherWidget() {
  const [cityIdx, setCityIdx] = useState(0);
  const [weather, setWeather] = useState<Record<string, WeatherData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all cities via single cached API route + localStorage cache
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cached = getCachedWeather();
      if (cached) {
        setWeather(cached);
        setLoading(false);
      }
      try {
        const fresh = await fetchAllWeather();
        if (!cancelled) {
          setWeather(fresh);
          setCachedWeather(fresh);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[WeatherWidget] fetch failed, using cache/fallback', err);
          if (!cached) setError('No se pudo cargar el clima');
        }
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
