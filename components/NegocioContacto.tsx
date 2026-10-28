'use client';

import { getOrCreateAnonymousSession } from '@/lib/client-session';
import type { PublicNegocio } from '@/lib/negocios/modelo';

function track(negocioId: string, tipo: 'vista' | 'whatsapp' | 'telefono' | 'web', slug?: string) {
  const payload = JSON.stringify({ negocioId, tipo, slug, sessionId: getOrCreateAnonymousSession() });
  try {
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon?.('/api/telemetry/negocios', blob)) return;
    fetch('/api/telemetry/negocios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

const BTN: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 18px',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 15,
  textDecoration: 'none',
  border: 'none',
  cursor: 'pointer',
};

/** Botones de contacto con clic medible. WhatsApp va a wa.me directo. */
export default function NegocioContacto({ negocio }: { negocio: PublicNegocio }) {
  const wa = negocio.whatsapp
    ? `https://wa.me/${negocio.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${negocio.nombre}, los vi en Nicaragua Informate Negocios`)}`
    : '';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="sponsored nofollow noopener"
          onClick={() => track(negocio.id, 'whatsapp', negocio.slug)}
          style={{ ...BTN, background: '#25d366', color: '#fff' }}
        >
          WhatsApp
        </a>
      )}
      {negocio.telefono && (
        <a
          href={`tel:${negocio.telefono.replace(/[^+\d]/g, '')}`}
          rel="nofollow"
          onClick={() => track(negocio.id, 'telefono', negocio.slug)}
          style={{ ...BTN, background: '#1e293b', color: '#fff' }}
        >
          Llamar
        </a>
      )}
      {negocio.web && (
        <a
          href={negocio.web}
          target="_blank"
          rel="sponsored nofollow noopener"
          onClick={() => track(negocio.id, 'web', negocio.slug)}
          style={{ ...BTN, background: '#e2e8f0', color: '#0f172a' }}
        >
          Sitio web
        </a>
      )}
    </div>
  );
}
