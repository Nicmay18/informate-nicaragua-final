// Script para actualizar el contador de palabras en TODAS las noticias existentes
const admin = require('firebase-admin');
const serviceAccount = require('./informate-instant-nicaragua-firebase-adminsdk-fbsvc-348106c210.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Función para contar palabras reales (ignorando HTML)
function contarPalabrasReales(texto) {
  if (!texto) return 0;
  // Usar la misma fórmula que en el admin
  return texto.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
}

async function actualizarContadorTodasNoticias() {
  try {
    console.log('🔄 Obteniendo todas las noticias...');
    const snapshot = await db.collection('noticias').get();
    
    const batch = db.batch();
    let actualizadas = 0;
    let errores = 0;
    let totalPalabras = 0;
    
    snapshot.forEach((docSnapshot) => {
      const noticiaData = docSnapshot.data();
      const noticiaRef = db.collection('noticias').doc(docSnapshot.id);
      
      try {
        // Contar palabras reales del contenido
        const palabrasReales = contarPalabrasReales(noticiaData.contenido);
        totalPalabras += palabrasReales;
        
        // Actualizar con el contador correcto
        batch.update(noticiaRef, {
          palabras: palabrasReales,
          actualizado: admin.firestore.FieldValue.serverTimestamp()
        });
        
        actualizadas++;
        console.log(`✅ ${noticiaData.titulo?.substring(0, 50)}... - ${palabrasReales} palabras reales`);
        
      } catch (error) {
        errores++;
        console.error(`❌ Error en ${docSnapshot.id}:`, error);
      }
    });
    
    if (actualizadas > 0) {
      console.log(`📝 Ejecutando actualización de ${actualizadas} noticias...`);
      await batch.commit();
      console.log(`✅ ¡Éxito! ${actualizadas} noticias actualizadas con contador de palabras real`);
      console.log(`📊 Total de palabras en todas las noticias: ${totalPalabras.toLocaleString()}`);
      console.log(`❌ Errores: ${errores}`);
      
      // Estadísticas
      const promedio = Math.round(totalPalabras / actualizadas);
      console.log(`📈 Promedio de palabras por noticia: ${promedio}`);
      
    } else {
      console.log('ℹ️ No se encontraron noticias para actualizar');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
actualizarContadorTodasNoticias().then(() => {
  console.log('🏁 Proceso completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
