const fs = require('fs');
const path = require('path');
const backup = JSON.parse(fs.readFileSync(path.join(__dirname, 'firestore-current-backup-1781106719360.json'), 'utf-8'));
const perdidos = JSON.parse(fs.readFileSync(path.join(__dirname, 'perdidos.json'), 'utf-8'));

function cleanTitle(t) {
  return (t || '').split('\\n\\n##')[0].split('\n\n##')[0].split('\\n')[0].replace(/\\n/g, ' ').trim();
}

const out = perdidos.map(p => {
  const f = backup[p.id];
  return {
    id: p.id,
    titulo: cleanTitle(f.titulo),
    categoria: f.categoria || '',
    departamento: f.departamento || '',
    resumen: f.resumen || '',
    fecha: f.fecha || f.fechaPublicacion || '',
  };
});

fs.writeFileSync(path.join(__dirname, 'perdidos-data.json'), JSON.stringify(out, null, 2), 'utf-8');
console.log('Guardado perdidos-data.json con ' + out.length + ' notas');
