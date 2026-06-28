#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  try {
    const sa = JSON.parse(readFileSync('./scripts/firebase-admin-key.json', 'utf8'));
    return getFirestore(initializeApp({ credential: cert(sa) }));
  } catch {}
  const { FIREBASE_PROJECT_ID: p, FIREBASE_CLIENT_EMAIL: e, FIREBASE_PRIVATE_KEY: k } = process.env;
  if (p && e && k) return getFirestore(initializeApp({ credential: cert({ projectId: p, clientEmail: e, privateKey: k.replace(/\\n/g, '\n') }) }));
  throw new Error('Sin credenciales');
}

const FRASES_IA = [
  'en el dinámico mundo', 'en el vertiginoso mundo', 'en un mundo cada vez más',
  'es fundamental destacar', 'es importante señalar', 'cabe destacar que',
  'en este contexto', 'en definitiva', 'en conclusión', 'en resumen',
  'es crucial', 'es esencial', 'es vital recordar',
  'a medida que avanzamos', 'en el panorama actual',
  'sin lugar a dudas', 'no cabe duda', 'está claro que',
  'en el ámbito de', 'en el marco de',
];

const db = initFirebase();
const snap = await db.collection('noticias')
  .where('slug', '==', 'informe-deceso-de-elisa-benard-en-california-eeuu')
  .limit(1).get();

if (snap.empty) {
  // Buscar por título
  const snap2 = await db.collection('noticias').get();
  let found = null;
  snap2.forEach(d => {
    const t = d.data().titulo || '';
    if (t.toLowerCase().includes('elisa benard') || t.toLowerCase().includes('benard')) {
      found = { id: d.id, ...d.data() };
    }
  });
  if (!found) { console.log('No se encontró la noticia'); process.exit(0); }
  
  const texto = ((found.contenido || '') + ' ' + (found.resumen || '')).toLowerCase();
  const encontradas = FRASES_IA.filter(f => texto.includes(f));
  console.log('\n📰 Noticia:', found.titulo);
  console.log('\n🔍 Frases que dispararon la alerta:');
  encontradas.forEach(f => console.log(`   → "${f}"`));
  console.log('\n📄 Resumen actual:');
  console.log(found.resumen);
  console.log('\n📄 Inicio del contenido:');
  console.log((found.contenido || '').substring(0, 600));
} else {
  const doc = snap.docs[0];
  const n = doc.data();
  const texto = ((n.contenido || '') + ' ' + (n.resumen || '')).toLowerCase();
  const encontradas = FRASES_IA.filter(f => texto.includes(f));
  console.log('\n📰 Noticia:', n.titulo);
  console.log('\n🔍 Frases que dispararon la alerta:');
  encontradas.forEach(f => console.log(`   → "${f}"`));
  console.log('\n📄 Resumen actual:');
  console.log(n.resumen);
  console.log('\n📄 Inicio del contenido:');
  console.log((n.contenido || '').substring(0, 600));
}

process.exit(0);
