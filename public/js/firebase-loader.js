/**
 * Firebase Unified Loader - Nicaragua Informate
 * Un solo punto de entrada. Cachea la instancia. Maneja errores con granularidad.
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzKKOJxcA",
  authDomain: "informate-instant-nicaragua.firebaseapp.com",
  projectId: "informate-instant-nicaragua",
  storageBucket: "informate-instant-nicaragua.firebasestorage.app",
  messagingSenderId: "24988088146",
  appId: "1:24988088146:web:d26a207508da055668ec8b",
  measurementId: "G-W1B5J61WEP"
};

let firebasePromise = null;
let dbInstance = null;
let errorType = null;

const ERROR_CODES = {
  NETWORK: 'network',
  PERMISSION_DENIED: 'permission_denied',
  UNAVAILABLE: 'unavailable',
  UNKNOWN: 'unknown',
  INIT_FAILED: 'init_failed'
};

/**
 * Inicializa Firebase UNA SOLA VEZ y cachea la promesa.
 * Si falla, guarda el tipo de error para que la UI muestre el mensaje correcto.
 */
export async function initFirebase() {
  if (firebasePromise) return firebasePromise;

  firebasePromise = (async () => {
    try {
      const { initializeApp } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
      );
      const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
      );

      const app = initializeApp(FIREBASE_CONFIG);
      let db;
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        });
      } catch (err) {
        // Si Firestore ya fue inicializado con diferentes opciones, usar getFirestore
        if (err.message && err.message.includes('already been called')) {
          const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
          db = getFirestore(app);
        } else {
          throw err;
        }
      }

      dbInstance = db;
      errorType = null;
      return { app, db, ready: true };

    } catch (err) {
      console.error('[FirebaseLoader] Init error:', err);

      // Clasificar el error para mostrar mensaje adecuado al usuario
      const msg = err.message || '';
      if (msg.includes('network') || msg.includes('fetch') || !navigator.onLine) {
        errorType = ERROR_CODES.NETWORK;
      } else if (msg.includes('permission') || msg.includes('Missing or insufficient permissions')) {
        errorType = ERROR_CODES.PERMISSION_DENIED;
      } else if (msg.includes('unavailable')) {
        errorType = ERROR_CODES.UNAVAILABLE;
      } else {
        errorType = ERROR_CODES.UNKNOWN;
      }

      return { app: null, db: null, ready: false, error: errorType, originalError: err };
    }
  })();

  return firebasePromise;
}

/**
 * Obtiene la instancia de DB ya inicializada (sin re-importar).
 */
export function getDB() {
  return dbInstance;
}

/**
 * Devuelve el último tipo de error ocurrido.
 */
export function getFirebaseError() {
  return errorType;
}

/**
 * Resetea el estado para permitir un reintento manual (ej: al hacer clic en "Reintentar").
 */
export function resetFirebase() {
  firebasePromise = null;
  dbInstance = null;
  errorType = null;
}

export { ERROR_CODES };
