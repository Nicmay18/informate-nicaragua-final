'use client';

import { useState } from 'react';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';

interface NewsletterSignupProps {
  variant?: 'inline' | 'sidebar';
}

export default function NewsletterSignup({ variant = 'inline' }: NewsletterSignupProps) {
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
        setMsg('¡Suscripción exitosa! Recibirás las noticias más importantes.');
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

  if (variant === 'sidebar') {
    return (
      <div style={{
        background: 'var(--c-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Mail size={18} color="#fff" />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Newsletter</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 14, lineHeight: 1.5 }}>
          Las noticias más importantes de Nicaragua en tu correo.
        </p>
        {status === 'success' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#86efac', fontSize: 13 }}>
            <CheckCircle size={16} /> {msg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                padding: '9px 12px', borderRadius: 6, border: 'none',
                fontSize: 14, outline: 'none', color: '#111827',
                width: '100%',
              }}
            />
            {status === 'error' && <p style={{ fontSize: 12, color: '#fca5a5', margin: 0 }}>{msg}</p>}
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                padding: '9px 16px', borderRadius: 6, border: 'none',
                background: 'var(--c-accent)', color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {status === 'loading' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {status === 'loading' ? 'Enviando...' : 'Suscribirse'}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--c-primary), #0F2340)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--s-8) var(--s-6)',
      color: '#fff',
      textAlign: 'center',
      margin: 'var(--s-10) 0',
    }}>
      <Mail size={32} color="#C41E3A" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>
        Mantente informado
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24, fontSize: '0.95rem', maxWidth: 480, margin: '0 auto 24px' }}>
        Recibe las noticias más importantes de Nicaragua directamente en tu correo. Sin spam.
      </p>
      {status === 'success' ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#86efac', fontSize: 15, fontWeight: 600 }}>
          <CheckCircle size={20} /> {msg}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 480, margin: '0 auto' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            style={{
              flex: 1, minWidth: 200, padding: '12px 16px',
              borderRadius: 'var(--radius-sm)', border: 'none',
              fontSize: 15, outline: 'none', color: '#111827',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '12px 24px', borderRadius: 'var(--radius-sm)',
              border: 'none', background: '#C41E3A', color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}
          >
            {status === 'loading' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {status === 'loading' ? 'Enviando...' : 'Suscribirme gratis'}
          </button>
          {status === 'error' && (
            <p style={{ width: '100%', textAlign: 'center', fontSize: 13, color: '#fca5a5', margin: '4px 0 0' }}>{msg}</p>
          )}
        </form>
      )}
    </div>
  );
}
