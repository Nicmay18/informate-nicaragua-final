'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type ConsentStatus = 'accepted' | 'rejected';
type CookiePrefs = { analytics: boolean; ads: boolean };

const CONSENT_KEY = 'ni_cookie_consent';
const PREFS_KEY = 'ni_cookie_preferences';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [allowAds, setAllowAds] = useState(true);

  useEffect(() => {
    const savedStatus = localStorage.getItem(CONSENT_KEY);
    const prefRaw = localStorage.getItem(PREFS_KEY);
    if (prefRaw) {
      try {
        const prefs = JSON.parse(prefRaw) as CookiePrefs;
        setAllowAnalytics(prefs.analytics);
        setAllowAds(prefs.ads);
      } catch {
        // ignore invalid JSON
      }
    }

    if (savedStatus === 'accepted' || savedStatus === 'rejected') {
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    if (!showSettings) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSettings(false);
      }
    };

    document.body.style.setProperty('overflow', 'hidden');
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.removeProperty('overflow');
      document.removeEventListener('keydown', handleKey);
    };
  }, [showSettings]);

  const persistConsent = useCallback((status: ConsentStatus, prefs: CookiePrefs) => {
    localStorage.setItem(CONSENT_KEY, status);
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new Event('ni-consent-updated'));
  }, []);

  const closeBanner = () => {
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    const prefs = { analytics: true, ads: true };
    setAllowAnalytics(true);
    setAllowAds(true);
    persistConsent('accepted', prefs);
    closeBanner();
  };

  const rejectAll = () => {
    const prefs = { analytics: false, ads: false };
    setAllowAnalytics(false);
    setAllowAds(false);
    persistConsent('rejected', prefs);
    closeBanner();
  };

  const saveCustom = () => {
    const prefs = { analytics: allowAnalytics, ads: allowAds };
    const status: ConsentStatus = prefs.analytics || prefs.ads ? 'accepted' : 'rejected';
    persistConsent(status, prefs);
    closeBanner();
  };

  if (!showBanner) return null;

  return (
    <>
      {showSettings && (
        <div className="cookie-settings">
          <button
            type="button"
            className="cookie-settings__backdrop"
            aria-label="Cerrar configuración de cookies"
            onClick={() => setShowSettings(false)}
          />
          <div className="cookie-settings__card" role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title">
            <div className="cookie-settings__header">
              <div>
                <p className="cookie-settings__eyebrow">Preferencias de privacidad</p>
                <h3 id="cookie-settings-title">Configura las cookies</h3>
              </div>
              <button type="button" className="cookie-btn cookie-btn--ghost" onClick={() => setShowSettings(false)}>
                Cerrar
              </button>
            </div>

            <div className="cookie-settings__content">
              <label className="cookie-toggle">
                <input type="checkbox" checked disabled />
                <div>
                  <strong>Cookies esenciales</strong>
                  <p>Necesarias para funciones básicas como iniciar sesión, recordar el tema y garantizar la seguridad.</p>
                </div>
              </label>
              <label className="cookie-toggle">
                <input type="checkbox" checked={allowAnalytics} onChange={(event) => setAllowAnalytics(event.target.checked)} />
                <div>
                  <strong>Analítica</strong>
                  <p>Nos permite medir el rendimiento del sitio para mejorar tu experiencia.</p>
                </div>
              </label>
              <label className="cookie-toggle">
                <input type="checkbox" checked={allowAds} onChange={(event) => setAllowAds(event.target.checked)} />
                <div>
                  <strong>Publicidad personalizada</strong>
                  <p>Autoriza anuncios relevantes mediante Google AdSense.</p>
                </div>
              </label>
            </div>

            <div className="cookie-settings__actions">
              <button type="button" className="cookie-btn cookie-btn--primary" onClick={saveCustom}>
                Guardar preferencias
              </button>
              <button type="button" className="cookie-btn cookie-btn--secondary" onClick={rejectAll}>
                Rechazar todo
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="cookie-banner"
        role="dialog"
        aria-live="polite"
        aria-label="Aviso de cookies"
        aria-hidden={showSettings}
      >
        <div className="cookie-banner__text">
          <strong>Nicaragua Informate</strong> utiliza cookies esenciales, de analítica y publicidad para mejorar tu experiencia. Puedes revisar nuestra{' '}
          <Link href="/cookies">Política de Cookies</Link> y cambiar tu elección cuando quieras.
        </div>
        <div className="cookie-banner__buttons">
          <button type="button" className="cookie-btn cookie-btn--primary" onClick={acceptAll}>
            Aceptar todo
          </button>
          <button type="button" className="cookie-btn cookie-btn--secondary" onClick={rejectAll}>
            Rechazar
          </button>
          <button type="button" className="cookie-btn cookie-btn--ghost" onClick={() => setShowSettings(true)}>
            Personalizar
          </button>
        </div>
      </div>
    </>
  );
}
