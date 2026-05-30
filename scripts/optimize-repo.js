const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG_DIR = path.resolve(__dirname, '../../informate-images/images');

async function optimize() {
  const files = fs.readdirSync(IMG_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp|gif|bmp|tiff)$/i.test(f));

  console.log(`Optimizando ${files.length} imagenes en informate-images...\n`);

  let before = 0, after = 0, ok = 0, fail = 0;

  for (const file of files) {
    const input = path.join(IMG_DIR, file);
    const base = path.basename(file, path.extname(file));
    const output = path.join(IMG_DIR, `${base}.webp`);
    const origSize = fs.statSync(input).size;
    before += origSize;

    try {
      const meta = await sharp(input).metadata();
      const isLogo = /logo|icon|favicon/i.test(file);
      const isBig = (meta.width || 0) > 700;
      const preset = isLogo ? { w:128, h:128, q:80 } : (isBig ? { w:800, h:450, q:75 } : { w:400, h:225, q:70 });

      // Si ya es WebP pequena, saltar
      if (file.endsWith('.webp') && origSize < 50000 && meta.width && meta.width <= 800) {
        after += origSize; ok++; console.log(`SKIP: ${file} (ya optima)`); continue;
      }

      await sharp(input)
        .resize(preset.w, preset.h, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: preset.q, effort: 4 })
        .toFile(output + '.tmp');

      const newSize = fs.statSync(output + '.tmp').size;

      // Borrar original si no es webp, o reemplazar si es webp grande
      if (!file.endsWith('.webp') || origSize > newSize * 1.1) {
        fs.unlinkSync(input);
        fs.renameSync(output + '.tmp', output);
      } else {
        fs.unlinkSync(output + '.tmp');
        after += origSize;
        ok++; console.log(`SKIP: ${file} (original mas chica)`); continue;
      }

      after += newSize;
      ok++;
      const saved = ((1 - newSize / origSize) * 100).toFixed(1);
      console.log(`OK: ${base}.webp -> ${saved}% menos (${(origSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB)`);
    } catch (err) {
      fail++;
      after += origSize;
      console.error(`FAIL: ${file}: ${err.message}`);
      if (fs.existsSync(output + '.tmp')) fs.unlinkSync(output + '.tmp');
    }
  }

  console.log(`\n--- RESUMEN ---`);
  console.log(`OK: ${ok} | FAIL: ${fail} | Total: ${files.length}`);
  console.log(`Antes: ${(before/1024/1024).toFixed(2)} MB`);
  console.log(`Despues: ${(after/1024/1024).toFixed(2)} MB`);
  console.log(`Ahorro: ${((1-after/before)*100).toFixed(1)}%`);
}

optimize();
