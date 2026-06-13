// File: components/EconomicBar.tsx
'use client';

import { useState, useEffect } from 'react';

interface RateEntry { buy?: number; sell?: number; mid?: number; label: string }
interface RatesData {
  rates: Record<string, RateEntry>;
  updatedAt: string;
  source: string;
  cached?: boolean;
}

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos

function fmt(n?: number) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export default function EconomicBar() {
  const [data, setData] = useState<RatesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/exchange-rates');
        if (!res.ok) throw new Error('fetch failed');
        const json: RatesData = await res.json();
        if (!cancelled) { setData(json); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const r = data?.rates;

  return (
    <div className="econ-widget" role="region" aria-label="Indicadores económicos">
      <div className="econ-widget__section">
        <div className="econ-widget__subtitle">💵 Tipo de Cambio BCN</div>

        <div className="econ-widget__row">
          <span className="econ-widget__label">USD → NIO</span>
          {loading ? (
            <span className="econ-widget__value econ-widget__value--loading">…</span>
          ) : (
            <>
              <span className="econ-widget__value">C$ {fmt(r?.['NIO-USD']?.buy)}</span>
              <span className="econ-widget__change econ-widget__change--neutral econ-widget__change--small">
                venta {fmt(r?.['NIO-USD']?.sell)}
              </span>
            </>
          )}
        </div>

        <div className="econ-widget__row">
          <span className="econ-widget__label">EUR → NIO</span>
          {loading ? (
            <span className="econ-widget__value econ-widget__value--loading">…</span>
          ) : (
            <>
              <span className="econ-widget__value">C$ {fmt(r?.['NIO-EUR']?.buy)}</span>
              <span className="econ-widget__change econ-widget__change--neutral econ-widget__change--small">
                venta {fmt(r?.['NIO-EUR']?.sell)}
              </span>
            </>
          )}
        </div>

        <div className="econ-widget__row">
          <span className="econ-widget__label">EUR / USD</span>
          {loading ? (
            <span className="econ-widget__value econ-widget__value--loading">…</span>
          ) : (
            <span className="econ-widget__value">{fmt(r?.['EUR-USD']?.mid)}</span>
          )}
        </div>
      </div>

      <div className="econ-widget__divider" />

      <div className="econ-widget__section">
        <div className="econ-widget__subtitle">⛽ Combustibles (C$/galón)</div>
        <div className="econ-widget__row">
          <span className="econ-widget__label">Regular</span>
          <span className="econ-widget__value">C$ 47.80</span>
        </div>
        <div className="econ-widget__row">
          <span className="econ-widget__label">Súper</span>
          <span className="econ-widget__value">C$ 49.00</span>
        </div>
        <div className="econ-widget__row">
          <span className="econ-widget__label">Diésel</span>
          <span className="econ-widget__value">C$ 43.21</span>
        </div>
      </div>

      <div className="econ-widget__source">
        Fuente: {data?.source ?? 'BCN / ECB'} · actualiza cada 30 min
        {data?.cached && <span style={{ color: 'var(--warning)', marginLeft: 4 }}>⚠ caché</span>}
      </div>
    </div>
  );
}
