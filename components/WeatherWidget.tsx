'use client';
import { useState, useEffect, useCallback } from 'react';

const CITIES = [
  { name: 'Managua',    lat: 12.1364, lon: -86.2514 },
  { name: 'León',       lat: 12.4337, lon: -86.8779 },
  { name: 'Granada',    lat: 11.9299, lon: -85.9560 },
  { name: 'Rivas',      lat: 11.4400, lon: -85.8284 },
  { name: 'Estelí',     lat: 13.0919, lon: -86.3535 },
  { name: 'Jinotega',   lat: 13.0917, lon: -86.0014 },
  { name: 'Bluefields', lat: 12.0137, lon: -83.7627 },
  { name: 'Chinandega', lat: 12.6292, lon: -87.1311 },
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

interface WData { temp: number; code: number; wind: number; humidity: number }

async function fetchCity(lat: number, lon: number): Promise<WData | null> {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&timezone=America%2FManagua&wind_speed_unit=kmh`
    );
    if (!r.ok) return null;
    const d = await r.json();
    const c = d.current;
    return { temp: Math.round(c.temperature_2m), code: c.weathercode, wind: Math.round(c.windspeed_10m), humidity: c.relativehumidity_2m };
  } catch { return null; }
}

export default function WeatherWidget() {
  const [cityIdx, setCityIdx]   = useState(0);
  const [data, setData]         = useState<WData | null>(null);
  const [slide, setSlide]       = useState(0);
  const [allTemps, setAllTemps] = useState<(number | null)[]>(new Array(CITIES.length).fill(null));
  const [loading, setLoading]   = useState(false);
  const [paused, setPaused]     = useState(false);

  const loadCity = useCallback(async (idx: number) => {
    setLoading(true);
    const w = await fetchCity(CITIES[idx].lat, CITIES[idx].lon);
    setData(w);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCity(0);
    CITIES.forEach(async (c, i) => {
      const w = await fetchCity(c.lat, c.lon);
      if (w) setAllTemps(prev => { const n = [...prev]; n[i] = w.temp; return n; });
    });
  }, [loadCity]);

  // Auto-slide info cards every 3.5 s
  useEffect(() => {
    const t = setInterval(() => setSlide(p => (p + 1) % 3), 3500);
    return () => clearInterval(t);
  }, []);

  // Auto-cycle cities every 7 s
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setCityIdx(prev => { const next = (prev + 1) % CITIES.length; loadCity(next); return next; });
    }, 7000);
    return () => clearInterval(t);
  }, [loadCity, paused]);

  const select = (i: number) => {
    setCityIdx(i); loadCity(i); setPaused(true);
    setTimeout(() => setPaused(false), 25000);
  };

  const wx = data ? (WX[data.code] ?? { label: 'Variable', emoji: '🌡️' }) : { label: 'Cargando...', emoji: '🌡️' };

  return (
    <div style={{ background: 'linear-gradient(160deg, #1e3a5f 0%, #0f172a 100%)', borderRadius: 14, overflow: 'hidden', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>

      {/* Header */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fas fa-cloud-sun weather-float-icon" style={{ color: '#fbbf24', fontSize: 15 }} />
          <span style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clima</span>
          <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>— {CITIES[cityIdx].name}</span>
        </div>
        <span className="pulse-green" style={{ background: '#22c55e', color: '#fff', fontSize: 9, padding: '2px 8px', borderRadius: 999, fontWeight: 800, letterSpacing: '0.05em' }}>EN VIVO</span>
      </div>

      {/* Sliding info panel */}
      <div style={{ padding: '16px 16px 4px', minHeight: 84, opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s' }}>

        {/* Slide 0 — Temperature */}
        <div style={{ display: slide === 0 ? 'flex' : 'none', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 46, lineHeight: 1 }} className="weather-float-icon">{wx.emoji}</div>
          <div>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{data ? `${data.temp}°` : '--°'}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{wx.label}</div>
          </div>
        </div>

        {/* Slide 1 — Wind */}
        <div style={{ display: slide === 1 ? 'flex' : 'none', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(148,163,184,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fas fa-wind" style={{ fontSize: 24, color: '#94a3b8' }} />
          </div>
          <div>
            <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>
              {data ? data.wind : '--'} <span style={{ fontSize: 15, fontWeight: 400, color: '#94a3b8' }}>km/h</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Velocidad del viento</div>
          </div>
        </div>

        {/* Slide 2 — Humidity */}
        <div style={{ display: slide === 2 ? 'flex' : 'none', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fas fa-droplet" style={{ fontSize: 24, color: '#38bdf8' }} />
          </div>
          <div>
            <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>
              {data ? data.humidity : '--'} <span style={{ fontSize: 15, fontWeight: 400, color: '#94a3b8' }}>%</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Humedad relativa</div>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <button key={i} onClick={() => setSlide(i)}
              style={{ width: slide === i ? 22 : 7, height: 7, borderRadius: 4, background: slide === i ? '#fbbf24' : 'rgba(255,255,255,0.2)', border: 'none', padding: 0, cursor: 'pointer', transition: 'all 0.35s ease' }} />
          ))}
        </div>
      </div>

      {/* City chips */}
      <div style={{ padding: '10px 14px 14px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CITIES.map((c, i) => (
          <button key={i} onClick={() => select(i)}
            style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: cityIdx === i ? '#fbbf24' : 'rgba(255,255,255,0.08)', color: cityIdx === i ? '#0f172a' : '#94a3b8', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {c.name}{allTemps[i] !== null ? ` ${allTemps[i]}°` : ''}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 14px 10px', fontSize: 9, color: '#334155', textAlign: 'center' }}>
        Open-Meteo · Tiempo real
      </div>
    </div>
  );
}
