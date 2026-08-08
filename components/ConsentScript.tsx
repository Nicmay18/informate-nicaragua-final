'use client';

import { useEffect } from 'react';

type CookiePrefs = { analytics?: boolean; ads?: boolean };

const CONSENT_KEYS = ['ni_cookie_consent', 'cookie_consent_ni'] as const;
const PREF_KEYS = ['ni_cookie_preferences', 'cookie_preferences_ni'] as const;

function getConsent(): string | null {
  return CONSENT_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) || null;
}

function getPrefs(): CookiePrefs | null {
  const raw = PREF_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CookiePrefs;
  } catch {
    return null;
  }
}

export default function ConsentScript() {
  useEffect(() => {
    const apply = () => {
      if (typeof window.gtag !== 'function') return;

      const consent = getConsent();
      const prefs = getPrefs();

      // Default consent is already granted in DeferredAnalytics. Only downgrade if user explicitly rejected.
      let analytics = true;
      let ads = true;

      if (consent === 'rejected') {
        if (prefs) {
          analytics = prefs.analytics !== false;
          ads = prefs.ads !== false;
        } else {
          analytics = false;
          ads = false;
        }
      }

      window.gtag('consent', 'update', {
        analytics_storage: analytics ? 'granted' : 'denied',
        ad_storage: ads ? 'granted' : 'denied',
        ad_user_data: ads ? 'granted' : 'denied',
        ad_personalization: ads ? 'granted' : 'denied',
      });
    };

    apply();

    // Retry if gtag has not loaded yet
    if (typeof window.gtag !== 'function') {
      let attempts = 0;
      const interval = setInterval(() => {
        if (typeof window.gtag === 'function' || attempts++ > 30) {
          clearInterval(interval);
          if (typeof window.gtag === 'function') apply();
        }
      }, 100);
    }

    // Re-apply when the user updates preferences in the banner
    const handleConsentUpdated = () => apply();
    window.addEventListener('ni-consent-updated', handleConsentUpdated);
    window.addEventListener('storage', handleConsentUpdated);
    return () => {
      window.removeEventListener('ni-consent-updated', handleConsentUpdated);
      window.removeEventListener('storage', handleConsentUpdated);
    };
  }, []);

  return null;
}
