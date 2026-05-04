const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const MAX_WIDTH = 1200;
const TARGET_SIZE = 150 * 1024; // 150KB en bytes
const MIN_QUALITY = 60; // Calidad mínima aceptable
const MAX_QUALITY = 85; // Calidad máxima inicial

async function compressToTarget(inputPath, outputPath, targetSize) {
    let quality = MAX_QUALITY;
    let currentSize = Infinity;
    let attempts = 0;
    const maxAttempts = 10;

    while (currentSize > targetSize && quality >= MIN_QUALITY && attempts < maxAttempts) {
        try {
            const image = sharp(inputPath);
            const metadata = await image.metadata();

            // Redimensionar si es necesario
            let pipeline = image;
            if (metadata.width > MAX_WIDTH) {
                pipeline = pipeline.resize(MAX_WIDTH, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                });
            }

            // Comprimir a WebP
            await pipeline
                .webp({ quality, effort: 6 })
                .toFile(outputPath + '.tmp');

            const stats = fs.statSync(outputPath + '.tmp');
            currentSize = stats.size;

            if (currentSize <= targetSize) {
                // Éxito - renombrar archivo temporal
                fs.renameSync(outputPath + '.tmp', outputPath);
                return { success: true, quality, size: currentSize };
            }

            // Reducir calidad para siguiente intento
            quality -= 5;
            attempts++;

            // Limpiar archivo temporal
            if (fs.existsSync(outputPath + '.tmp')) {
                fs.unlinkSync(outputPath + '.tmp');
            }

        } catch (error) {
            if (fs.existsSync(outputPath + '.tmp')) {
                fs.unlinkSync(outputPath + '.tmp');
            }
            throw error;
        }
    }

    // Si no se pudo alcanzar el objetivo, usar la última versión
    if (fs.existsSync(outputPath + '.tmp')) {
        fs.renameSync(outputPath + '.tmp', outputPath);
    }

    return { success: false, quality, size: currentSize };
}

async function optimizeImage(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();
        
        // Solo procesar imágenes
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            return null;
        }

        const stats = fs.statSync(filePath);
        const originalSize = stats.size;

        // Si ya es menor a 150KB, saltar
        if (originalSize <= TARGET_SIZE) {
            console.log(`✅ ${path.basename(filePath)} ya está optimizada (${(originalSize / 1024).toFixed(0)}KB)`);
            return { skipped: true, originalSize };
        }

        const outputPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        
        console.log(`🔄 Procesando ${path.basename(filePath)} (${(originalSize / 1024).toFixed(0)}KB)...`);

        const result = await compressToTarget(filePath, outputPath, TARGET_SIZE);

        if (result.success) {
            // Eliminar original si no es WebP
            if (ext !== '.webp' && filePath !== outputPath) {
                fs.unlinkSync(filePath);
            }

            const savings = ((originalSize - result.size) / originalSize * 100).toFixed(1);
            console.log(`   ✅ ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB (${savings}% reducción, calidad ${result.quality}%)`);
            
            return {
                success: true,
                originalSize,
                newSize: result.size,
                savings: originalSize - result.size
            };
        } else {
            console.log(`   ⚠️  No se pudo reducir a 150KB (quedó en ${(result.size / 1024).toFixed(0)}KB con calidad ${result.quality}%)`);
            
            // Eliminar original si no es WebP
            if (ext !== '.webp' && filePath !== outputPath) {
                fs.unlinkSync(filePath);
            }
            
            return {
                success: false,
                originalSize,
                newSize: result.size,
                savings: originalSize - result.size
            };
        }

    } catch (error) {
        console.error(`❌ Error procesando ${path.basename(filePath)}:`, error.message);
        return null;
    }
}

async function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    let totalOriginal = 0;
    let totalOptimized = 0;
    let processedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            const subResult = await processDirectory(filePath);
            totalOriginal += subResult.totalOriginal;
            totalOptimized += subResult.totalOptimized;
            processedCount += subResult.processedCount;
            skippedCount += subResult.skippedCount;
            failedCount += subResult.failedCount;
        } else {
            const result = await optimizeImage(filePath);
            if (result) {
                if (result.skipped) {
                    skippedCount++;
                } else {
                    totalOriginal += result.originalSize;
                    totalOptimized += result.newSize;
                    processedCount++;
                    if (!result.success) {
                        failedCount++;
                    }
                }
            }
        }
    }

    return { totalOriginal, totalOptimized, processedCount, skippedCount, failedCount };
}

console.log('🚀 Compresión Agresiva de Imágenes a 150KB\n');
console.log('═'.repeat(60));
console.log(`📁 Directorio: ${IMAGES_DIR}`);
console.log(`📏 Ancho máximo: ${MAX_WIDTH}px`);
console.log(`🎯 Tamaño objetivo: 150KB`);
console.log(`🎨 Rango de calidad: ${MIN_QUALITY}% - ${MAX_QUALITY}%\n`);

if (!fs.existsSync(IMAGES_DIR)) {
    console.log('❌ No se encontró el directorio de imágenes');
    process.exit(1);
}

// Hacer backup antes de procesar
console.log('💾 Recomendación: Haz backup de tus imágenes antes de continuar');
console.log('   Presiona Ctrl+C para cancelar o espera 5 segundos...\n');

setTimeout(async () => {
    const startTime = Date.now();
    
    const result = await processDirectory(IMAGES_DIR);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 Resumen Final:');
    console.log(`   ✅ Procesadas: ${result.processedCount}`);
    console.log(`   ⏭️  Saltadas (ya optimizadas): ${result.skippedCount}`);
    console.log(`   ⚠️  No alcanzaron 150KB: ${result.failedCount}`);
    console.log(`   💾 Tamaño original total: ${(result.totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   💾 Tamaño final total: ${(result.totalOptimized / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📉 Ahorro total: ${((result.totalOriginal - result.totalOptimized) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   ⏱️  Tiempo: ${duration}s`);
    
    console.log('\n✨ Optimización completada!');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Verifica las imágenes en tu sitio');
    console.log('   2. Prueba en PageSpeed Insights');
    console.log('   3. Si todo está bien, haz commit y push');
    console.log('   4. Para nuevas imágenes, usa este script antes de subir');
    
}, 5000);
