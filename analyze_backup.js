const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, 'firestore-current-backup-1781106719360.json');
const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

const needsContent = []; // Artículos con placeholders
const hasContent = [];   // Artículos con contenido real (referencias)

for (const [id, fields] of Object.entries(data)) {
  const contenido = fields.contenido || '';
  const hasPlaceholder = contenido.includes('Lead de 40 palabras') || contenido.includes('Contenido ORO genérico');
  
  const article = {
    id,
    titulo: fields.titulo || '',
    categoria: fields.categoria || '',
    autor: fields.autor || '',
    fecha: fields.fechaPublicacion ? new Date(fields.fechaPublicacion._seconds * 1000).toISOString() : (fields.fecha || ''),
    imagen: fields.imagen || '',
    resumen: fields.resumen || '',
  };
  
  if (hasPlaceholder || contenido.length < 200) {
    needsContent.push(article);
  } else {
    hasContent.push({...article, contenido, contenidoHtml: fields.contenidoHtml || ''});
  }
}

console.log('=== ARTÍCULOS CON CONTENIDO (REFERENCIAS) ===');
console.log(`Total: ${hasContent.length}`);
hasContent.forEach(a => console.log(`- ${a.id}: ${a.titulo.substring(0, 80)}...`));

console.log('\n=== ARTÍCULOS QUE NECESITAN CONTENIDO ===');
console.log(`Total: ${needsContent.length}`);
needsContent.forEach(a => console.log(`- ${a.id}: ${a.titulo.substring(0, 80)}... [${a.categoria}]`));

// Save to files
fs.writeFileSync(path.join(__dirname, 'needs-content.json'), JSON.stringify(needsContent, null, 2), 'utf-8');
fs.writeFileSync(path.join(__dirname, 'has-content.json'), JSON.stringify(hasContent, null, 2), 'utf-8');
console.log('\nArchivos guardados: needs-content.json y has-content.json');
