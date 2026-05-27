'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { TrendingUp, Sun, Fuel, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import RadioBar from './RadioBar';
import type { Noticia } from '@/lib/types';

interface Props {
  noticias: Noticia[];
  masLeidas: Noticia[];
}

const CATEGORIES = ['Nacionales', 'Internacionales', 'Sucesos', 'Tecnología', 'Deportes', 'Economía'];

const CITIES = [
  { name: 'Rivas', lat: 11.44, lon: -85.8284 },
  { name: 'León', lat: 12.4337, lon: -86.8779 },
  { name: 'Jinotepe', lat: 11.879, lon: -86.001 },
  { name: 'Estelí', lat: 13.0919, lon: -86.3535 },
  { name: 'Matagalpa', lat: 12.925, lon: -85.917 },
  { name: 'Jinotega', lat: 13.0917, lon: -86.0014 },
  { name: 'Bluefields', lat: 12.0137, lon: -83.7627 },
  { name: 'Zelaya Central', lat: 12.16, lon: -85.17 },
  { name: 'Nueva Segovia', lat: 13.632, lon: -86.475 },
  { name: 'Río San Juan', lat: 11.123, lon: -84.777 },
];

const WORLD_CITIES = [
  { id: 'mga', name: 'Managua', tz: 'America/Managua' },
  { id: 'ny', name: 'Nueva York', tz: 'America/New_York' },
  { id: 'mad', name: 'Madrid', tz: 'Europe/Madrid' },
  { id: 'mia', name: 'Miami', tz: 'America/New_York' },
  { id: 'sj', name: 'San José', tz: 'America/Costa_Rica' },
  { id: 'la', name: 'Los Ángeles', tz: 'America/Los_Angeles' },
];

const EXCHANGE = [
  { label: 'Dólar BCN', value: '36.62', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Euro', value: '43.11', unit: 'C$', trend: '↑', change: '1.25%' },
];

const GAS_PRICES = [
  { label: 'Gasolina Regular', price: '47.80', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Gasolina Súper', price: '49.00', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Diésel', price: '43.21', unit: 'C$', trend: '↑', change: '0.44%' },
];

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return dateStr; }
}

function timeAgo(dateStr: string) {
  try {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return formatDate(dateStr);
  } catch { return dateStr; }
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === '↑') return <ArrowUp size={12} />;
  if (trend === '↓') return <ArrowDown size={12} />;
  return <Minus size={12} />;
}

