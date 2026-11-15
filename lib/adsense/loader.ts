/**
 * Cargador único del script de Google AdSense.
 *
 * Regla de oro: el script `adsbygoogle.js` debe cargarse UNA sola vez por
 * página sin importar cuántos componentes lo soliciten (unidades manuales
 * + loader global para Auto ads). La deduplicación es por id de <script>
 * y por promesa compartida — dos llamadas concurrentes no duplican la
 * descarga.
 *
 * Estados: loading → loaded | failed. Si la descarga falla, la etiqueta
 * <script> se elimina del DOM y el estado vuelve a "sin cargar", de modo
 * que la siguiente llamada vuelve a intentar la descarga de verdad
 * (en vez de encontrar la etiqueta huérfana y resolver como si hubiera
 * cargado).
 */

const SCRIPT_ID = 'ni-adsense-script';
const SCRIPT_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551838';

type LoadState = 'idle' | 'loading' | 'loaded' | 'failed';

let state: LoadState = 'idle';
let loadPromise: Promise<void> | null = null;

function removeScriptTag(): void {
  document.getElementById(SCRIPT_ID)?.remove();
}

export function adsenseLoadState(): LoadState {
  return state;
}

export function loadAdsenseScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (state === 'loaded') return Promise.resolve();
  if (state === 'loading' && loadPromise) return loadPromise;

  // Estado idle o failed: limpiar cualquier resto de un intento previo.
  removeScriptTag();
  state = 'loading';

  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      state = 'loaded';
      resolve();
    };
    script.onerror = () => {
      // Falló la descarga: quitar la etiqueta para que el próximo intento
      // cree una solicitud nueva en lugar de heredar el nodo roto.
      state = 'failed';
      loadPromise = null;
      removeScriptTag();
      resolve();
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
