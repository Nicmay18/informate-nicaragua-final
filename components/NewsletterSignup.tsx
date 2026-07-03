'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setMsg('Ingresa un email válido.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setStatus('success');
        setMsg('¡Suscripción exitosa!');
        setEmail('');
      } else {
        setStatus('error');
        setMsg('Error al suscribirse. Intenta de nuevo.');
      }
    } catch {
      setStatus('error');
      setMsg('Error de conexión. Intenta de nuevo.');
    }
  }

  if (status === 'success') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontSize: 14, fontWeight: 600 }}>
        <CheckCircle size={18} /> {msg}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="newsletter-form">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="tu@email.com"
        aria-label="Correo electrónico para suscribirse al newsletter"
        className="newsletter-input"
      />
      {status === 'error' && (
        <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0 }}>{msg}</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary-solid"
      >
        {status === 'loading' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
        {status === 'loading' ? 'Enviando...' : 'Suscribirme'}
      </button>
    </form>
  );
}
