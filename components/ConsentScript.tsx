'use client';

import { useEffect, useState } from 'react';

type CookiePrefs = { analytics: boolean; ads: boolean };

export default function ConsentScript() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ni_cookie_consent');
    setConsent(saved);

    const handler = () => {
      const updated = localStorage.getItem('ni_cookie_consent');
      setConsent(updated);
    };

    window.addEventListener('ni-consent-updated', handler);
    return () => window.removeEventListener('ni-consent-updated', handler);
  }, []);

  useEffect(() => {
    if (consent !== 'accepted') return;

    const prefsRaw = localStorage.getItem('ni_cookie_preferences');
    let shouldLoadAds = true;
    if (prefsRaw) {
      try {
        const prefs = JSON.parse(prefsRaw) as CookiePrefs;
        shouldLoadAds = !!prefs.ads;
      } catch {
        shouldLoadAds = true;
      }
    }

    if (!shouldLoadAds) return;

    const id = 'adsbygoogle-script';
    if (document.getElementById(id)) return;

    const script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551838';
    document.head.appendChild(script);
  }, [consent]);

  return null;
}
