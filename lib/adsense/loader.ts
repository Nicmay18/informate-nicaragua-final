/**
 * Cargador único del script de Google AdSense.
 *
 * Regla de oro: el script `adsbygoogle.js` debe cargarse UNA sola vez por
 * página sin importar cuántos componentes lo soliciten (unidades manuales
 * + loader global para Auto ads). La deduplicación es por id de <script>
 * y por promesa compartida — dos llamadas concurrentes no duplican la
 * descarga.
 */

const SCRIPT_ID = 'ni-adsense-script';
const SCRIPT_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551838';

let loadPromise: Promise<void> | null = null;

export function loadAdsenseScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (loadPromise) return loadPromise;
  if (document.getElementById(SCRIPT_ID)) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }

  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => {
      // Si falla, permitir reintento en la próxima navegación.
      loadPromise = null;
      resolve();
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
