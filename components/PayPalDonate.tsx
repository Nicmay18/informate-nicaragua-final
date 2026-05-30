'use client';

import { useState } from 'react';
import { Heart, X, Coffee, Gift, Zap } from 'lucide-react';

interface DonationPreset {
  amount: number;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const PRESETS: DonationPreset[] = [
  { amount: 5, label: 'Café', icon: <Coffee size={18} />, description: 'Un café para el equipo' },
  { amount: 10, label: 'Apoyo', icon: <Heart size={18} />, description: 'Ayuda a mantener el servidor' },
  { amount: 25, label: 'Premium', icon: <Zap size={18} />, description: 'Acceso prioritario a noticias' },
  { amount: 50, label: 'Patrocinador', icon: <Gift size={18} />, description: 'Tu nombre en los créditos' },
];

interface PayPalDonateProps {
  variant?: 'floating' | 'inline' | 'sidebar';
}

export default function PayPalDonate({ variant = 'floating' }: PayPalDonateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const handleDonate = (amount: number) => {
    const paypalUrl = `https://paypal.me/NicaraguaInformate/${amount}USD`;
    window.open(paypalUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleCustomDonate = () => {
    const amount = parseFloat(customAmount);
    if (amount > 0) {
      handleDonate(amount);
    }
  };

  // Variante flotante (botón en esquina)
  if (variant === 'floating') {
    return (
      <>
        {/* Botón flotante */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'linear-gradient(to right, #2563eb, #1d4ed8)', color: '#fff', borderRadius: 9999, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          aria-label="Donar"
        >
          <Heart size={18} />
          <span style={{ display: 'none' }} className="sm-show">Apoyanos</span>
        </button>

        {/* Modal */}
        {isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.5)' }} onClick={() => setIsOpen(false)}>
            <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(to right, #2563eb, #1d4ed8)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>Apoyá Nicaragua Informate</h3>
                  <p style={{ color: '#bfdbfe', fontSize: 12, margin: '4px 0 0' }}>Tu donación mantiene el periodismo Digital</p>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Presets */}
              <div style={{ padding: 24 }}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.amount}
                    onClick={() => handleDonate(preset.amount)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: 12, borderRadius: 12, border: '2px solid #f1f5f9', background: '#fff', marginBottom: 8, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {preset.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>${preset.amount}</span>
                        <span style={{ fontSize: 14, color: '#64748b' }}>— {preset.label}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{preset.description}</p>
                    </div>
                  </button>
                ))}

                {/* Custom amount */}
                <div style={{ paddingTop: 12, borderTop: '1px solid #f1f5f9', marginTop: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 8 }}>Otro monto</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>$</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="20"
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px 10px 28px', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 600 }}
                      />
                    </div>
                    <button
                      onClick={handleCustomDonate}
                      disabled={!customAmount || parseFloat(customAmount) <= 0}
                      style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 12, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', opacity: (!customAmount || parseFloat(customAmount) <= 0) ? 0.5 : 1 }}
                    >
                      Donar
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '12px 24px', background: '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>Pagos seguros vía PayPal. Podés cancelar en cualquier momento.</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Variante inline (dentro de artículos)
  if (variant === 'inline') {
    return (
      <div style={{ width: '100%', maxWidth: 480, margin: '24px auto', padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={20} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, margin: 0 }}>¿Te gustó esta noticia?</h4>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Apoyá el periodismo Digital</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[5, 10, 25].map(amount => (
            <button
              key={amount}
              onClick={() => handleDonate(amount)}
              style={{ padding: '8px 16px', background: '#fff', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
            >
              ${amount}
            </button>
          ))}
          <button
            onClick={() => setIsOpen(true)}
            style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Otro monto
          </button>
        </div>
      </div>
    );
  }

  // Variante sidebar (widget lateral)
  return (
    <div style={{ width: '100%', padding: 16, background: '#0f172a', borderRadius: 12, color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Heart size={16} style={{ color: '#f87171' }} />
        <h4 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Apoyanos</h4>
      </div>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Tu donación mantiene este medio Digital</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[5, 10, 25].map(amount => (
          <button
            key={amount}
            onClick={() => handleDonate(amount)}
            style={{ width: '100%', padding: '8px 0', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            ${amount} USD
          </button>
        ))}
      </div>
    </div>
  );
}
