// Script para limpiar imágenes 'NaN' en Firestore
// Ejecutar: node scripts/limpiar-imagenes-nan.js

const admin = require('firebase-admin');

// Leer service account de variable de entorno o archivo
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require('../serviceAccountKey.json');
  }
} catch (e) {
  console.error('❌ No se encontró serviceAccountKey.json');
  console.log('Opciones:');
  console.log('1. Coloca serviceAccountKey.json en la raíz del proyecto');
  console.log('2. O define FIREBASE_SERVICE_ACCOUNT como variable de entorno');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function limpiarImagenesNaN() {
  console.log('🔍 Buscando noticias con imágenes inválidas...\n');
  
  const snapshot = await db.collection('noticias').get();
  const batch = db.batch();
  let contador = 0;
  const problemas = [];
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const imagen = data.imagen || data.image;
    const titulo = data.titulo || data.title || '(sin título)';
    
    // Detectar valores inválidos
    if (!imagen || imagen === 'NaN' || imagen === 'null' || 
        imagen === 'undefined' || imagen === '' || 
        imagen.startsWith('data:')) {
      
      problemas.push({
        id: doc.id,
        titulo: titulo.substring(0, 50),
        imagen_actual: imagen ? `"${imagen.substring(0, 30)}..."` : 'null/undefined'
      });
      
      // Asignar placeholder por categoría
      const categoria = data.categoria || data.category || 'general';
      const placeholders = {
        'sucesos': 'placeholder_sucesos.webp',
        'politica': 'placeholder_politica.webp',
        'economia': 'placeholder_economia.webp',
        'deportes': 'placeholder_deportes.webp',
        'cultura': 'placeholder_cultura.webp',
        'tecnologia': 'placeholder_tecnologia.webp',
        'nacionales': 'placeholder_nacionales.webp',
        'internacionales': 'placeholder_internacionales.webp',
        'general': 'placeholder_general.webp'
      };
      const placeholder = placeholders[categoria] || placeholders.general;
      
      console.log(`🧹 ${doc.id}: "${titulo.substring(0, 40)}..." → ${placeholder}`);
      
      batch.update(doc.ref, { 
        imagen: placeholder,
        imagen_corregida: true,
        fecha_correccion: new Date().toISOString()
      });
      contador++;
    }
  });
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Total noticias: ${snapshot.size}`);
  console.log(`   Con imágenes inválidas: ${contador}`);
  
  if (contador > 0) {
    console.log(`\n💾 Guardando cambios...`);
    await batch.commit();
    console.log(`✅ ${contador} noticias corregidas con placeholders`);
    console.log(`\n⚠️  IMPORTANTE: Sube las imágenes reales a GitHub y luego`);
    console.log(`    actualiza manualmente las noticias importantes.`);
  } else {
    console.log('✅ No hay noticias con imágenes inválidas');
  }
  
  process.exit(0);
}

limpiarImagenesNaN().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
