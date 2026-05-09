const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const MAX_WIDTH = 1200; // Ancho máximo para imágenes
const QUALITY = 80; // Calidad de compresión (80 es un buen balance)

async function optimizeImage(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();
        
        // Solo procesar imágenes
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            return;
        }

        const stats = fs.statSync(filePath);
        const originalSize = stats.size;

        // Si es menor a 100KB, probablemente ya está optimizada
        if (originalSize < 100 * 1024) {
            console.log(`⏭️  Saltando ${path.basename(filePath)} (ya optimizada)`);
            return;
        }

        const image = sharp(filePath);
        const metadata = await image.metadata();

        // Si la imagen es muy grande, redimensionar
        let pipeline = image;
        if (metadata.width > MAX_WIDTH) {
            pipeline = pipeline.resize(MAX_WIDTH, null, {
                withoutEnlargement: true,
                fit: 'inside'
            });
        }

        // Convertir a WebP con buena calidad
        const outputPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        
        await pipeline
            .webp({ quality: QUALITY, effort: 6 })
            .toFile(outputPath + '.tmp');

        // Verificar que la nueva imagen sea más pequeña
        const newStats = fs.statSync(outputPath + '.tmp');
        const newSize = newStats.size;

        if (newSize < originalSize) {
            // Reemplazar la original
            fs.renameSync(outputPath + '.tmp', outputPath);
            
            // Eliminar la original si no es WebP
            if (ext !== '.webp') {
                fs.unlinkSync(filePath);
            }

            const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
            console.log(`✅ ${path.basename(filePath)} → ${path.basename(outputPath)}`);
            console.log(`   ${(originalSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB (${savings}% reducción)`);
        } else {
            // La nueva es más grande, mantener la original
            fs.unlinkSync(outputPath + '.tmp');
            console.log(`⚠️  ${path.basename(filePath)} no se pudo optimizar más`);
        }

    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
    }
}

async function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    let totalOriginal = 0;
    let totalOptimized = 0;
    let count = 0;

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            await processDirectory(filePath);
        } else {
            await optimizeImage(filePath);
            count++;
        }
    }

    return { totalOriginal, totalOptimized, count };
}

console.log('🚀 Iniciando optimización de imágenes...\n');
console.log(`📁 Directorio: ${IMAGES_DIR}`);
console.log(`📏 Ancho máximo: ${MAX_WIDTH}px`);
console.log(`🎨 Calidad: ${QUALITY}%\n`);

processDirectory(IMAGES_DIR)
    .then(() => {
        console.log('\n✨ Optimización completada!');
        console.log('\n💡 Recomendaciones:');
        console.log('   1. Sube solo imágenes WebP a Firebase Storage');
        console.log('   2. Usa un ancho máximo de 1200px para noticias');
        console.log('   3. Considera usar un CDN como Cloudinary o ImageKit');
    })
    .catch(error => {
        console.error('❌ Error:', error);
    });
