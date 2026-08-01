import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { getCachedNoticias } from '../lib/db/cached-firestore.mjs';

config({ path: '.env.local' });

const __dirname = dirname(fileURLToPath(import.meta.url));

function getServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  }
  const path = join(__dirname, '..', 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

const sa = getServiceAccount();
initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore();

await getCachedNoticias(db, true);
console.log('✅ Caché de noticias actualizada.');
