/**
 * Migra perfiles erróneos claros a perfiles correctos.
 * Basado en re-eval-perfiles-result.json
 * Aplica solo cambios inequívicos (no ambiguos).
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const e = path.join(process.cwd(), '.env.local');
if (fs.existsSync(e)) {
  for (const l of fs.readFileSync(e, 'utf8').split('\n')) {
    const l2 = l.replace(/\r$/, '');
    const m = l2.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  }
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  })
});

const db = admin.firestore();

const CORRECTIONS = [
  { id: '3qYRcThYdkrzWJRDSfhy', perfil: 'espectaculos', categoria: 'Espectáculos' },
  { id: '4G7Uq0yDZgiHpGyB5GSS', perfil: 'espectaculos', categoria: 'Espectáculos' },
  { id: 'lzsto5T2q85IgrVkqlA2', perfil: 'espectaculos', categoria: 'Espectáculos' },
  { id: 'gYezxCEUx17WQHH3SCqI', perfil: 'nacionales', categoria: 'Nacionales' },
  { id: 'iowQzBgiwSPPXCC4EsJD', perfil: 'nacionales', categoria: 'Nacionales' },
  { id: 'odPH8kyPelb1S1TjnuPX', perfil: 'nacionales', categoria: 'Nacionales' },
  { id: 'tuK9ZveBwJom7dhByyNx', perfil: 'nacionales', categoria: 'Nacionales' },
  { id: 'yVuoBkFOUU3OTJTMgv5l', perfil: 'nacionales', categoria: 'Nacionales' },
  { id: 'nDiTklfg2RHYI4M3jWXB', perfil: 'sucesos', categoria: 'Sucesos' },
  { id: 'wxr5VjHx23bZpd620Xzp', perfil: 'sucesos', categoria: 'Sucesos' },
  { id: 'gIEhBi4fFkzZSoldHdUF', perfil: 'deportes', categoria: 'Deportes' },
  { id: '2CG5EYW3URKVAqzAVxs5', perfil: 'espectaculos', categoria: 'Espectáculos' },
];

(async () => {
  console.log('=== MIGRACION DE PERFILES ===');
  const batch = db.batch();
  let applied = 0;

  for (const corr of CORRECTIONS) {
    const ref = db.collection('noticias').doc(corr.id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`IGNORADO (no existe): ${corr.id}`);
      continue;
    }
    const data = snap.data();
    const antes = { perfil: data.perfil || null, categoria: data.categoria };
    if (data.perfil === corr.perfil && data.categoria === corr.categoria) {
      console.log(`SIN CAMBIO: ${corr.id} | ${data.titulo?.substring(0, 50)}...`);
      continue;
    }
    batch.update(ref, {
      perfil: corr.perfil,
      categoria: corr.categoria,
      updatedAt: new Date().toISOString(),
    });
    console.log(`APLICADO: ${corr.id} | ${data.titulo?.substring(0, 50)}... | ${antes.perfil} -> ${corr.perfil} | ${antes.categoria} -> ${corr.categoria}`);
    applied++;
  }

  if (applied > 0) {
    await batch.commit();
    console.log(`\n${applied} documentos actualizados.`);
  } else {
    console.log('\nNingún cambio aplicado.');
  }

  // Invalidar cache de Next para homepage
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.BASE_URL || 'https://informate-nicaragua-final.vercel.app';
    const resp = await fetch(`${baseUrl}/api/cache-purge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('Cache purge status:', resp.status);
  } catch (err) {
    console.log('No se pudo purgar cache:', err.message);
  }

  process.exit(0);
})().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
