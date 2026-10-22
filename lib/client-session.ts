/**
 * ID de sesión anónimo compartido para telemetría cliente.
 * Misma clave que JourneyTracker ('ni_session_id') para que un mismo
 * visitante comparta sesión entre módulos. Sin PII: solo un UUID aleatorio.
 */

const SESSION_STORAGE_KEY = 'ni_session_id';
const SESSION_TIMESTAMP_KEY = 'ni_session_ts';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export function getOrCreateAnonymousSession(): string {
  if (typeof window === 'undefined') return 'ssr-' + Math.random().toString(36).slice(2, 10);
  try {
    const now = Date.now();
    const storedId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const storedTs = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);

    if (storedId && storedTs && now - parseInt(storedTs, 10) < SESSION_TIMEOUT_MS) {
      sessionStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
      return storedId;
    }

    const newId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `s-${now}-${Math.random().toString(36).slice(2, 9)}`;

    sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
    return newId;
  } catch {
    return `s-fallback-${Date.now()}`;
  }
}
