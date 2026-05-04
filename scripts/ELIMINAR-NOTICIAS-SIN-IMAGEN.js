/**
 * SCRIPT DEFINITIVO: Eliminar noticias sin imágenes válidas
 * Ejecutar: node ELIMINAR-NOTICIAS-SIN-IMAGEN.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ ERROR: No se encontró serviceAccountKey.json');
    console.log('📋 Instrucciones:');
    console.log('   1. Ve a Firebase Console → Configuración del proyecto → Cuentas de servicio');
    console.log('   2. Genera una clave privada');
    console.log('   3. Guarda el archivo como serviceAccountKey.json en la carpeta raíz del proyecto');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function eliminarNoticiasSinImagen() {
    console.log('🔍 Buscando noticias sin imágenes válidas...\n');
    
    const noticiasRef = db.collection('noticias');
    const snapshot = await noticiasRef.get();
    
    let totalNoticias = 0;
    let sinImagen = 0;
    let conImagenValida = 0;
    const aEliminar = [];
    
    snapshot.forEach(doc => {
        totalNoticias++;
        const data = doc.data();
        const id = doc.id;
        
        // Verificar si tiene imagen válida
        const imagen = data.imagen || data.image;
        const tieneImagenValida = imagen && 
                                  imagen !== 'NaN' && 
                                  imagen !== 'null' && 
                                  imagen !== 'undefined' &&
                                  imagen !== '' &&
                                  typeof imagen === 'string';
        
        if (!tieneImagenValida) {
            sinImagen++;
            aEliminar.push({
                id: id,
                titulo: data.titulo || data.title || 'Sin título',
                imagen: imagen || 'NO TIENE'
            });
            console.log(`❌ [${id}] ${(data.titulo || data.title || 'Sin título').substring(0, 50)}...`);
            console.log(`   Imagen: ${imagen || 'NO TIENE'}`);
        } else {
            conImagenValida++;
        }
    });
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`   Total noticias: ${totalNoticias}`);
    console.log(`   ✅ Con imagen válida: ${conImagenValida}`);
    console.log(`   ❌ Sin imagen válida: ${sinImagen}`);
    
    if (sinImagen === 0) {
        console.log('\n✅ No hay noticias para eliminar. Todas tienen imágenes válidas.');
        process.exit(0);
    }
    
    console.log(`\n⚠️  Se eliminarán ${sinImagen} noticias sin imagen.`);
    console.log('⏳ Esperando 5 segundos para confirmar... Presiona Ctrl+C para cancelar.\n');
    
    // Esperar 5 segundos antes de eliminar
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // ELIMINAR
    console.log('🗑️  Eliminando noticias...\n');
    let eliminadas = 0;
    let errores = 0;
    
    for (const noticia of aEliminar) {
        try {
            await noticiasRef.doc(noticia.id).delete();
            console.log(`✅ Eliminada: ${noticia.id}`);
            eliminadas++;
        } catch (error) {
            console.error(`❌ Error eliminando ${noticia.id}:`, error.message);
            errores++;
        }
    }
    
    console.log(`\n🎯 RESULTADO FINAL:`);
    console.log(`   ✅ Noticias eliminadas: ${eliminadas}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📈 Noticias restantes: ${conImagenValida}`);
    
    process.exit(0);
}

eliminarNoticiasSinImagen().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});
