const data = JSON.parse(require('fs').readFileSync('./reporte-auditoria-completa.json', 'utf8'));
const rechazadas = data.todas.filter(n => n.veredicto.emoji === '🔴');

console.log('=== NOTICIAS RECHAZADAS POR ADSENSE (' + rechazadas.length + ') ===\n');

rechazadas.forEach((n, i) => {
  const num = String(i + 1).padStart(3, '0');
  const cat = n.categoria.padEnd(14, ' ');
  const titulo = n.titulo.substring(0, 70).padEnd(72, ' ');
  const hallazgos = n.adSense.hallazgos.join(', ').substring(0, 40);
  console.log(`${num}. [${cat}] ${titulo} | ${hallazgos}`);
});
