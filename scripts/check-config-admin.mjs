// Read-only: inspect config/admin structure (keys only, NO values) and
// validate the stored Telegram token via getMe without printing it.
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);
let credential;
if (env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  credential = cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')));
} else {
  credential = cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  });
}
const db = getFirestore(initializeApp({ credential }));

const snap = await db.collection('config').doc('admin').get();
if (!snap.exists) {
  console.log('config/admin NO EXISTE');
  process.exit(0);
}
const data = snap.data();

const shape = (v, depth = 0) => {
  if (depth > 2 || v === null || typeof v !== 'object') {
    return typeof v === 'string' ? `string(len=${v.length})` : typeof v;
  }
  return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, shape(val, depth + 1)]));
};
console.log('ESTRUCTURA config/admin:', JSON.stringify(shape(data), null, 2));

const token = data?.telegram?.token;
const chatId = data?.telegram?.chatId;
console.log('telegram.token presente:', !!token);
console.log('telegram.chatId presente:', !!chatId);

if (token) {
  const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const j = await r.json();
  console.log('getMe ok:', j.ok === true, '| bot:', j.ok ? `@${j.result.username}` : j.description);
}
