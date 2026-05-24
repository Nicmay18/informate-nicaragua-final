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
  const className = up ? 'econ-box-change up' : down ? 'econ-box-change down' : 'econ-box-change neutral';
  const Icon = up ? ArrowUp : down ? ArrowDown : Minus;
  return (
    <span className={className}>
      <Icon size={12} strokeWidth={2.5} />
      {change}
    </span>
  );
}

export default function IndicadoresWidget() {
  return (
    <div className="econ-widget">
      <h3 className="econ-widget-title">
        <TrendingUp size={18} />
        Indicadores Económicos
      </h3>

      {/* Divisas - Grid 2 columnas */}
      <div className="econ-grid">
        {EXCHANGE.map((row, i) => (
          <div key={i} className="econ-box">
            <div className="econ-box-label">{row.label}</div>
            <div className="econ-box-value">{row.unit} {row.value}</div>
            <TrendPill trend={row.trend} change={row.change} />
          </div>
        ))}
      </div>

      {/* Combustibles - Full width */}
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
