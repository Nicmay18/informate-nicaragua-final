'use client';

import { ExternalLink } from 'lucide-react';

export default function DonationCard() {
  return (
    <article style={{
      background: '#fdf6f6',
      borderRadius: '16px',
      border: '1px solid #f0e0e0',
      padding: '32px',
      maxWidth: '384px',
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: 24,
    }}>
      {/* Icono corazón */}
      <div style={{
        margin: '0 auto 20px',
        width: '56px',
        height: '56px',
        background: '#c53030',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ width: '28px', height: '28px', color: '#fff' }}
          aria-hidden="true"
        >
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      </div>

      {/* Título */}
      <h2 style={{
        fontSize: '20px',
        fontWeight: 700,
        color: '#111827',
        marginBottom: '12px',
        lineHeight: 1.2,
        fontFamily: 'var(--font-merri)',
      }}>
        Apoya nuestro periodismo
      </h2>

      {/* Descripción */}
      <p style={{
        color: '#4b5563',
        fontSize: '14px',
        lineHeight: 1.6,
        marginBottom: 24,
        margin: '0 0 24px 0',
      }}>
        Tu contribución nos permite seguir informando con independencia y veracidad desde Estelí.
      </p>

      {/* Botón PayPal */}
      <a
        href="https://paypal.me/NicaraguaInformate"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#0070ba',
          color: '#fff',
          fontWeight: 600,
          fontSize: '14px',
          padding: '12px 32px',
          borderRadius: '8px',
          textDecoration: 'none',
          transition: 'all 0.2s',
          boxShadow: '0 4px 6px rgba(0, 112, 186, 0.25)',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#005ea6';
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 112, 186, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#0070ba';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 112, 186, 0.25)';
        }}
      >
        <span>Donar con PayPal</span>
        <ExternalLink size={16} />
      </a>

      {/* Texto de confianza */}
      <p style={{
        marginTop: '16px',
        fontSize: '12px',
        color: '#9ca3af',
        fontWeight: 500,
        margin: '16px 0 0 0',
      }}>
        Seguro y transparente
      </p>
    </article>
  );
}
