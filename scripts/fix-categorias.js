/**
 * Script de limpieza masiva de categorías en Firestore
 * Ejecutar UNA VEZ: node scripts/fix-categorias.js
 *
 * Requisitos:
 * 1. Descargar serviceAccountKey.json de Firebase Console → Configuración → Cuentas de servicio
 * 2. Guardar en la raíz del proyecto (al lado de package.json)
 * 3. npm install firebase-admin
 * 4. node scripts/fix-categorias.js
 */

const admin = require('firebase-admin');

const serviceAccount = require('./firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

const db = admin.firestore();

const CATEGORIAS_VALIDAS = {
  // Nacionales
  'nacionales': 'Nacionales',
  'Nacionales': 'Nacionales',
  'NACIONALES': 'Nacionales',
  'Nacionales ': 'Nacionales',
  'nacional': 'Nacionales',
  'Nacional': 'Nacionales',

  // Sucesos
  'sucesos': 'Sucesos',
  'Sucesos': 'Sucesos',
  'SUCESOS': 'Sucesos',
  'Sucesos ': 'Sucesos',
  'suceso': 'Sucesos',
  'Suceso': 'Sucesos',

  // Internacionales
  'internacionales': 'Internacionales',
  'Internacionales': 'Internacionales',
  'INTERNACIONALES': 'Internacionales',
  'Internacionales ': 'Internacionales',
  'internacional': 'Internacionales',
  'Internacional': 'Internacionales',

  // Deportes
  'deportes': 'Deportes',
  'Deportes': 'Deportes',
  'DEPORTES': 'Deportes',
  'Deportes ': 'Deportes',
  'deporte': 'Deportes',
  'Deporte': 'Deportes',

  // Tecnología (con y sin tilde)
  'tecnologia': 'Tecnología',
  'Tecnologia': 'Tecnología',
  'TECNOLOGIA': 'Tecnología',
  'Tecnología': 'Tecnología',
  'Tecnología ': 'Tecnología',
  'Tecnologia ': 'Tecnología',
  'tecnología': 'Tecnología',
  'tecnología ': 'Tecnología',

  // Espectáculos (con y sin tilde)
  'espectaculos': 'Espectáculos',
  'Espectaculos': 'Espectáculos',
  'ESPECTACULOS': 'Espectáculos',
  'Espectáculos': 'Espectáculos',
  'Espectáculos ': 'Espectáculos',
  'Espectaculos ': 'Espectáculos',
  'espectáculos': 'Espectáculos',
  'espectáculos ': 'Espectáculos',
  'Espectaculo': 'Espectáculos',
  'Espectáculo': 'Espectáculos',
};

async function fixCategorias() {
  console.log('📡 Conectando a Firestore...');
  const snapshot = await db.collection('noticias').get();
  console.log(`📄 Total documentos: ${snapshot.size}`);

  let fixed = 0;
  let alreadyOk = 0;
  let unknown = 0;

  const batch = db.batch();
  const unknownCategories = new Set();

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const original = (data.categoria || '').trim();

    if (!original) {
      unknown++;
      unknownCategories.add('(vacío)');
      console.log(`❓ ${doc.id}: Categoría vacía`);
      return;
    }

    if (CATEGORIAS_VALIDAS[original]) {
      const fixedCat = CATEGORIAS_VALIDAS[original];
      if (fixedCat !== data.categoria) {
        batch.update(doc.ref, { categoria: fixedCat });
        fixed++;
        console.log(`🔧 ${doc.id}: "${data.categoria}" → "${fixedCat}"`);
      } else {
        alreadyOk++;
      }
    } else {
      unknown++;
      unknownCategories.add(original);
      console.log(`❓ ${doc.id}: Categoría desconocida: "${original}"`);
    }
  });

  await batch.commit();

  console.log(`\n✅ RESULTADO:`);
  console.log(`   Arregladas:     ${fixed}`);
  console.log(`   Ya correctas:   ${alreadyOk}`);
  console.log(`   Desconocidas:   ${unknown}`);

  if (unknownCategories.size > 0) {
    console.log(`\n⚠️ Categorías desconocidas encontradas:`);
    unknownCategories.forEach(c => console.log(`   - "${c}"`));
    console.log(`\n💡 Si reconocés alguna como válida, agregala al mapa CATEGORIAS_VALIDAS y volvé a correr.`);
  }

  process.exit(0);
}

fixCategorias().catch(err => {
  console.error('💥 Error:', err.message);
  process.exit(1);
});
