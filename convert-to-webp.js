const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, 'public', 'images');

async function convertToWebP() {
  const files = fs.readdirSync(imagesDir);
  let converted = 0;
  let totalSavings = 0;

  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const ext = path.extname(file).toLowerCase();
    
    // Solo convertir JPEG y PNG a WebP
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

    try {
      const stats = fs.statSync(filePath);
      const originalSize = stats.size;
      const webpPath = filePath.replace(/\.[^.]+$/, '.webp');

      // Si ya existe el WebP, saltar
      if (fs.existsSync(webpPath)) continue;

      await sharp(filePath)
        .webp({ quality: 80 })
        .toFile(webpPath);

      const webpStats = fs.statSync(webpPath);
      const webpSize = webpStats.size;
      const savings = originalSize - webpSize;
      totalSavings += savings;
      converted++;

      console.log(`✓ ${file} → ${path.basename(webpPath)}: ${(originalSize/1024).toFixed(1)}KB → ${(webpSize/1024).toFixed(1)}KB`);
    } catch (err) {
      console.error(`✗ Error converting ${file}:`, err.message);
    }
  }

  console.log(`\n✓ Converted ${converted} images to WebP`);
  console.log(`✓ Total savings: ${(totalSavings/1024/1024).toFixed(2)}MB`);
}

convertToWebP().catch(console.error);
