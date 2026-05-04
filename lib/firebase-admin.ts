import { initializeApp, getApps, cert, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) return getApp();

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    console.log('[firebase-admin] using base64 account, project:', sa.project_id);
    return initializeApp({ credential: cert(sa) });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');

  console.log('[firebase-admin] projectId:', projectId ?? 'MISSING');
  console.log('[firebase-admin] clientEmail:', clientEmail ? clientEmail.slice(0, 20) + '...' : 'MISSING');
  console.log('[firebase-admin] key_starts:', privateKey.slice(0, 27));
  console.log('[firebase-admin] key_length:', privateKey.length);
  console.log('[firebase-admin] key_newlines:', (privateKey.match(/\n/g) ?? []).length);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('[firebase-admin] Missing env vars');
  }

  return initializeApp({ credential: cert({ projectId, privateKey, clientEmail }) });
}

let _db: Firestore | null = null;

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    if (!_db) _db = getFirestore(getAdminApp());
    return Reflect.get(_db, prop, _db);
  },
});
