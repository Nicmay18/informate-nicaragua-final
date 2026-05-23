'use client';
import { useState, useEffect } from 'react';

const CITIES = [
  { name: 'Rivas',         lat: 11.4400, lon: -85.8284 },
  { name: 'León',          lat: 12.4337, lon: -86.8779 },
  { name: 'Jinotepe',      lat: 11.8790, lon: -86.0010 },
  { name: 'Estelí',        lat: 13.0919, lon: -86.3535 },
  { name: 'Matagalpa',     lat: 12.9250, lon: -85.9170 },
  { name: 'Jinotega',      lat: 13.0917, lon: -86.0014 },
  { name: 'Bluefields',    lat: 12.0137, lon: -83.7627 },
  { name: 'Zelaya Central',lat: 12.1600, lon: -85.1700 },
  { name: 'Nueva Segovia', lat: 13.6320, lon: -86.4750 },
  { name: 'Río San Juan',  lat: 11.1230, lon: -84.7770 },
];

const WX: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Despejado', emoji: '☀️' },
  1: { label: 'Casi despejado', emoji: '🌤️' },
  2: { label: 'Parcialmente nublado', emoji: '⛅' },
  3: { label: 'Nublado', emoji: '☁️' },
  45: { label: 'Brumoso', emoji: '🌫️' },
  48: { label: 'Niebla', emoji: '🌫️' },
  51: { label: 'Llovizna', emoji: '🌦️' },
  61: { label: 'Lluvia ligera', emoji: '🌧️' },
  63: { label: 'Lluvia moderada', emoji: '🌧️' },
  65: { label: 'Lluvia intensa', emoji: '⛈️' },
  80: { label: 'Chubascos', emoji: '🌦️' },
  81: { label: 'Chubascos moderados', emoji: '🌧️' },
  82: { label: 'Chubascos fuertes', emoji: '⛈️' },
  95: { label: 'Tormenta', emoji: '⛈️' },
  96: { label: 'Tormenta con granizo', emoji: '🌩️' },
};

interface CityWeather {
  temp: number;
  code: number;
  wind: number;
  humidity: number;
}

async function fetchCity(lat: number, lon: number): Promise<CityWeather | null> {
  try {
    const r = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (!r.ok) return null;
    const d = await r.json();
    if (d.error) return null;
    const c = d.current;
    return {
      temp: Math.round(c.temperature_2m),
      code: c.weathercode,
      wind: Math.round(c.windspeed_10m),
      humidity: c.relativehumidity_2m,
    };
  } catch {
    return null;
  }
}

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<(CityWeather | null)[]>(new Array(CITIES.length).fill(null));
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadAllCities() {
      try {
        const cached = sessionStorage.getItem('ni_weather_grid_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < 10 * 60 * 1000) {
            setWeatherData(parsed.data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      const results: (CityWeather | null)[] = [];
      for (let i = 0; i < CITIES.length; i++) {
        const data = await fetchCity(CITIES[i].lat, CITIES[i].lon);
        results.push(data);
        await new Promise((r) => setTimeout(r, 500));
      }
      setWeatherData(results);
      setLoading(false);

      try {
        sessionStorage.setItem('ni_weather_grid_cache', JSON.stringify({
          ts: Date.now(),
          data: results,
        }));
      } catch {}
    }

    loadAllCities();
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="weather-widget-full">
      <div className="weather-current">
        <div className="weather-current-main">
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <div className="weather-current-temp">{weatherData[0]?.temp ?? '--'}°</div>
          <div className="weather-current-info">
            <h4>Managua, Nicaragua</h4>
            <p>{weatherData[0] ? (WX[weatherData[0].code]?.label || 'Variable') : 'Cargando...'}</p>
          </div>
        </div>
        <div className="weather-current-details">
          <span>💧 Humedad {weatherData[0]?.humidity ?? '--'}%</span>
          <span>💨 Viento {weatherData[0]?.wind ?? '--'} km/h</span>
          <span>👁️ Visibilidad 10 km</span>
        </div>
      </div>
      <div className="weather-cities">
        {CITIES.map((city, i) => {
          const data = weatherData[i];
          const wx = data ? (WX[data.code] ?? { label: 'Variable', emoji: '🌡️' }) : { label: 'Cargando', emoji: '🌡️' };
          return (
            <div key={i} className="weather-city-card">
              <div className="weather-city-icon">{wx.emoji}</div>
              <div className="weather-city-name">{city.name}</div>
              <div className="weather-city-temp">{data?.temp ?? '--'}°</div>
              <div className="weather-city-desc">{wx.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
