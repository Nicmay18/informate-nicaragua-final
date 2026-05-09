// Script para aplicar formato profesional a TODAS las noticias existentes
const admin = require('firebase-admin');
const serviceAccount = require('./informate-instant-nicaragua-firebase-adminsdk-fbsvc-348106c210.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Función para formatear texto profesionalmente
function formatearTextoProfesional(texto) {
  if (!texto) return texto;
  
  // Limpiar texto primero
  texto = texto.trim();
  
  // Separar párrafos (dobles saltos de línea = nuevo párrafo)
  let parrafos = texto.split(/\n\s*\n/);
  let resultado = '';
  
  parrafos.forEach(parrafo => {
    if (parrafo.trim()) {
      // Negritas para nombres propios (inician con mayúscula)
      parrafo = parrafo.replace(/\\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\\b/g, '<b>$&</b>');
      
      // Negritas para términos clave
      const palabrasClave = ['falleció', 'murió', 'herido', 'accidente', 'incidente', 'autoridades', 'policía', 'tragedia', 'víctima', 'conductor', 'homicidio imprudente', 'omisión de auxilio'];
      palabrasClave.forEach(palabra => {
        const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
        parrafo = parrafo.replace(regex, `<b>${palabra}</b>`);
      });
      
      // Negritas para lugares específicos
      const lugares = ['Rosita', 'Nuevo Amanecer', 'Caribe Norte', 'Región Autónoma'];
      lugares.forEach(lugar => {
        const regex = new RegExp(`\\b${lugar}\\b`, 'g');
        parrafo = parrafo.replace(regex, `<b>${lugar}</b>`);
      });
      
      resultado += `<p>${parrafo.trim()}</p>\n\n`;
    }
  });
  
  return resultado;
}

async function actualizarTodasLasNoticias() {
  try {
    console.log('🔄 Obteniendo todas las noticias...');
    const snapshot = await db.collection('noticias').get();
    
    const batch = db.batch();
    let actualizadas = 0;
    let errores = 0;
    
    snapshot.forEach((docSnapshot) => {
      const noticiaData = docSnapshot.data();
      const noticiaRef = db.collection('noticias').doc(docSnapshot.id);
      
      try {
        // Solo actualizar si el contenido no tiene formato HTML
        if (noticiaData.contenido && !noticiaData.contenido.includes('<p>')) {
          const contenidoFormateado = formatearTextoProfesional(noticiaData.contenido);
          
          // Actualizar con contenido formateado
          batch.update(noticiaRef, {
            contenido: contenidoFormateado,
            actualizado: admin.firestore.FieldValue.serverTimestamp()
          });
          
          actualizadas++;
          console.log(`✅ Actualizando: ${noticiaData.titulo?.substring(0, 50)}...`);
        }
      } catch (error) {
        errores++;
        console.error(`❌ Error en ${docSnapshot.id}:`, error);
      }
    });
    
    if (actualizadas > 0) {
      console.log(`📝 Ejecutando actualización de ${actualizadas} noticias...`);
      await batch.commit();
      console.log(`✅ ¡Éxito! ${actualizadas} noticias actualizadas con formato profesional`);
      console.log(`❌ Errores: ${errores}`);
    } else {
      console.log('ℹ️ No se encontraron noticias para actualizar (ya tenían formato HTML)');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
actualizarTodasLasNoticias().then(() => {
  console.log('🏁 Proceso completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
