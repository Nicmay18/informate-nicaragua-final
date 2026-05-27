'use client';

import { useEffect, useState } from 'react';

type CookiePrefs = { analytics?: boolean; ads?: boolean };

const CONSENT_KEYS = ['ni_cookie_consent', 'cookie_consent_ni'] as const;
const PREF_KEYS = ['ni_cookie_preferences', 'cookie_preferences_ni'] as const;
const GA_ID = 'G-W1B5J61WEP';

export default function ConsentScript() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    const getConsent = () => CONSENT_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) || null;
    setConsent(getConsent());

    const handler = () => setConsent(getConsent());
    window.addEventListener('ni-consent-updated', handler);
    return () => window.removeEventListener('ni-consent-updated', handler);
  }, []);

  useEffect(() => {
    if (consent !== 'accepted') return;

    const prefsRaw = PREF_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    let shouldLoadAnalytics = true;
    if (prefsRaw) {
      try {
        const prefs = JSON.parse(prefsRaw) as CookiePrefs;
        shouldLoadAnalytics = prefs.analytics !== false;
      } catch {
        shouldLoadAnalytics = true;
      }
    }

    if (shouldLoadAnalytics) {
      const gtagId = 'gtag-script';
      if (!document.getElementById(gtagId)) {
        const script = document.createElement('script');
        script.id = gtagId;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(script);

        const initScript = document.createElement('script');
        initScript.id = 'gtag-init';
        initScript.textContent = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            send_page_view: true,
            page_path: window.location.pathname,
            cookie_flags: 'SameSite=None;Secure'
          });
        `;
        document.head.appendChild(initScript);
      }
    }
  }, [consent]);

  return null;
}
