'use client';

import { useState } from 'react';
import { Mail, CircleCheck } from 'lucide-react';

/**
 * API endpoint para newsletter
 */
const NEWSLETTER_API = '/api/newsletter';

/**
 * Regex para validación de email
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Tipo de estado del formulario
 */
type FormStatus = 'idle' | 'loading' | 'ok' | 'err';

/**
 * Valida si un email tiene formato válido
 * @param email Email a validar
 * @returns true si el email es válido
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Componente de formulario de suscripción a newsletter
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState<string>('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !isValidEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(NEWSLETTER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        setStatus('ok');
        setEmail('');
      } else {
        setStatus('err');
        setError('Error al suscribirse. Intenta de nuevo.');
      }
    } catch (err) {
      setStatus('err');
      setError(err instanceof Error ? err.message : 'Error de conexión');
    }
  }

  return (
    <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
      <div style={{ background: '#8c1d18', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mail size={14} color="#fff" />
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Newsletter</span>
      </div>
      <div style={{ padding: 16 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
          Recibe las noticias más importantes cada mañana.
        </p>
        {status === 'ok' ? (
          <div style={{ color: '#16a34a', fontSize: 13, fontWeight: 600, padding: '10px 0', textAlign: 'center' }}>
            <CircleCheck size={14} style={{ marginRight: 6 }} />¡Suscrito con éxito!
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="newsletter-email" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '-4px' }}>Correo electrónico</label>
            <input 
              id="newsletter-email" 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" 
              required
              autoComplete="email"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-light)', borderRadius: 6, fontSize: 13, background: 'var(--paper)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} 
            />
            <button type="submit" disabled={status === 'loading'}
              style={{ width: '100%', padding: '10px', background: '#8c1d18', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}>
              {status === 'loading' ? 'Suscribiendo...' : 'Suscribirse'}
            </button>
            {status === 'err' && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
