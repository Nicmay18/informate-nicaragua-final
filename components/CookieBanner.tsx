'use client';

import { useState, useEffect } from 'react';

type ConsentStatus = 'pending' | 'accepted' | 'rejected';

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentStatus>('pending');
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ni_cookie_consent');
    if (saved === 'accepted' || saved === 'rejected') {
      setConsent(saved);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('ni_cookie_consent', 'accepted');
    setConsent('accepted');
    setShowBanner(false);
    // Cargar Analytics y AdSense
    loadAnalytics();
  };

  const handleReject = () => {
    localStorage.setItem('ni_cookie_consent', 'rejected');
    setConsent('rejected');
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowSettings(true);
  };

  const loadAnalytics = () => {
    // Aquí puedes cargar Google Analytics si el usuario acepta
    // Por ahora, AdSense ya está cargado en el layout
  };

  if (!showBanner) return null;

  if (showSettings) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1a1a2e',
        color: '#fff',
        padding: '2rem',
        zIndex: 9999,
        borderTop: '3px solid #c41e3a',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 700 }}>Configuración de Cookies</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked disabled style={{ marginRight: '12px', width: '18px', height: '18px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Cookies Esenciales</strong>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Necesarias para el funcionamiento básico del sitio (sesión, tema)</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ marginRight: '12px', width: '18px', height: '18px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Cookies de Analítica</strong>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Google Analytics para entender cómo usas el sitio</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ marginRight: '12px', width: '18px', height: '18px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Cookies de Publicidad</strong>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Google AdSense para mostrar anuncios relevantes</span>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setShowSettings(false);
                handleAccept();
              }}
              style={{
                background: '#c41e3a',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Guardar Preferencias
            </button>
            <button
              onClick={() => setShowSettings(false)}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #4a4a5e',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#1a1a2e',
      color: '#fff',
      padding: '1.5rem',
      zIndex: 9999,
      borderTop: '3px solid #c41e3a',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem', color: '#cbd5e1' }}>
          <strong>Nicaragua Informate</strong> utiliza cookies esenciales, de analítica y de publicidad para mejorar tu experiencia y mostrar anuncios relevantes. 
          Al continuar navegando, aceptas nuestro uso de cookies. 
          <a href="/cookies" style={{ color: '#c41e3a', textDecoration: 'underline', marginLeft: '8px' }}>Más información</a>
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleAccept}
            style={{
              background: '#c41e3a',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Aceptar Todo
          </button>
          <button
            onClick={handleReject}
            style={{
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid #4a4a5e',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Rechazar Todo
          </button>
          <button
            onClick={handleCustomize}
            style={{
              background: 'transparent',
              color: '#c41e3a',
              border: '1px solid #c41e3a',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Configurar
          </button>
        </div>
      </div>
    </div>
  );
}
