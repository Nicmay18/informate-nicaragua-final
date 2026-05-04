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

const CITIES = [
  { name: 'Managua', lat: 12.1328, lon: -86.2504 },
  { name: 'León', lat: 12.4337, lon: -86.8779 },
  { name: 'Granada', lat: 11.9344, lon: -85.9561 },
];

async function fetchWeather(lat: number, lon: number) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&timezone=America%2FManagua&wind_speed_unit=kmh`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.current as { temperature_2m: number; weathercode: number; windspeed_10m: number; relativehumidity_2m: number };
  } catch { return null; }
}

export default async function WeatherWidget() {
  const main = await fetchWeather(CITIES[0].lat, CITIES[0].lon);
  if (!main) return null;

  const wx = WX[main.weathercode] ?? { label: 'Variable', emoji: '🌡️' };
  const temp = Math.round(main.temperature_2m);

  return (
    <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="fas fa-cloud-sun" style={{ color: '#fff', fontSize: 14 }} />
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Clima Nicaragua</span>
        <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>EN VIVO</span>
      </div>
      <div style={{ padding: 16 }}>
        {/* Main city */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 48, lineHeight: 1 }}>{wx.emoji}</span>
          <div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{temp}°C</div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>{wx.label}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600, marginTop: 1 }}>Managua</div>
          </div>
        </div>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, padding: '10px 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 3 }}><i className="fas fa-droplet" style={{ color: '#0ea5e9' }} /> Humedad</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{main.relativehumidity_2m}%</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 3 }}><i className="fas fa-wind" style={{ color: '#64748b' }} /> Viento</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{Math.round(main.windspeed_10m)} km/h</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 3 }}><i className="fas fa-thermometer-half" style={{ color: '#ef4444' }} /> Sensación</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{temp}°C</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-faint)', textAlign: 'center' }}>Fuente: Open-Meteo — Datos en tiempo real</div>
      </div>
    </div>
  );
}
