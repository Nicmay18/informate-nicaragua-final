'use client';

import { useEffect, useState } from 'react';

type CookiePrefs = { ads?: boolean };

const CONSENT_KEYS = ['cookie_consent_ni', 'ni_cookie_consent'];
const PREF_KEYS = ['cookie_preferences_ni', 'ni_cookie_preferences'];
const MONETAG_SRC = 'https://5gvci.com/act/files/tag.min.js?z=11061275';
const DATA_ZONE = '11061275';

const hasAdsPreference = (prefs: CookiePrefs | null) => {
  if (!prefs) return true;
  if (typeof prefs.ads === 'boolean') return prefs.ads;
  return true;
};

export default function MonetagGate() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const evaluateConsent = () => {
      if (typeof window === 'undefined') return;

      const consentAccepted = CONSENT_KEYS.some((key) => localStorage.getItem(key) === 'accepted');
      if (!consentAccepted) {
        setShouldRender(false);
        return;
      }

      const prefsRaw = PREF_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
      let prefs: CookiePrefs | null = null;
      if (prefsRaw) {
        try {
          prefs = JSON.parse(prefsRaw);
        } catch {
          prefs = null;
        }
      }

      setShouldRender(hasAdsPreference(prefs));
    };

    evaluateConsent();
    window.addEventListener('ni-consent-updated', evaluateConsent);
    return () => window.removeEventListener('ni-consent-updated', evaluateConsent);
  }, []);

  if (!shouldRender) return null;

  return <script src={MONETAG_SRC} data-zone={DATA_ZONE} async onError={() => console.error('Monetag script failed to load')} />;
}
