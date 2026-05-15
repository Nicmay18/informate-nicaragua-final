import { TrendingUp, Fuel } from 'lucide-react';

const GAS_PRICES = [
  { label: 'Gasolina Regular', price: '47.80–48.00', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Gasolina Súper', price: '49.00', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Diésel', price: '43.21–43.40', unit: 'C$', trend: '↑', change: '0.44%' },
];

function TrendArrow({ trend }: { trend: string }) {
  const color = trend === '↑' ? '#16a34a' : trend === '↓' ? '#dc2626' : '#64748b';
  return <span style={{ color, fontWeight: 700, fontSize: 13 }}>{trend}</span>;
}

function Sparkline({ trend }: { trend: string }) {
  const isUp = trend === '↑';
  const isDown = trend === '↓';
  const stroke = isUp ? '#22c55e' : isDown ? '#ef4444' : '#94a3b8';
  const path = isUp
    ? 'M0,18 L10,14 L20,10 L30,6 L40,2 L48,0'
    : isDown
    ? 'M0,2 L10,6 L20,10 L30,14 L40,18 L48,20'
    : 'M0,10 L12,8 L24,12 L36,9 L48,10';
  return (
    <span className="sparkline-wrap">
      <svg viewBox="0 0 48 20" preserveAspectRatio="none">
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

const exchangeRows = [
  { label: 'Dólar BCN', value: 'C$ 36.62', trend: '→', change: '0.00%' },
  { label: 'Euro', value: 'C$ 43.11', trend: '↑', change: '1.25%' },
];

export default function IndicadoresWidget() {
  return (
    <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <TrendingUp size={14} color="#38bdf8" />
        <span style={{ color: '#f8fafc', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Indicadores Económicos</span>
      </div>
      <div style={{ padding: '8px 0' }}>
        {/* Exchange rates */}
        {exchangeRows.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{row.label}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 1 }}>Tasa de referencia</div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkline trend={row.trend} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{row.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <TrendArrow trend={row.trend} />
                  <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{row.change}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Gas prices */}
        <div style={{ padding: '8px 16px 4px', fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <Fuel size={14} style={{ marginRight: 6, color: '#f97316' }} />Combustibles (C$/galón)
        </div>
        {GAS_PRICES.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: i < GAS_PRICES.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{row.label}</div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkline trend={row.trend} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{row.unit} {row.price}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <TrendArrow trend={row.trend} />
                  <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{row.change}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div style={{ padding: '8px 16px', fontSize: 10, color: 'var(--ink-faint)', borderTop: '1px solid var(--border-light)', textAlign: 'right' }}>
          Fuente: BCN / INC — Datos referenciales
        </div>
      </div>
    </div>
  );
}
