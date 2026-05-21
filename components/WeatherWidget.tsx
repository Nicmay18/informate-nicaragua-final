'use client';
import { useState, useEffect, useCallback } from 'react';
import { CloudSun, Droplets, Wind } from 'lucide-react';

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
    const r = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (!r.ok) return null;
    const d = await r.json();
    if (d.error) return null;
    const c = d.current;
    return { temp: Math.round(c.temperature_2m), code: c.weathercode, wind: Math.round(c.windspeed_10m), humidity: c.relativehumidity_2m };
  } catch { return null; }
}

export default function WeatherWidget() {
  const [cityIdx, setCityIdx]   = useState(0);
  const [data, setData]         = useState<WData | null>(null);
  const [allTemps, setAllTemps] = useState<(number | null)[]>(new Array(CITIES.length).fill(null));
  const [loading, setLoading]   = useState(false);
  const [paused, setPaused]     = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadCity = useCallback(async (idx: number) => {
    setLoading(true);
    const w = await fetchCity(CITIES[idx].lat, CITIES[idx].lon);
    if (w) {
      setData(w);
      setAllTemps(prev => { const n = [...prev]; n[idx] = w.temp; return n; });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Caché en sessionStorage para evitar 429 en recargas
    try {
      const cached = sessionStorage.getItem('ni_weather_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < 10 * 60 * 1000) {
          setData(parsed.data);
          setAllTemps(parsed.allTemps);
          return;
        }
      }
    } catch {}

    async function bootstrap() {
      // 1) Cargar ciudad principal inmediatamente
      await loadCity(0);
      // 2) Cargar resto con delay de 500ms entre cada una para evitar 429
      for (let i = 1; i < CITIES.length; i++) {
        await new Promise(r => setTimeout(r, 500));
        const w = await fetchCity(CITIES[i].lat, CITIES[i].lon);
        if (w) {
          setAllTemps(prev => { const n = [...prev]; n[i] = w.temp; return n; });
        }
      }
    }
    bootstrap();
  }, [loadCity]);

  useEffect(() => {
    if (!data) return;
    try {
      sessionStorage.setItem('ni_weather_cache', JSON.stringify({
        ts: Date.now(),
        data,
        allTemps,
      }));
    } catch {}
  }, [data, allTemps]);

  // Auto-cycle cities every 10 s (más tiempo para ver los datos)
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setCityIdx(prev => { const next = (prev + 1) % CITIES.length; loadCity(next); return next; });
    }, 10000);
    return () => clearInterval(t);
  }, [loadCity, paused]);

  const select = (i: number) => {
    setCityIdx(i); loadCity(i); setPaused(true);
    setTimeout(() => setPaused(false), 30000);
  };

  const wx = data ? (WX[data.code] ?? { label: 'Variable', emoji: '🌡️' }) : { label: 'Cargando...', emoji: '🌡️' };

  if (!mounted) {
    return (
      <div style={{ background: 'linear-gradient(160deg, #1e3a5f 0%, #0f172a 100%)', borderRadius: 14, overflow: 'hidden', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CloudSun size={15} color="#fbbf24" />
          <span style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clima</span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(160deg, #1e3a5f 0%, #0f172a 100%)', borderRadius: 14, overflow: 'hidden', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>

      {/* Header */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CloudSun size={15} color="#fbbf24" />
          <span style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clima</span>
          <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>— {CITIES[cityIdx].name}</span>
        </div>
        <span className="pulse-green" style={{ background: '#22c55e', color: '#fff', fontSize: 9, padding: '2px 8px', borderRadius: 999, fontWeight: 800, letterSpacing: '0.05em' }}>EN VIVO</span>
      </div>

      {/* Main weather display — Temperature prominent, humidity & wind below */}
      <div style={{ padding: '20px 16px', opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
        {/* Temperature — Main focus */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 56, lineHeight: 1 }}>{wx.emoji}</div>
          <div>
            <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{data ? `${data.temp}°` : '--°'}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{wx.label}</div>
          </div>
        </div>

        {/* Humidity & Wind — Secondary row */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Humidity */}
          <div style={{ flex: 1, background: 'rgba(56,189,248,0.12)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets size={16} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                {data ? data.humidity : '--'}<span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>%</span>
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Humedad</div>
            </div>
          </div>

          {/* Wind */}
          <div style={{ flex: 1, background: 'rgba(148,163,184,0.12)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(148,163,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wind size={16} color="#94a3b8" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                {data ? data.wind : '--'}<span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>km/h</span>
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Viento</div>
            </div>
          </div>
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
