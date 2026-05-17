import { TrendingUp, Fuel } from 'lucide-react';

const GAS_PRICES = [
  { label: 'Gasolina Regular', price: '47.80–48.00', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Gasolina Súper', price: '49.00', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Diésel', price: '43.21–43.40', unit: 'C$', trend: '↑', change: '0.44%' },
];

function TrendArrow({ trend }: { trend: string }) {
  const color = trend === '↑' ? '#16a34a' : trend === '↓' ? '#dc2626' : '#64748b';
  return <span style={{ color, fontWeight: 700, fontSize: 12 }}>{trend}</span>;
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
    <span className="ind-sparkline">
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
    <div className="ind-widget">
      <div className="ind-header">
        <TrendingUp size={14} color="#38bdf8" />
        <span>Indicadores Económicos</span>
      </div>
      <div className="ind-body">
        {/* Exchange rates */}
        {exchangeRows.map((row, i) => (
          <div key={i} className="ind-row">
            <div className="ind-label-col">
              <div className="ind-label">{row.label}</div>
              <div className="ind-sublabel">Tasa de referencia</div>
            </div>
            <div className="ind-value-col">
              <Sparkline trend={row.trend} />
              <div className="ind-value-wrap">
                <div className="ind-value">{row.value}</div>
                <div className="ind-change">
                  <TrendArrow trend={row.trend} />
                  <span>{row.change}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Gas prices */}
        <div className="ind-gas-header">
          <Fuel size={14} color="#f97316" />Combustibles (C$/galón)
        </div>
        {GAS_PRICES.map((row, i) => (
          <div key={i} className="ind-row ind-row--gas">
            <div className="ind-label" style={{ color: '#6b7280' }}>{row.label}</div>
            <div className="ind-value-col">
              <Sparkline trend={row.trend} />
              <div className="ind-value-wrap">
                <div className="ind-value">{row.unit} {row.price}</div>
                <div className="ind-change">
                  <TrendArrow trend={row.trend} />
                  <span>{row.change}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="ind-footer">
          Fuente: BCN / INC — Datos referenciales
        </div>
      </div>
    </div>
  );
}
