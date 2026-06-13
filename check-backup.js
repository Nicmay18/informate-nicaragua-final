const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('e:/PROYECTO/informate-nicaragua-final/firestore-current-backup-1781106719360.json', 'utf8'));
const noticias = Object.values(raw);
console.log('Total noticias en backup:', noticias.length);
const x = noticias.find(n => n.titulo && n.titulo.includes('Xiloá'));
if (x) {
  console.log('Encontrado:', x.titulo);
  console.log('Contenido original (800 chars):');
  console.log((x.contenido || '').substring(0, 800));
} else {
  console.log('No se encontró noticia de Xiloá. Primeros 5 titulos:');
  noticias.slice(0, 5).forEach(n => console.log(' -', n.titulo));
}
