import { TrendingUp, Fuel, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const EXCHANGE = [
  { label: 'Dólar BCN', value: '36.62', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Euro', value: '43.11', unit: 'C$', trend: '↑', change: '1.25%' },
];

const GAS_PRICES = [
  { label: 'Gasolina Regular', price: '47.80', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Gasolina Súper', price: '49.00', unit: 'C$', trend: '→', change: '0.00%' },
  { label: 'Diésel', price: '43.21', unit: 'C$', trend: '↑', change: '0.44%' },
];

function TrendPill({ trend, change }: { trend: string; change: string }) {
  const up = trend === '↑';
  const down = trend === '↓';
  const bg = up ? '#dcfce7' : down ? '#fee2e2' : '#f3f4f6';
  const color = up ? '#16a34a' : down ? '#dc2626' : '#64748b';
  const Icon = up ? ArrowUp : down ? ArrowDown : Minus;
  return (
    <span className="ind-pill" style={{ background: bg, color }}>
      <Icon size={12} strokeWidth={2.5} />
      {change}
    </span>
  );
}

export default function IndicadoresWidget() {
  return (
    <div className="ind-widget">
      <div className="ind-header">
        <TrendingUp size={16} color="#38bdf8" />
        <span>Indicadores Económicos</span>
      </div>

      <div className="ind-body">
        {/* Divisas - Grid 2 columnas */}
        <div className="ind-grid-2">
          {EXCHANGE.map((row, i) => (
            <div key={i} className="ind-card">
              <div className="ind-card-label">{row.label}</div>
              <div className="ind-card-value">{row.unit} {row.value}</div>
              <TrendPill trend={row.trend} change={row.change} />
            </div>
          ))}
        </div>

        {/* Combustibles - Full width */}
        <div className="ind-gas-section">
          <div className="ind-gas-header">
            <Fuel size={14} color="#f97316" />
            <span>Combustibles <small>(C$/galón)</small></span>
          </div>
          <div className="ind-gas-list">
            {GAS_PRICES.map((row, i) => (
              <div key={i} className="ind-gas-row">
                <div className="ind-gas-name">{row.label}</div>
                <div className="ind-gas-right">
                  <span className="ind-gas-price">{row.unit} {row.price}</span>
                  <TrendPill trend={row.trend} change={row.change} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ind-source">BCN / INC</div>
      </div>
    </div>
  );
}
