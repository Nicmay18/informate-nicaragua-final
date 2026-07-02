import { initializeApp, getApps, cert, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { validateEnv, requireEnv } from './env';
import { logger } from './logger';

/**
 * Inicializa la aplicación de Firebase Admin SDK
 * @returns Instancia de Firebase App
 * @throws Error si faltan credenciales o son inválidas
 */
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // ✅ Validar todas las env vars en startup
  const validation = validateEnv();
  if (!validation.success) {
    throw new Error(validation.error);
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = requireEnv('FIREBASE_PROJECT_ID');
  const clientEmail = requireEnv('FIREBASE_CLIENT_EMAIL');
  const privateKeyRaw = requireEnv('FIREBASE_PRIVATE_KEY');

  // Diagnostic log (safe — no secrets revealed)
  logger.debug('[firebase-admin] env check:', {
    hasBase64: !!b64,
    base64Length: b64?.length || 0,
    projectIdLength: projectId.length,
    clientEmailPattern: clientEmail.split('@')[0] + '@***',
    privateKeyLength: privateKeyRaw.length,
  });

  if (b64 && b64.trim().length > 10) {
    try {
      const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      
      if (!sa.project_id) {
        throw new Error('Service account missing project_id');
      }
      
      logger.debug('[firebase-admin] initialized with base64 credentials');
      return initializeApp({ credential: cert(sa) });
    } catch (error) {
      throw new Error(`Failed to parse base64 service account: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('[firebase-admin] Missing required environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
  }

  const privateKey = privateKeyRaw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');

  if (privateKey.length < 100) {
    throw new Error('[firebase-admin] Private key appears to be invalid (too short)');
  }

  logger.debug('[firebase-admin] initialized with environment credentials');
  return initializeApp({ credential: cert({ projectId, privateKey, clientEmail }) });
}

/**
 * Instancia singleton de Firestore
 * Se inicializa de forma lazy para evitar errores durante el build
 */
let _db: Firestore | null = null;

/**
 * Obtiene la instancia de Firestore
 * @returns Instancia de Firestore
 */
export function getAdminDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getAdminApp());
  }
  return _db;
}

/**
 * Instancia singleton de Firebase Admin Auth
 */
let _auth: Auth | null = null;

/**
 * Obtiene la instancia de Firebase Admin Auth
 * @returns Instancia de Auth
 */
export function getAdminAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getAdminApp());
  }
  return _auth;
}

/**
 * Proxy para backward compatibility
 * @deprecated Usar getAdminDb() directamente
 */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    return Reflect.get(db, prop);
  },
});
