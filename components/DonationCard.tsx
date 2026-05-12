'use client';

import { Heart, ExternalLink } from 'lucide-react';

export default function DonationCard() {
  return (
    <div className="donation-card" style={{
      background: 'linear-gradient(135deg, rgba(196, 30, 58, 0.05) 0%, rgba(196, 30, 58, 0.02) 100%)',
      border: '1px solid rgba(196, 30, 58, 0.15)',
      borderRadius: 12,
      padding: '20px',
      marginBottom: 24,
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c41e3a 0%, #8c1d18 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Heart size={24} color="#fff" fill="#fff" />
        </div>
      </div>

      <h3 style={{
        fontSize: 17,
        fontWeight: 700,
        color: '#1a1a2e',
        marginBottom: 8,
        fontFamily: 'var(--font-merri)',
      }}>
        Apoya nuestro periodismo
      </h3>

      <p style={{
        fontSize: 13,
        color: '#5a5a6e',
        lineHeight: 1.6,
        marginBottom: 16,
        margin: '0 0 16px 0',
      }}>
        Tu contribución nos permite seguir informando con independencia y veracidad desde Estelí.
      </p>

      <a
        href="https://paypal.me/NicaraguaInformate"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'linear-gradient(135deg, #0070ba 0%, #005ea6 100%)',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 112, 186, 0.25)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 112, 186, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 112, 186, 0.25)';
        }}
      >
        <span>Donar con PayPal</span>
        <ExternalLink size={16} />
      </a>

      <p style={{
        fontSize: 11,
        color: '#8a8a9e',
        marginTop: 12,
        marginBottom: 0,
      }}>
        Seguro y transparente
      </p>

      <style>{`
        [data-theme="dark"] .donation-card {
          background: linear-gradient(135deg, rgba(196, 30, 58, 0.1) 0%, rgba(196, 30, 58, 0.05) 100%);
          border-color: rgba(196, 30, 58, 0.3);
        }
        [data-theme="dark"] .donation-card h3 {
          color: #f5f5f5;
        }
        [data-theme="dark"] .donation-card p {
          color: #a3a3a3;
        }
        [data-theme="dark"] .donation-card p:last-child {
          color: #737373;
        }
      `}</style>
    </div>
  );
}
