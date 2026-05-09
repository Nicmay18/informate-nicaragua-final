const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, 'public', 'images');

async function optimizeImages() {
  const files = fs.readdirSync(imagesDir);
  let optimized = 0;
  let totalSavings = 0;

  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const ext = path.extname(file).toLowerCase();
    
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;

    try {
      const stats = fs.statSync(filePath);
      const originalSize = stats.size;

      if (ext === '.webp') {
        await sharp(filePath)
          .webp({ quality: 75 })
          .toFile(filePath + '.tmp');
      } else if (ext === '.png') {
        await sharp(filePath)
          .png({ compressionLevel: 9 })
          .toFile(filePath + '.tmp');
      } else {
        await sharp(filePath)
          .jpeg({ quality: 75, progressive: true })
          .toFile(filePath + '.tmp');
      }

      const newStats = fs.statSync(filePath + '.tmp');
      const newSize = newStats.size;

      if (newSize < originalSize) {
        fs.renameSync(filePath + '.tmp', filePath);
        const savings = originalSize - newSize;
        totalSavings += savings;
        optimized++;
        console.log(`✓ ${file}: ${(originalSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB`);
      } else {
        fs.unlinkSync(filePath + '.tmp');
      }
    } catch (err) {
      console.error(`✗ Error optimizing ${file}:`, err.message);
      if (fs.existsSync(filePath + '.tmp')) fs.unlinkSync(filePath + '.tmp');
    }
  }

  console.log(`\n✓ Optimized ${optimized} images`);
  console.log(`✓ Total savings: ${(totalSavings/1024/1024).toFixed(2)}MB`);
}

optimizeImages().catch(console.error);
