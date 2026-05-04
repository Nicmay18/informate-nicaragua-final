'use client';
import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'ok' : 'err');
      if (res.ok) setEmail('');
    } catch {
      setStatus('err');
    }
  }

  return (
    <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
      <div style={{ background: '#8c1d18', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="fas fa-envelope" style={{ color: '#fff', fontSize: 14 }} />
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Newsletter</span>
      </div>
      <div style={{ padding: 16 }}>
        <p style={{ color: 'var(--ink-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
          Recibe las noticias más importantes cada mañana.
        </p>
        {status === 'ok' ? (
          <div style={{ color: '#16a34a', fontSize: 13, fontWeight: 600, padding: '10px 0', textAlign: 'center' }}>
            <i className="fas fa-check-circle" style={{ marginRight: 6 }} />¡Suscrito con éxito!
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-light)', borderRadius: 6, fontSize: 13, background: 'var(--paper)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
            <button type="submit" disabled={status === 'loading'}
              style={{ width: '100%', padding: '10px', background: '#8c1d18', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}>
              {status === 'loading' ? 'Suscribiendo...' : 'Suscribirse'}
            </button>
            {status === 'err' && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>Error. Intenta de nuevo.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
