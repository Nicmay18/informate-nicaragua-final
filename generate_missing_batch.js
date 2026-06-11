const fs = require('fs');
const path = require('path');

// Paths
const listAllPath = path.join(__dirname, 'list_all.json');
const batchPath = path.join(__dirname, 'batch-data.json');

// Load list_all.json (contains total and articles array)
const listAll = JSON.parse(fs.readFileSync(listAllPath, 'utf-8'));
const allArticles = listAll.articles;

// Load existing batch-data.json if it exists, otherwise start empty object
let batchData = {};
if (fs.existsSync(batchPath)) {
  batchData = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
}

// Helper to create placeholder ORO content
function createPlaceholder(article) {
  const lead = `Lead de 40 palabras que incluye nombre, edad, qué ocurrió, cuándo y dónde. ${article.titulo}`;
  const body = `<h2>Lead</h2><p>${lead}</p><h2>Desarrollo</h2><p>Contenido ORO genérico para la noticia. Se mantiene estilo periodístico, sin relleno emocional.</p>`;
  return {
    titulo: article.titulo,
    contenido: body,
    // opcional: puedes añadir más campos si lo deseas
  };
}

let added = 0;
for (const art of allArticles) {
  const id = art.id;
  if (!batchData[id]) {
    batchData[id] = createPlaceholder(art);
    added++;
  }
}

fs.writeFileSync(batchPath, JSON.stringify(batchData, null, 2), 'utf-8');
console.log(`Se añadieron ${added} entradas al batch-data.json (placeholders).`);
