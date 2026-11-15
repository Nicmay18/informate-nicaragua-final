/**
 * Consentimiento de analítica para telemetría propia (JourneyTracker).
 *
 * La política de cookies declara: "Cookies de analítica... solo se instalan
 * si aceptas analítica". JourneyTracker envía pageviews, clics, scroll y
 * engagement a /api/telemetry/journey — eso ES analítica y debe respetar
 * la misma decisión que GA4.
 *
 * Reglas (mismas que ConsentScript aplica a gtag):
 * - prefs.analytics === true  → consentido
 * - prefs.analytics === false → denegado
 * - sin prefs pero consent === 'accepted' (legacy banner) → consentido
 * - sin decisión → denegado (no recopilar antes de optar)
 */

const CONSENT_KEYS = ['ni_cookie_consent', 'cookie_consent_ni'] as const;
const PREF_KEYS = ['ni_cookie_preferences', 'cookie_preferences_ni'] as const;

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const prefRaw = PREF_KEYS.map((k) => localStorage.getItem(k)).find(Boolean);
    if (prefRaw) {
      const prefs = JSON.parse(prefRaw) as { analytics?: boolean };
      return prefs.analytics === true;
    }
    const consent = CONSENT_KEYS.map((k) => localStorage.getItem(k)).find(Boolean);
    return consent === 'accepted';
  } catch {
    return false;
  }
}
