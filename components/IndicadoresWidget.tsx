'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Fuel, ArrowUp, ArrowDown, Minus, Loader2 } from 'lucide-react';

interface RatesData {
  rates: Record<string, { buy?: number; sell?: number; mid?: number; label: string }>;
  updatedAt: string;
  source: string;
}

const GAS_PRICES: { label: string; price: string; unit: string; trend: string; change: string }[] = [
  { label: 'Gasolina Regular', price: '47.80', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Gasolina Súper', price: '49.00', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Diésel', price: '43.21', unit: 'C$', trend: '↑', change: '0.44%' },
];

function TrendPill({ trend, change }: { trend: string; change: string }) {
  const up = trend === '↑';
  const down = trend === '↓';
  const className = up ? 'econ-box-change up' : down ? 'econ-box-change down' : 'econ-box-change neutral';
  const Icon = up ? ArrowUp : down ? ArrowDown : Minus;
  return (
    <span className={className}>
      <Icon size={12} strokeWidth={2.5} />
      {change}
    </span>
  );
}

function formatRate(n: number | undefined) {
  if (n === undefined) return '—';
  return n.toFixed(2);
}

export default function IndicadoresWidget() {
  const [rates, setRates] = useState<RatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/exchange-rates', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar tasas');
      const data: RatesData = await res.json();
      setRates(data);
    } catch {
      setError('No se pudo actualizar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const refresh = setInterval(fetchRates, 300000); // 5 min
    return () => clearInterval(refresh);
  }, []);

  const usd = rates?.rates?.['NIO-USD'];
  const eur = rates?.rates?.['NIO-EUR'];
  const eurUsd = rates?.rates?.['EUR-USD'];

  const updatedText = rates
    ? `Fuente: ${rates.source} • Actualizado ${new Date(rates.updatedAt).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })}`
    : 'Fuente: BCN / ECB • Actualizando...';

  return (
    <div className="econ-widget">
      <h3 className="econ-widget-title">
        <TrendingUp size={18} />
        Indicadores Económicos
      </h3>

      {loading && !rates && (
        <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: 6 }} />
          Cargando tasas...
        </div>
      )}

      {/* Divisas */}
      <div className="econ-grid">
        {/* USD → NIO */}
        <div className="econ-box">
          <div className="econ-box-label">USD → NIO</div>
          <div className="econ-box-value">
            C$ {formatRate(usd?.sell)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            Compra {formatRate(usd?.buy)} / Venta {formatRate(usd?.sell)}
          </div>
          <TrendPill trend="→" change="0.00%" />
        </div>

        {/* EUR → NIO */}
        <div className="econ-box">
          <div className="econ-box-label">EUR → NIO</div>
          <div className="econ-box-value">
            C$ {formatRate(eur?.sell)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            Compra {formatRate(eur?.buy)} / Venta {formatRate(eur?.sell)}
          </div>
          <TrendPill trend="→" change="0.00%" />
        </div>
      </div>

      {/* EUR/USD */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>EUR / USD</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{formatRate(eurUsd?.mid)}</span>
      </div>

      {/* Combustibles */}
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

      {error && (
        <div style={{ fontSize: 11, color: '#ef4444', textAlign: 'center', paddingTop: 4 }}>
          {error}
        </div>
      )}

      <div className="econ-source">{updatedText}</div>
    </div>
  );
}
