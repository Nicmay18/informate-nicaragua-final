const j = JSON.parse(require('fs').readFileSync('FORENSIC_CURRENT_INVENTORY.json', 'utf8'));
const c = {};
const p = {};
for (const a of j.articles) {
  c[a.categoria] = (c[a.categoria] || 0) + 1;
  p[a.perfil] = (p[a.perfil] || 0) + 1;
}
console.log('=== CATEGORÍAS ===');
for (const [k, v] of Object.entries(c).sort((a, b) => b[1] - a[1])) console.log(v, k);
console.log('=== PERFILES ===');
for (const [k, v] of Object.entries(p).sort((a, b) => b[1] - a[1])) console.log(v, k);