function ClockWidget() {
  const [times, setTimes] = useState<Record<string, { time: string; date: string }>>({});

  useEffect(() => {
    const update = () => {
      const newTimes: Record<string, { time: string; date: string }> = {};
      WORLD_CITIES.forEach(city => {
        const now = new Date();
        newTimes[city.id] = {
          time: now.toLocaleTimeString('es-NI', { timeZone: city.tz, hour: '2-digit', minute: '2-digit' }),
          date: now.toLocaleDateString('es-NI', { timeZone: city.tz, day: 'numeric', month: 'short' }),
        };
      });
      setTimes(newTimes);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="clock-widget">
      <h3 className="clock-widget-title">🌍 Hora Mundial</h3>
      <div className="clock-grid">
        {WORLD_CITIES.map(city => (
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

function EconWidget() {
  return (
    <div className="econ-widget">
      <h3 className="econ-widget-title">
        <TrendingUp size={18} />
        Indicadores Económicos
      </h3>
      <div className="econ-grid">
        {EXCHANGE.map((row, i) => (
          <div key={i} className="econ-box">
            <div className="econ-box-label">{row.label}</div>
            <div className="econ-box-value">{row.unit} {row.value}</div>
            <div className={`econ-box-change ${row.trend === '↑' ? 'up' : row.trend === '↓' ? 'down' : 'neutral'}`}>
              <TrendIcon trend={row.trend} />
              {row.change}
            </div>
          </div>
        ))}
      </div>
      <div className="econ-fuels-title">
        <Fuel size={14} />
        Combustibles (C$/galón)
      </div>
      {GAS_PRICES.map((row, i) => (
        <div key={i} className="econ-fuel-row">
          <span className="econ-fuel-name">{row.label}</span>
          <span>
            <span className="econ-fuel-price">{row.unit} {row.price}</span>
            <span className={`econ-fuel-change ${row.trend === '↑' ? 'up' : row.trend === '↓' ? 'down' : 'neutral'}`}>
              {row.trend === '↑' ? '▲' : row.trend === '↓' ? '▼' : '→'} {row.change}
            </span>
          </span>
        </div>
      ))}
      <div className="econ-source">Fuente: BCN / INE • Actualizado 21 may 2026</div>
    </div>
  );
}

function WeatherWidget() {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem('ni_weather_v2');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.time < 10 * 60 * 1000) {
          setData(parsed.data);
          setLoading(false);
          return;
        }
      } catch {}
    }

    Promise.all(
      CITIES.map(async city => {
        try {
          const res = await fetch(`/api/weather?lat=${city.lat}&lon=${city.lon}`);
          if (!res.ok) return null;
          return await res.json();
        } catch { return null; }
      })
    ).then(results => {
      const mapped: Record<string, any> = {};
      results.forEach((r, i) => {
        if (r) mapped[CITIES[i].name] = r;
      });
      setData(mapped);
      setLoading(false);
      sessionStorage.setItem('ni_weather_v2', JSON.stringify({ time: Date.now(), data: mapped }));
    });
  }, []);

  const main = data['Managua'];

  return (
    <div className="weather-widget-full">
      <div className="weather-current">
        <div className="weather-current-main">
          <Sun size={48} />
          <div className="weather-current-temp">
            {main ? `${Math.round(main.main?.temp ?? 0)}°` : '--'}
          </div>
          <div className="weather-current-info">
            <h4>Managua, Nicaragua</h4>
            <p>{main?.weather?.[0]?.description || 'Cargando...'}</p>
          </div>
        </div>
        <div className="weather-current-details">
          <span>💧 Humedad {main?.main?.humidity ?? '--'}%</span>
          <span>💨 Viento {Math.round(main?.wind?.speed ?? 0) * 3.6} km/h</span>
          <span>👁️ Visibilidad {((main?.visibility ?? 10000) / 1000).toFixed(0)} km</span>
        </div>
      </div>
      <div className="weather-cities">
        {loading ? (
          CITIES.map(c => (
            <div key={c.name} className="weather-city-card">
              <div className="weather-city-icon">⏳</div>
              <div className="weather-city-name">{c.name}</div>
              <div className="weather-city-temp">--</div>
            </div>
          ))
        ) : (
          CITIES.map(c => {
            const w = data[c.name];
            return (
              <div key={c.name} className="weather-city-card">
                <div className="weather-city-icon">
                  {w?.weather?.[0]?.icon?.includes('n') ? '🌙' :
                   w?.weather?.[0]?.main === 'Rain' ? '🌧️' :
                   w?.weather?.[0]?.main === 'Clouds' ? '⛅' :
                   w?.weather?.[0]?.main === 'Thunderstorm' ? '⛈️' : '☀️'}
                </div>
                <div className="weather-city-name">{c.name}</div>
                <div className="weather-city-temp">{w ? `${Math.round(w.main?.temp ?? 0)}°` : '--'}</div>
                <div className="weather-city-desc">{w?.weather?.[0]?.description || ''}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function NewsCard({ noticia }: { noticia: Noticia }) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = noticia.imagen && noticia.imagen !== '/logo.png' && !imgErr;

  return (
    <Link href={`/noticias/${noticia.slug}`} className="news-card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="news-image">
        {showImg ? (
          <Image src={noticia.imagen} alt={noticia.titulo} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', color: 'var(--accent)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {noticia.categoria}
          </div>
        )}
        <span className="news-category">{noticia.categoria}</span>
      </div>
      <div className="news-body">
        <div className="news-date" style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          gap: '2px 8px', fontSize: 12, color: 'var(--text-secondary, #6b7280)'
        }}>
          <span style={{ whiteSpace: 'nowrap' }}>{formatDate(noticia.fecha)}</span>
          <span style={{ whiteSpace: 'nowrap' }}>• {noticia.categoria}</span>
        </div>
        <h3 className="news-title">{noticia.titulo}</h3>
        {noticia.resumen && <p className="news-excerpt">{noticia.resumen}</p>}
      </div>
    </Link>
  );
}

export default function NewHomepage({ noticias, masLeidas }: Props) {
  const hero = noticias[0];

  const byCategory = (cat: string) => noticias.filter(n => n.categoria === cat).slice(0, 2);

  return (
    <div className="new-homepage">
      <RadioBar />

      {hero && (
        <section className="hero">
          <Link href={`/noticias/${hero.slug}`} className="hero-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="hero-image">
              {hero.imagen && hero.imagen !== '/logo.png' ? (
                <Image src={hero.imagen} alt={hero.titulo} fill className="object-cover" sizes="100vw" priority />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', color: 'var(--accent)' }}>
                  {hero.categoria}
                </div>
              )}
              <span className="hero-badge">Destacada</span>
            </div>
            <div className="hero-content">
              <div className="hero-meta" style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                gap: '4px 10px', marginBottom: 8
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent, #8c1d18)', whiteSpace: 'nowrap' }}>{hero.categoria}</span>
                <span className="dot" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-secondary)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(hero.fecha)}</span>
              </div>
              <h1 className="hero-title">{hero.titulo}</h1>
              {hero.resumen && <p className="hero-excerpt">{hero.resumen}</p>}
              <span className="btn-primary">
                Leer análisis completo
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </div>
          </Link>
        </section>
      )}

      <section className="trends-section">
        <div className="section-header" style={{ marginBottom: 14 }}>
          <h2 className="section-title">🔥 Tendencias</h2>
        </div>
        <div className="trends-bar">
          {masLeidas.slice(0, 10).map((n, i) => (
            <Link key={n.slug} href={`/noticias/${n.slug}`} className="trend-chip">
              <span className="trend-rank">{i + 1}</span>
              {n.titulo.length > 30 ? n.titulo.slice(0, 30) + '...' : n.titulo}
            </Link>
          ))}
        </div>
      </section>

      <div className="main-layout">
        <main>
          <div className="ad-banner">
            <h4>¿Quieres llegar a miles de nicaragüenses?</h4>
            <p>Publicita tu negocio en Nicaragua Informate y conecta con nuestra audiencia fiel.</p>
            <Link href="/contacto" className="ad-btn">Conoce nuestros planes →</Link>
          </div>

          {CATEGORIES.map(cat => {
            const items = byCategory(cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="section-header">
                  <h2 className="section-title">{cat}</h2>
                  <Link href={`/categoria/${cat.toLowerCase()}`} className="section-link">Ver todas →</Link>
                </div>
                <div className="news-grid">
                  {items.map(n => (
                    <NewsCard key={n.slug} noticia={n} />
                  ))}
                </div>
              </div>
            );
          })}
        </main>

        <aside className="sidebar">
          <ClockWidget />
          <EconWidget />
          <WeatherWidget />

          <div className="sidebar-widget">
            <h3 className="widget-title">🔥 Lo más leído</h3>
            {masLeidas.slice(0, 5).map((n, i) => (
              <Link key={n.slug} href={`/noticias/${n.slug}`} className="trending-item">
                <span className="trending-num">{i + 1}</span>
                <div className="trending-content">
                  <h4>{n.titulo}</h4>
                  <span>{timeAgo(n.fecha)} • {n.categoria}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">🏷️ Categorías</h3>
            <div className="categories-cloud">
              {CATEGORIES.map(cat => (
                <Link key={cat} href={`/categoria/${cat.toLowerCase()}`} className="cat-tag">{cat}</Link>
              ))}
            </div>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">📰 Newsletter</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Recibe cada mañana las noticias más importantes de Nicaragua en tu correo.
            </p>
            <input type="email" className="newsletter-input" placeholder="tu@email.com" />
            <button className="btn-primary-solid">Suscribirme gratis</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
