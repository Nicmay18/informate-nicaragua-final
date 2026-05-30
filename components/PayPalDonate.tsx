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
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold text-sm"
          aria-label="Donar"
        >
          <Heart size={18} className={isOpen ? 'fill-white' : ''} />
          <span className="hidden sm:inline">Apoyanos</span>
        </button>

        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
            <div
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Apoyá Nicaragua Informate</h3>
                  <p className="text-blue-100 text-xs mt-0.5">Tu donación mantiene el periodismo Digital</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Presets */}
              <div className="p-6 space-y-3">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.amount}
                    onClick={() => handleDonate(preset.amount)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {preset.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">${preset.amount}</span>
                        <span className="text-sm text-slate-500">— {preset.label}</span>
                      </div>
                      <p className="text-xs text-slate-400">{preset.description}</p>
                    </div>
                  </button>
                ))}

                {/* Custom amount */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2">Otro monto</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="20"
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm font-semibold"
                      />
                    </div>
                    <button
                      onClick={handleCustomDonate}
                      disabled={!customAmount || parseFloat(customAmount) <= 0}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Donar
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-slate-50 text-center">
                <p className="text-[10px] text-slate-400">Pagos seguros vía PayPal. Podés cancelar en cualquier momento.</p>
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
      <div className="w-full max-w-md mx-auto my-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Heart size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">¿Te gustó esta noticia?</h4>
            <p className="text-xs text-slate-500">Apoyá el periodismo Digital</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 25].map(amount => (
            <button
              key={amount}
              onClick={() => handleDonate(amount)}
              className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              ${amount}
            </button>
          ))}
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Otro monto
          </button>
        </div>
      </div>
    );
  }

  // Variante sidebar (widget lateral)
  return (
    <div className="w-full p-4 bg-slate-900 rounded-xl text-white">
      <div className="flex items-center gap-2 mb-3">
        <Heart size={16} className="text-red-400" />
        <h4 className="font-bold text-sm">Apoyanos</h4>
      </div>
      <p className="text-xs text-slate-400 mb-3">Tu donación mantiene este medio Digital</p>
      <div className="space-y-2">
        {[5, 10, 25].map(amount => (
          <button
            key={amount}
            onClick={() => handleDonate(amount)}
            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors"
          >
            ${amount} USD
          </button>
        ))}
      </div>
    </div>
  );
}
