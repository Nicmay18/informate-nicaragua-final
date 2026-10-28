'use client';

import { useEffect, useRef } from 'react';
import { getOrCreateAnonymousSession } from '@/lib/client-session';

/** Cuenta una vista de perfil por sesión (dedup 10min server-side). */
export default function NegocioVista({ negocioId, slug }: { negocioId: string; slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const payload = JSON.stringify({ negocioId, tipo: 'vista', slug, sessionId: getOrCreateAnonymousSession() });
    try {
      fetch('/api/telemetry/negocios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [negocioId, slug]);
  return null;
}
