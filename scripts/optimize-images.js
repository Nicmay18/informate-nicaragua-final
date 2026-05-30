/**
 * Script de optimización batch de imágenes
 * Optimiza todas las imágenes de public/images/ y las guarda en public/images-optimized/
 *
 * Uso:
 *   node scripts/optimize-images.js
 *
 * Luego mover las optimizadas a public/images/ para reemplazar las originales:
 *   mv public/images-optimized/* public/images/
 */

const fs = require('fs');
const path = require('path');

// Rutas
const INPUT_DIR = path.resolve(__dirname, '../public/images');
const OUTPUT_DIR = path.resolve(__dirname, '../public/images-optimized');

// Configuración por tipo de uso
const PRESETS = {
  hero:    { width: 800,  height: 450, quality: 75, suffix: '' },      // Noticia principal / hero
  card:    { width: 400,  height: 225, quality: 70, suffix: '-card' },  // Tarjetas de noticias
  thumb:   { width: 200,  height: 113, quality: 65, suffix: '-thumb' }, // Thumbnails pequeños
  logo:    { width: 128,  height: 128, quality: 80, suffix: '-logo' },  // Logos / avatares
};

async function optimize() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('❌ sharp no está instalado. Instalalo con:');
    console.error('   npm install sharp --save-dev');
    process.exit(1);
  }

  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ No se encontró el directorio de imágenes: ${INPUT_DIR}`);
    console.error('   Asegurate de clonar el repo de imágenes:');
    console.error('   git clone https://github.com/Nicmay18/informate-images.git ../informate-images');
    process.exit(1);
  }

  // Crear directorio de salida
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Encontrar todas las imágenes
  function findImages(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findImages(fullPath, results);
      } else if (/\.(jpg|jpeg|png|webp|gif|bmp|tiff)$/i.test(entry.name)) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const images = findImages(INPUT_DIR);
  console.log(`📸 Encontradas ${images.length} imágenes para optimizar\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;
  let errors = 0;

  for (const imgPath of images) {
    const relativeDir = path.dirname(path.relative(INPUT_DIR, imgPath));
    const basename = path.basename(imgPath, path.extname(imgPath));
    const outDir = path.join(OUTPUT_DIR, relativeDir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const statsBefore = fs.statSync(imgPath);
    totalBefore += statsBefore.size;

    try {
      // Obtener metadatos para decidir preset
      const metadata = await sharp(imgPath).metadata();
      const isLogo = /logo|avatar|favicon|icon/i.test(imgPath);
      const isLarge = (metadata.width || 0) > 700;
      const preset = isLogo ? PRESETS.logo : (isLarge ? PRESETS.hero : PRESETS.card);

      // Optimizar a WebP
      const outputPath = path.join(outDir, `${basename}${preset.suffix}.webp`);
      await sharp(imgPath)
        .resize(preset.width, preset.height, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: preset.quality, effort: 4 })
        .toFile(outputPath);

      const statsAfter = fs.statSync(outputPath);
      totalAfter += statsAfter.size;

      const saved = ((1 - statsAfter.size / statsBefore.size) * 100).toFixed(1);
      processed++;
      console.log(`✅ ${path.relative(INPUT_DIR, imgPath)} → ${preset.suffix || 'hero'} WebP (${saved}% menos)`);
    } catch (err) {
      errors++;
      console.error(`❌ Error procesando ${imgPath}:`, err.message);
    }
  }

  console.log('\n─────────────────────────────');
  console.log(`📊 Resumen:`);
  console.log(`   Procesadas: ${processed}/${images.length}`);
  console.log(`   Errores:    ${errors}`);
  console.log(`   Tamaño antes:  ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Tamaño después: ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Ahorro total:   ${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%`);
  console.log('\n📁 Imágenes optimizadas en:');
  console.log(`   ${OUTPUT_DIR}`);
  console.log('\n🚀 Siguiente paso: reemplazar originales por optimizadas:');
  console.log('   xcopy /s /y public\\images-optimized\\* public\\images\\');
  console.log('   rmdir /s /q public\\images-optimized');
}

optimize();
