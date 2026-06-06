'use client';

import { useState, useEffect, useRef } from 'react';

const CITIES = [
  { country: 'Managua', code: 'NI', flag: '🇳🇮', tz: 'America/Managua' },
  { country: 'Ciudad de México', code: 'MX', flag: '🇲🇽', tz: 'America/Mexico_City' },
  { country: 'Miami', code: 'US', flag: '🇺🇸', tz: 'America/New_York' },
  { country: 'Madrid', code: 'ES', flag: '🇪🇸', tz: 'Europe/Madrid' },
  { country: 'Moscú', code: 'RU', flag: '🇷🇺', tz: 'Europe/Moscow' },
  { country: 'Beijing', code: 'CN', flag: '🇨🇳', tz: 'Asia/Shanghai' },
  { country: 'Buenos Aires', code: 'AR', flag: '🇦🇷', tz: 'America/Argentina/Buenos_Aires' },
  { country: 'Bogotá', code: 'CO', flag: '🇨🇴', tz: 'America/Bogota' },
];

function getTime(tz: string) {
  try {
    return new Date().toLocaleTimeString('es-NI', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  } catch {
    return '--:--:--';
  }
}

/**
 * Hook para cargar el reloj de forma diferida:
 * - Espera 3s tras load, o scroll inmediato (Intersection Observer)
 * - Evita CLS al reservar espacio con skeleton
 */
function useDeferredClock() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Cargar si el usuario hace scroll
    const onScroll = () => {
      if (!hasScrolled.current) {
        hasScrolled.current = true;
        setShouldLoad(true);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // 2. O cargar a los 3 segundos después de load
    const onLoad = () => {
      const idle = (window as unknown as Record<string, unknown>).requestIdleCallback;
      if (idle) {
        (idle as (cb: () => void, opts?: { timeout: number }) => void)(
          () => setShouldLoad(true),
          { timeout: 5000 }
        );
      } else {
        setTimeout(() => setShouldLoad(true), 3000);
      }
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    // 3. Fallback: si no pasa nada en 5s, cargar igual
    const fallback = setTimeout(() => setShouldLoad(true), 5000);

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(fallback);
    };
  }, []);

  return shouldLoad;
}

export default function WorldClock() {
  const shouldLoad = useDeferredClock();
  const [active, setActive] = useState(0);
  const [times, setTimes] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldLoad) return;
    setVisible(true);

    const update = () => {
      const t: Record<string, string> = {};
      CITIES.forEach(c => { t[c.country] = getTime(c.tz); });
      setTimes(t);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return;
    const rotate = setInterval(() => {
      setActive(p => (p + 1) % CITIES.length);
    }, 4000);
    return () => clearInterval(rotate);
  }, [shouldLoad]);

  const current = CITIES[active];

  return (
    <div
      className="clock-widget"
      role="region"
      aria-label="Reloj mundial"
      style={{ minHeight: '140px' }} // Reserva espacio antes de cargar
    >
      {!visible ? (
        // Skeleton reservando espacio exacto (evita CLS)
        <div className="clock-widget__skeleton">
          <div className="clock-skeleton-featured" />
          <div className="clock-skeleton-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="clock-skeleton-item" />
            ))}
          </div>
        </div>
      ) : (
        <div className={`clock-widget__content${visible ? ' is-visible' : ''}`}>
          <div className="clock-widget__featured" key={active}>
            <span className="clock-widget__big-flag">{current.flag}</span>
            <div className="clock-widget__featured-info">
              <span className="clock-widget__featured-city">{current.country}</span>
              <span className="clock-widget__featured-time">{times[current.country] || '--:--:--'}</span>
            </div>
          </div>
          <div className="clock-widget__list">
            {CITIES.map((c, i) => (
              <button
                key={c.country}
                className={`clock-widget__item${i === active ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
                aria-pressed={i === active}
              >
                <span aria-hidden="true">{c.flag}</span>
                <span className="clock-widget__item-name">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
