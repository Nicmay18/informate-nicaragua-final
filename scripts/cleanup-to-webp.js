const fs = require('fs');
const path = require('path');

const imagesDir = path.join(process.cwd(), 'public', 'images');

function getFiles() {
  return fs.readdirSync(imagesDir).filter(f => {
    const stat = fs.statSync(path.join(imagesDir, f));
    return stat.isFile();
  }).map(f => ({
    name: f,
    size: fs.statSync(path.join(imagesDir, f)).size,
    ext: path.extname(f).toLowerCase(),
    base: path.basename(f, path.extname(f)),
  }));
}

// Mantener: eliminar solo si hay un .webp con el mismo nombre base EXACTO
function findSafeToRemove(files) {
  const toRemove = [];
  
  // Agrupar por nombre base exacto (sin extensión)
  const byBase = {};
  files.forEach(f => {
    if (!byBase[f.base]) byBase[f.base] = [];
    byBase[f.base].push(f);
  });

  Object.entries(byBase).forEach(([base, group]) => {
    const hasWebp = group.some(f => f.ext === '.webp');
    if (hasWebp) {
      // Eliminar todos los no-webp del mismo nombre base
      group.filter(f => f.ext !== '.webp').forEach(f => toRemove.push(f));
    }
  });

  return toRemove;
}

// Archivos vacíos
function findEmpty(files) {
  return files.filter(f => f.size === 0);
}

const files = getFiles();
console.log(`📁 Total imágenes: ${files.length}\n`);

const safeRemove = findSafeToRemove(files);
const emptyFiles = findEmpty(files);

// Duplicados webp por tamaño (misma imagen, distinto timestamp)
const webpFiles = files.filter(f => f.ext === '.webp');
const sizeGroups = {};
webpFiles.forEach(f => {
  if (!sizeGroups[f.size]) sizeGroups[f.size] = [];
  sizeGroups[f.size].push(f);
});

const webpDuplicates = Object.values(sizeGroups).filter(g => g.length > 1);

console.log('=== ARCHIVOS NO-WEBP A ELIMINAR (mismo nombre base) ===\n');
if (safeRemove.length > 0) {
  safeRemove.forEach(f => console.log(`❌ ${f.name} (${f.size} bytes)`));
  console.log(`\nTotal: ${safeRemove.length} archivos\n`);
} else {
  console.log('Ninguno\n');
}

console.log('=== ARCHIVOS VACÍOS (0 bytes) ===\n');
if (emptyFiles.length > 0) {
  emptyFiles.forEach(f => console.log(`❌ ${f.name}`));
  console.log(`\nTotal: ${emptyFiles.length}\n`);
} else {
  console.log('Ninguno\n');
}

console.log('=== POSIBLES DUPLICADOS WEBP (mismo tamaño, distinto nombre) ===\n');
if (webpDuplicates.length > 0) {
  webpDuplicates.forEach(group => {
    console.log(`⚠️  Mismo tamaño (${group[0].size} bytes):`);
    group.forEach(f => console.log(`   ${f.name}`));
    console.log('');
  });
  console.log(`Total grupos: ${webpDuplicates.length}\n`);
} else {
  console.log('Ninguno\n');
}

// Ejecutar eliminación segura
console.log('🗑️ Ejecutando limpieza...\n');
let removed = 0;
let freed = 0;

[...safeRemove, ...emptyFiles].forEach(f => {
  try {
    fs.unlinkSync(path.join(imagesDir, f.name));
    console.log(`✅ Eliminado: ${f.name}`);
    removed++;
    freed += f.size;
  } catch (err) {
    console.log(`❌ Error eliminando ${f.name}: ${err.message}`);
  }
});

console.log(`\n📊 Resumen:`);
console.log(`   Archivos eliminados: ${removed}`);
console.log(`   Espacio liberado: ${(freed / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Imágenes restantes: ${files.length - removed}`);
