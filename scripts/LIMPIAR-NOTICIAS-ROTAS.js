/**
 * SCRIPT: Limpieza de noticias con imágenes rotas/corruptas
 * Ejecutar: node LIMPIAR-NOTICIAS-ROTAS.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ ERROR: No se encontró serviceAccountKey.json');
    console.log('📋 Ve a Firebase Console → Configuración → Cuentas de servicio → Generar clave privada');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function limpiarNoticiasRotas() {
    console.log("🚀 Iniciando limpieza de noticias sin imagen válida...\n");
    
    const noticiasRef = db.collection('noticias');
    
    try {
        const snapshot = await noticiasRef.get();
        let eliminadas = 0;
        let revisadas = 0;
        const aEliminar = [];

        // Primero identificar todas las noticias a eliminar
        snapshot.forEach((doc) => {
            const data = doc.data();
            const imagen = data.imagen || data.image || "";
            const titulo = data.titulo || data.title || "Sin título";
            
            revisadas++;

            // CRITERIOS DE ELIMINACIÓN:
            // 1. Nombres que contienen "collage_normal" (no existen en GitHub)
            // 2. Nombres que terminan en la extensión doble error "_jpg.jpeg"
            // 3. Noticias sin nombre de imagen o con "NaN"
            const debeEliminar = 
                imagen.includes('collage_normal') || 
                imagen.includes('_jpg.jpeg') || 
                imagen === "" || 
                imagen === "NaN" ||
                imagen === "null" ||
                imagen === "undefined";
            
            if (debeEliminar) {
                aEliminar.push({
                    id: doc.id,
                    titulo: titulo,
                    imagen: imagen || "(vacía)"
                });
            }
        });

        console.log(`📊 Revisadas: ${revisadas} noticias`);
        console.log(`❌ A eliminar: ${aEliminar.length} noticias\n`);

        if (aEliminar.length === 0) {
            console.log("✅ No hay noticias corruptas para eliminar.");
            process.exit(0);
        }

        // Mostrar las que se van a eliminar
        aEliminar.forEach((n, i) => {
            console.log(`${i + 1}. ${n.titulo.substring(0, 50)}...`);
            console.log(`   ID: ${n.id}`);
            console.log(`   Imagen: ${n.imagen}\n`);
        });

        console.log("⏳ Eliminando en 5 segundos... (Presiona Ctrl+C para cancelar)\n");
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Eliminar una por una
        for (const noticia of aEliminar) {
            try {
                await noticiasRef.doc(noticia.id).delete();
                console.log(`✅ Eliminada: ${noticia.titulo.substring(0, 40)}...`);
                eliminadas++;
            } catch (err) {
                console.error(`❌ Error eliminando ${noticia.id}:`, err.message);
            }
        }

        console.log(`\n========================================`);
        console.log(`🎯 RESULTADO:`);
        console.log(`   ✅ Noticias eliminadas: ${eliminadas}`);
        console.log(`   📊 Total revisadas: ${revisadas}`);
        console.log(`========================================`);
        
        process.exit(0);

    } catch (error) {
        console.error("💥 Error fatal:", error);
        process.exit(1);
    }
}

// Ejecutar
limpiarNoticiasRotas();
