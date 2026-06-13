#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').where('estado', '==', 'publicado').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  const basura = [];
  const leyes = ['ley 431', 'ley 618', 'ley 423', 'ley 779', 'código penal'];
  const terminosBasura = ['estadísticas', 'indicadores', 'multas', 'sanciones', 'obligatoriedad', 'normativa', 'marco jurídico', 'recomendaciones técnicas', 'análisis normativo'];

  for (const n of docs) {
    const c = (n.contenido || '').toLowerCase();
    const t = (n.titulo || '').toLowerCase();
    const issues = [];

    for (const ley of leyes) {
      if (c.includes(ley)) issues.push(ley.toUpperCase());
    }
    for (const tb of terminosBasura) {
      if (c.includes(tb)) issues.push(tb.toUpperCase());
    }
    if (/2026/.test(n.contenido || '')) issues.push('FECHA_2026');

    if (issues.length > 0) {
      basura.push({
        id: n.id,
        titulo: n.titulo,
        issues: [...new Set(issues)].join(', '),
        slug: n.slug || ''
      });
    }
  }

  console.log(`\n=== ${basura.length} NOTICIAS CON BASURA ===\n`);
  basura.forEach((b, i) => {
    console.log(`${i+1}. ${b.titulo}`);
    console.log(`   Problemas: ${b.issues}`);
    console.log(`   ID: ${b.id}`);
    console.log('');
  });

  if (basura.length === 0) {
    console.log('NINGUNA NOTICIA TIENE BASURA. TODAS ESTAN LIMPIAS.');
  }

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
