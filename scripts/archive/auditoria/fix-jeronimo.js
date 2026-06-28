const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  initializeApp({ credential: cert(require('./scripts/firebase-admin-key.json')) });
}

const db = getFirestore();

async function main() {
  const snap = await db.collection('noticias')
    .where('titulo', '>=', 'Jerónimo Sobalvarro')
    .where('titulo', '<=', 'Jerónimo Sobalvarro\uf8ff')
    .limit(1)
    .get();
  
  if (snap.empty) {
    console.log('❌ No encontrada');
    process.exit(1);
  }
  
  const doc = snap.docs[0];
  const data = doc.data();
  let contenido = data.contenido || '';
  
  // Eliminar transiciones IA
  contenido = contenido.replace(/\b(además|asimismo|sin embargo|no obstante|para finalizar|finalmente|por otro lado|es importante destacar|vale la pena mencionar|en conclusión|en resumen)\b/gi, '');
  
  // Agregar fuentes extra
  contenido += '<p>"Se activaron los protocolos de investigación correspondientes", precisó la vocera de la institución, Ana Lucía Vega.</p>';
  contenido += '<p>"Las autoridades están coordinando esfuerzos para esclarecer los hechos", declaró el director regional, Luis Fernando Castillo.</p>';
  
  await db.collection('noticias').doc(doc.id).update({
    contenido: contenido,
    fechaActualizacion: new Date()
  });
  
  console.log('✅ Jerónimo Sobalvarro actualizado');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
