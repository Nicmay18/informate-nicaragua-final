// Preload explícito para E2E local. No lo importa el código de la aplicación.
if (process.env.NEGOCIOS_TEST_FIXTURE !== '1') throw new Error('Fixture local no habilitada');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
// Impide que Next cargue credenciales locales de cualquier .env.
for (const name of fs.readdirSync(root).filter(n => n.startsWith('.env'))) {
  if (!fs.statSync(path.join(root, name)).isFile()) continue;
  for (const line of fs.readFileSync(path.join(root, name), 'utf8').split('\n')) {
    const key = line.match(/^\s*([A-Z][A-Z0-9_]*)=/)?.[1];
    if (key && !['NODE_ENV', 'PATH', 'HOME', 'NODE_OPTIONS'].includes(key)) process.env[key] = '';
  }
}
process.env.ADMIN_API_KEY = 'negocios-local-fixture-only';
process.env.ADMIN_SESSION_SECRET = 'negocios-local-signing-only';
require('tsx/cjs');
const { createFakeDb } = require('./negocios-db.ts');
const db = createFakeDb();
const firestore = require('firebase-admin/firestore');
const app = require('firebase-admin/app');
// También cubre los wrappers ESM de firebase-admin, que leen exports del caché.
Object.defineProperties(firestore, {
  getFirestore: { value: () => db },
  FieldValue: { value: { increment: n => ({ __inc: n }), serverTimestamp: () => new Date() } },
});
Object.defineProperties(app, {
  getApps: { value: () => [{}] },
  getApp: { value: () => ({}) },
});
