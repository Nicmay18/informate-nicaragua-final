const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.resolve(__dirname, '../../informate-images/images');
const TEMP_DIR = path.resolve(__dirname, '../../informate-images/images-temp');

async function optimize() {
  let sharp;
  try { sharp = require('sharp'); } catch {
    console.error('npm install sharp --save-dev'); process.exit(1);
  }

  if (!fs.existsSync(INPUT_DIR)) { console.error('No existe:', INPUT_DIR); process.exit(1); }

  // Limpiar temp anterior
  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const files = fs.readdirSync(INPUT_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp|gif|bmp|tiff)$/i.test(f));

  console.log(`Optimizando ${files.length} imagenes...\n`);

  let before = 0, after = 0, ok = 0, skip = 0, fail = 0;

  for (const file of files) {
    const input = path.join(INPUT_DIR, file);
    const base = path.basename(file, path.extname(file));
    const output = path.join(TEMP_DIR, `${base}.webp`);
    const origSize = fs.statSync(input).size;
    before += origSize;

    try {
      const meta = await sharp(input).metadata();
      const isLogo = /logo|icon|favicon/i.test(file);
      const isBig = (meta.width || 0) > 700;
      const preset = isLogo ? { w:128, h:128, q:80 } : (isBig ? { w:800, h:450, q:75 } : { w:400, h:225, q:70 });

      // Si ya es WebP pequena y optima, copiar tal cual
      if (file.endsWith('.webp') && origSize < 50000 && meta.width && meta.width <= 800) {
        fs.copyFileSync(input, output);
        after += origSize; skip++;
        continue;
      }

      await sharp(input)
        .resize(preset.w, preset.h, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: preset.q, effort: 4 })
        .toFile(output);

      const newSize = fs.statSync(output).size;
      after += newSize;
      ok++;
      const saved = ((1 - newSize / origSize) * 100).toFixed(1);
      console.log(`${base}.webp -> ${saved}% menos`);
    } catch (err) {
      // Fallback: copiar original tal cual
      fs.copyFileSync(input, path.join(TEMP_DIR, file));
      after += origSize;
      fail++;
      console.error(`FAIL: ${file}: ${err.message}`);
    }
  }

  console.log(`\n--- RESUMEN ---`);
  console.log(`OK: ${ok} | SKIP: ${skip} | FAIL: ${fail} | Total: ${files.length}`);
  console.log(`Antes: ${(before/1024/1024).toFixed(2)} MB`);
  console.log(`Despues: ${(after/1024/1024).toFixed(2)} MB`);
  console.log(`Ahorro: ${((1-after/before)*100).toFixed(1)}%`);
  console.log(`\nAhora ejecuta:`);
  console.log(`  cd ..\\informate-images`);
  console.log(`  rmdir /s /q images`);
  console.log(`  ren images-temp images`);
  console.log(`  git add -A && git commit -m "optimize: images to WebP" && git push`);
}

optimize();
