// Obtain an admin session token via the designed flow:
// service account -> custom token -> Firebase ID token -> /api/admin/session
// Prints ONLY the session token on the last line (treat as secret in output handling).
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);
const prod = Object.fromEntries(
  readFileSync('.env.vercel-prod', 'utf8')
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
const app = initializeApp({ credential });
const auth = getAuth(app);

const email = (prod.ADMIN_EMAILS || '').split(',')[0].trim();
if (!email) { console.error('no ADMIN_EMAILS'); process.exit(1); }
console.error('admin email:', email);

const uid = 'devin-audit-' + Date.now();
const customToken = await auth.createCustomToken(uid, { email });
const apiKey = 'AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzZKOJxcA';
if (!apiKey) { console.error('no web api key'); process.exit(1); }

const r = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: customToken, returnSecureToken: true }) }
);
const j = await r.json();
if (!j.idToken) { console.error('signIn failed:', JSON.stringify(j).slice(0, 300)); process.exit(1); }
console.error('idToken obtained');

const s = await fetch('https://nicaraguainformate.com/api/admin/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken: j.idToken }),
});
const sj = await s.json();
console.error('session status:', s.status);
if (!sj.token) { console.error('session failed:', JSON.stringify(sj).slice(0, 300)); process.exit(1); }
console.error('session token len:', sj.token.length, 'email:', sj.email);
console.log(sj.token);
