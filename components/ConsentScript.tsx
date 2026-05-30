'use client';

import { useEffect } from 'react';

type CookiePrefs = { analytics?: boolean; ads?: boolean };

const CONSENT_KEYS = ['ni_cookie_consent', 'cookie_consent_ni'] as const;
const PREF_KEYS = ['ni_cookie_preferences', 'cookie_preferences_ni'] as const;

// gtag is already declared in Analytics.tsx

export default function ConsentScript() {
  useEffect(() => {
    const getConsent = () => CONSENT_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) || null;
    const consent = getConsent();

    if (consent !== 'accepted' || typeof window.gtag !== 'function') return;

    const prefsRaw = PREF_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    let analytics = true;
    let ads = true;
    if (prefsRaw) {
      try {
        const prefs = JSON.parse(prefsRaw) as CookiePrefs;
        analytics = prefs.analytics !== false;
        ads = prefs.ads !== false;
      } catch {
        // ignore
      }
    }

    window.gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: ads ? 'granted' : 'denied',
      ad_user_data: ads ? 'granted' : 'denied',
      ad_personalization: ads ? 'granted' : 'denied',
    });
  }, []);

  return null;
}
