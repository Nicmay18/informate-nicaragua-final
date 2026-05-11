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

function findDuplicates(files) {
  const groups = {};
  files.forEach(f => {
    // Agrupar por nombre base sin timestamp
    let key = f.base;
    // Quitar timestamp numérico al inicio (ej: 1777156411099_MEXICO → MEXICO)
    key = key.replace(/^\d+_/, '');
    // Quitar sufijos de noticia (ej: noticia-mp0c22c1-1778451420241 → noticia-mp0c22c1)
    key = key.replace(/-\d+$/, '');
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  });

  const duplicates = [];
  Object.entries(groups).forEach(([key, group]) => {
    if (group.length > 1) {
      // Ordenar: preferir webp, luego el más grande, luego más reciente
      group.sort((a, b) => {
        if (a.ext === '.webp' && b.ext !== '.webp') return -1;
        if (a.ext !== '.webp' && b.ext === '.webp') return 1;
        return b.size - a.size;
      });
      duplicates.push({
        keep: group[0],
        remove: group.slice(1),
      });
    }
  });

  return duplicates;
}

function findZeroSize(files) {
  return files.filter(f => f.size === 0);
}

const files = getFiles();
console.log(`📁 Total imágenes: ${files.length}\n`);

// Duplicados
const dups = findDuplicates(files);
if (dups.length > 0) {
  console.log('=== DUPLICADOS (mismo nombre, diferentes formatos/versiones) ===\n');
  dups.forEach(({ keep, remove }) => {
    console.log(`✅ MANTENER: ${keep.name} (${keep.size} bytes)`);
    remove.forEach(r => console.log(`   ❌ ELIMINAR: ${r.name} (${r.size} bytes)`));
    console.log('');
  });
  console.log(`Total grupos duplicados: ${dups.length}`);
  console.log(`Archivos a eliminar: ${dups.reduce((sum, d) => sum + d.remove.length, 0)}\n`);
}

// Archivos vacíos
const zeros = findZeroSize(files);
if (zeros.length > 0) {
  console.log('=== ARCHIVOS VACÍOS (0 bytes) ===\n');
  zeros.forEach(z => console.log(`❌ ELIMINAR: ${z.name}`));
  console.log(`Total: ${zeros.length}\n`);
}

// Estadísticas
const exts = {};
files.forEach(f => { exts[f.ext] = (exts[f.ext] || 0) + 1; });
console.log('=== FORMATOS ===');
Object.entries(exts).forEach(([ext, count]) => console.log(`${ext}: ${count}`));

// Ejecutar eliminación (descomentar para ejecutar)
/*
console.log('\n🗑️ Eliminando archivos...');
dups.forEach(({ remove }) => {
  remove.forEach(r => {
    fs.unlinkSync(path.join(imagesDir, r.name));
    console.log(`Eliminado: ${r.name}`);
  });
});
zeros.forEach(z => {
  fs.unlinkSync(path.join(imagesDir, z.name));
  console.log(`Eliminado: ${z.name}`);
});
console.log('✅ Limpieza completada');
*/

console.log('\n💡 Para ejecutar la eliminación, descomenta el bloque de código al final del script.');
