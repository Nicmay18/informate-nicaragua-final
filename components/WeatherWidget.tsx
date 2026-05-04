'use client';
import { useState, useEffect, useCallback } from 'react';

const CITIES = [
  { name: 'Managua',      lat: 12.1364, lon: -86.2514 },
  { name: 'León',         lat: 12.4337, lon: -86.8779 },
  { name: 'Granada',      lat: 11.9299, lon: -85.9560 },
  { name: 'Rivas',        lat: 11.4400, lon: -85.8284 },
  { name: 'Estelí',       lat: 13.0919, lon: -86.3535 },
  { name: 'Jinotega',     lat: 13.0917, lon: -86.0014 },
  { name: 'Bluefields',   lat: 12.0137, lon: -83.7627 },
  { name: 'Chinandega',   lat: 12.6292, lon: -87.1311 },
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
  const [active, setActive]       = useState(0);
  const [main, setMain]           = useState<WData | null>(null);
  const [temps, setTemps]         = useState<(number | null)[]>(new Array(CITIES.length).fill(null));
  const [loading, setLoading]     = useState(false);
  const [paused, setPaused]       = useState(false);

  const loadCity = useCallback(async (idx: number) => {
    setLoading(true);
    const w = await fetchCity(CITIES[idx].lat, CITIES[idx].lon);
    setMain(w);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCity(0);
    CITIES.forEach(async (c, i) => {
      const w = await fetchCity(c.lat, c.lon);
      if (w) setTemps(prev => { const n = [...prev]; n[i] = w.temp; return n; });
    });
  }, [loadCity]);

  // Auto-cycle through cities every 6 seconds (pause on manual select)
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % CITIES.length;
        loadCity(next);
        return next;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [loadCity, paused]);

  const select = (idx: number) => {
    setActive(idx);
    loadCity(idx);
    setPaused(true);
    setTimeout(() => setPaused(false), 20000);
  };

  const wx = main ? (WX[main.code] ?? { label: 'Variable', emoji: '🌡️' }) : { label: 'Cargando...', emoji: '🌡️' };

  return (
    <div style={{ background: 'linear-gradient(160deg, #1e3a5f 0%, #0f172a 60%, #0a0e1a 100%)', borderRadius: 14, overflow: 'hidden', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
      {/* Header */}
      <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fas fa-cloud-sun weather-float-icon" style={{ color: '#D4AF37', fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clima Nicaragua</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{active + 1}/{CITIES.length}</span>
          <span className="pulse-green" style={{ background: '#22c55e', color: '#fff', fontSize: 10, padding: '3px 10px', borderRadius: 999, fontWeight: 800, letterSpacing: '0.06em' }}>EN VIVO</span>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Main weather display */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 54, lineHeight: 1, marginBottom: 6, transition: 'all 0.4s', filter: loading ? 'blur(2px)' : 'none' }} className="weather-float-icon">
            {wx.emoji}
          </div>
          <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, marginBottom: 3, transition: 'all 0.3s' }}>
            {main ? `${main.temp}°C` : '--°C'}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 2 }}>{wx.label}</div>
          <div style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {CITIES[active].name}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ flex: 1, padding: '10px 6px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>
              <i className="fas fa-droplet" style={{ color: '#38bdf8', marginRight: 3 }} />Humedad
            </div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{main ? `${main.humidity}%` : '--'}</div>
          </div>
          <div style={{ flex: 1, padding: '10px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>
              <i className="fas fa-wind" style={{ color: '#94a3b8', marginRight: 3 }} />Viento
            </div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{main ? `${main.wind} km/h` : '--'}</div>
          </div>
        </div>

        {/* City selector list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {CITIES.map((city, i) => (
            <button key={i} onClick={() => select(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%',
                background: active === i ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${active === i ? '#D4AF37' : 'transparent'}`,
                transition: 'all 0.2s', color: '#fff',
              }}>
              <span style={{ fontSize: 13, fontWeight: active === i ? 700 : 400, color: active === i ? '#fff' : '#94a3b8' }}>
                {city.name}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#D4AF37', minWidth: 44, textAlign: 'right' }}>
                {temps[i] !== null ? `${temps[i]}°C` : '…'}
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 10, color: '#334155', textAlign: 'center' }}>
          Fuente: Open-Meteo · Actualizado en tiempo real
        </div>
      </div>
    </div>
  );
}
