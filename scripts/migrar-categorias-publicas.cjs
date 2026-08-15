/**
 * Migración de Firestore: categorías no públicas -> 6 categorías canónicas.
 * Basado en resolvePublicCategory.
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

const PUBLIC_CATEGORIES = ['Nacionales', 'Sucesos', 'Internacionales', 'Deportes', 'Espectáculos', 'Tecnología'];

const PROFILE_TO_PUBLIC = {
  sucesos: 'Sucesos',
  violencia_genero: 'Sucesos',
  nacionales: 'Nacionales',
  politica: 'Nacionales',
  economia: 'Nacionales',
  salud: 'Nacionales',
  deportes: 'Deportes',
  cultura: 'Nacionales',
  espectaculos: 'Espectáculos',
  tecnologia: 'Tecnología',
  internacional: 'Internacionales',
  educacion: 'Nacionales',
  ambiente: 'Nacionales',
  turismo: 'Nacionales',
  gastronomia: 'Nacionales',
};

function resolve(article) {
  if (article.categoria && PUBLIC_CATEGORIES.includes(article.categoria)) return article.categoria;
  if (article.perfil && PROFILE_TO_PUBLIC[article.perfil]) return PROFILE_TO_PUBLIC[article.perfil];
  const catMap = {
    'Cultura': 'Nacionales',
    'Economía': 'Nacionales',
    'Salud': 'Nacionales',
    'Ambiente': 'Nacionales',
    'Turismo': 'Nacionales',
    'Educación': 'Nacionales',
    'Gastronomía': 'Nacionales',
    'Política': 'Nacionales',
    'General': 'Nacionales',
  };
  if (article.categoria && catMap[article.categoria]) return catMap[article.categoria];
  return 'Nacionales';
}

(async () => {
  const snap = await db.collection('noticias').get();
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const aCorregir = [];
  for (const doc of docs) {
    const correcta = resolve(doc);
    if (doc.categoria !== correcta) {
      aCorregir.push({ id: doc.id, titulo: doc.titulo, de: doc.categoria, a: correcta, perfil: doc.perfil });
    }
  }

  console.log('=== MIGRACIÓN DE CATEGORÍAS ===');
  console.log('Total documentos:', docs.length);
  console.log('Documentos a corregir:', aCorregir.length);

  const porCategoria = {};
  for (const c of aCorregir) {
    const key = `${c.de || 'null'} -> ${c.a}`;
    if (!porCategoria[key]) porCategoria[key] = [];
    porCategoria[key].push(c);
  }

  for (const [k, arr] of Object.entries(porCategoria).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n${k} (${arr.length}):`);
    arr.slice(0, 5).forEach(c => console.log(`  - ${c.id} | "${c.titulo?.substring(0, 50)}..."`));
    if (arr.length > 5) console.log(`  ... y ${arr.length - 5} más`);
  }

  if (aCorregir.length > 0) {
    const batch = db.batch();
    let count = 0;
    for (const c of aCorregir) {
      const ref = db.collection('noticias').doc(c.id);
      batch.update(ref, { categoria: c.a, updatedAt: new Date().toISOString() });
      count++;
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`  ${count} documentos actualizados...`);
      }
    }
    if (count % 500 !== 0) await batch.commit();
    console.log(`\n✓ ${count} documentos migrados a categorías públicas canónicas.`);
  } else {
    console.log('\nNo se requiere migración.');
  }

  // Resumen final
  const snap2 = await db.collection('noticias').get();
  const docs2 = snap2.docs.map(d => ({ categoria: d.data().categoria }));
  const resumen = {};
  for (const d of docs2) resumen[d.categoria] = (resumen[d.categoria] || 0) + 1;
  console.log('\n=== RESUMEN FINAL POR CATEGORÍA ===');
  Object.entries(resumen).sort((a, b) => b[1] - a[1]).forEach(([cat, n]) => console.log(`  ${cat}: ${n}`));

  process.exit(0);
})().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
