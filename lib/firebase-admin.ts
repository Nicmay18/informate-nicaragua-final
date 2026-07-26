import { initializeApp, getApps, cert, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { validateEnv, requireEnv } from './env';
import { logger } from './logger';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const validation = validateEnv();
  if (!validation.success) {
    throw new Error(validation.error);
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = requireEnv('FIREBASE_PROJECT_ID');
  const clientEmail = requireEnv('FIREBASE_CLIENT_EMAIL');
  const privateKeyRaw = requireEnv('FIREBASE_PRIVATE_KEY');

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

let _db: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getAdminApp());
  }
  return _db;
}

let _auth: Auth | null = null;

export function getAdminAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getAdminApp());
  }
  return _auth;
}

/** Singleton lazy para consumidores que usen adminDb.collection() directamente */
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    const value = (db as any)[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  },
});
