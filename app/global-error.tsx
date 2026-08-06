'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        section: 'global-error',
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html lang="es-NI">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Algo salió mal
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem', maxWidth: 400 }}>
            Nuestro equipo ha sido notificado del error. Puedes intentar recargar la página.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
          <a
            href="https://nicaraguainformate.com"
            style={{
              marginTop: '1rem',
              color: '#64748b',
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            Volver al inicio
          </a>
        </div>
      </body>
    </html>
  );
}
