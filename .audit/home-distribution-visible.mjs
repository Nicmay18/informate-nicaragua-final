import fs from 'fs';
const html = fs.readFileSync('.audit/home.html', 'utf8');

// Cuenta las categorías VISIBLES en el HTML renderizado (etiquetas + títulos de sección).
// No cuenta el JSON interno de __NEXT_DATA__.
const cats = {};
const regex = /<span[^>]*>(Nacionales|Sucesos|Deportes|Internacionales|Tecnología|Economía|Espectáculos|GUÍAS ÚTILES)<\/span>/gi;
let m;
while ((m = regex.exec(html)) !== null) {
  const cat = m[1].trim();
  cats[cat] = (cats[cat] || 0) + 1;
}

const total = Object.values(cats).reduce((a, b) => a + b, 0);
const result = {
  total,
  categories: cats,
  percentages: Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, ((v / total) * 100).toFixed(1) + '%'])),
};
fs.writeFileSync('.audit/home-distribution-visible.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
