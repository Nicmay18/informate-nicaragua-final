"use client";

import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Fuel, ShoppingCart, Mail } from 'lucide-react';

const INDICADORES = [
  { id: 'usd', icon: DollarSign, label: 'USD / NIO', valor: '36.40', variacion: '-0.2', positivo: false, unidad: 'C$' },
  { id: 'combustible', icon: Fuel, label: 'Gasolina Regular', valor: '44.90', variacion: '+0.5', positivo: false, unidad: 'C$' },
  { id: 'canasta', icon: ShoppingCart, label: 'Canasta Básica', valor: '18,240', variacion: '+1.2', positivo: false, unidad: 'C$' },
  { id: 'inflacion', icon: TrendingUp, label: 'Inflación Anual', valor: '5.8', variacion: '-0.3', positivo: true, unidad: '%' },
];

export default function ZonaIndicadores() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus('ok');
      setEmail('');
    } catch {
      setStatus('err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="zona-indicadores section-wrap" aria-label="Indicadores económicos y newsletter" data-reveal>
      <div className="section-container">
        <div className="indicadores-newsletter-grid">
          {/* Indicadores */}
          <div className="indicadores-panel">
            <header className="section-header">
              <h2 className="section-title">
                <span>INDICADORES</span>
                <span className="section-title-line" style={{ backgroundColor: '#059669' }} />
              </h2>
            </header>

            <div className="indicadores-grid">
              {INDICADORES.map((ind) => (
                <div key={ind.id} className="indicador-card">
                  <div className="indicador-icon">
                    <ind.icon size={20} />
                  </div>
                  <div className="indicador-info">
                    <p className="indicador-label">{ind.label}</p>
                    <p className="indicador-valor">
                      {ind.unidad !== '%' && ind.unidad}
                      {ind.valor}
                      {ind.unidad === '%' && ind.unidad}
                    </p>
                    <p className={`indicador-variacion ${ind.positivo ? 'variacion-positiva' : 'variacion-negativa'}`}>
                      {ind.positivo ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {ind.variacion}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="newsletter-panel">
            <div className="newsletter-icon-wrap">
              <Mail size={48} />
            </div>
            <div className="newsletter-content">
              <h3 className="newsletter-title">Entérate antes que todos</h3>
              <p className="newsletter-subtitle">
                Recibe cada mañana el resumen que necesitás para entender Nicaragua en 5 minutos.
              </p>

              {status === 'ok' ? (
                <div className="newsletter-success">
                  ✅ ¡Suscripción confirmada! Revisa tu correo.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="newsletter-form">
                  <div className="newsletter-input-group">
                    <label htmlFor="newsletter-email" className="sr-only">
                      Tu correo electrónico
                    </label>
                    <input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="newsletter-input"
                      required
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      className="newsletter-btn"
                      disabled={loading || !email.trim()}
                    >
                      {loading ? 'Enviando...' : 'Suscribirme gratis'}
                    </button>
                  </div>
                  {status === 'err' && (
                    <p className="newsletter-error">Error al suscribirse. Intenta de nuevo.</p>
                  )}
                  <p className="newsletter-disclaimer">
                    Sin spam. Cancela cuando quieras.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
