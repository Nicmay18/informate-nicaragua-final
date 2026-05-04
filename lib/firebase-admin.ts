import { initializeApp, getApps, cert, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? '';

  const privateKey = rawKey
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');

  console.log('[firebase-admin] projectId:', projectId ?? 'MISSING');
  console.log('[firebase-admin] clientEmail:', clientEmail ?? 'MISSING');
  console.log('[firebase-admin] privateKey starts with:', privateKey.slice(0, 30));
  console.log('[firebase-admin] privateKey ends with:', privateKey.slice(-30));
  console.log('[firebase-admin] privateKey length:', privateKey.length);
  console.log('[firebase-admin] has real newlines:', privateKey.includes('\n'));

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[firebase-admin] Missing env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
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
