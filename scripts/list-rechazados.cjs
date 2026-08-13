const fs = require('fs');
const inv = JSON.parse(fs.readFileSync('FORENSIC_CURRENT_INVENTORY.json', 'utf8'));
const hoy = new Date('2026-08-13T00:00:00.000Z');

function diasDesde(fecha) {
  if (!fecha) return 999;
  const d = new Date(fecha);
  return Math.floor((hoy - d) / (1000 * 60 * 60 * 24));
}

const rechazados = inv.articles.filter(a => a.aprobadoMeni !== true);
console.log(`=== ${rechazados.length} ARTÍCULOS NO APROBADOS ===`);
for (const a of rechazados) {
  const dias = diasDesde(a.fecha);
  console.log(`${a.id} | score=${a.scoreMeni} | pal=${a.contenidoPalabras} | pub=${a.publicado} | arch=${a.archived} | dias=${dias} | ${(a.titulo || '').slice(0, 70)}`);
}
