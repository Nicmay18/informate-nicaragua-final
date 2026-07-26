'use client';

import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function NewsletterBanner() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('success');
    setEmail('');
    setTimeout(() => setStatus('idle'), 4000);
  };

  return (
    <section className="newsletter-banner" aria-label="Suscripción al newsletter" data-reveal>
      <div className="newsletter-banner__inner">
        <div className="newsletter-banner__icon">
          <Mail size={32} />
        </div>
        <div className="newsletter-banner__content">
          <h2 className="newsletter-banner__title">Recibe las noticias de Nicaragua en tu correo</h2>
          <p className="newsletter-banner__text">
            Resumen diario con las noticias m&aacute;s importantes. Gratis y sin spam.
          </p>
        </div>
        <form className="newsletter-banner__form" onSubmit={handleSubmit}>
          <label htmlFor="nw-banner-email" className="sr-only">Correo electr&oacute;nico</label>
          <input
            id="nw-banner-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@gmail.com"
            aria-label="Tu correo electr&oacute;nico"
            required
            className="newsletter-banner__input"
          />
          <button type="submit" className="newsletter-banner__btn">
            {status === 'success' ? (
              <><CheckCircle2 size={18} /> Suscrito</>
            ) : (
              'Suscribirme'
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
