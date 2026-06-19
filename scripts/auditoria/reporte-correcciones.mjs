import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('g:/RESPALDO/informate-nicaragua-final/auditoria-noticias.json', 'utf8'));
const peligro = data.filter(n => n.nivel.includes('PELIGRO')).sort((a, b) => a.score - b.score);

let out = 'REPORTE QUIRURGICO: QUE FALTA PARA PASAR A BRONCE\n';
out += 'Necesitan score >= 50. Umbral: 500 palabras, densidad >= 3.0, fuentes > 0, citas > 0\n';
out += '='.repeat(80) + '\n\n';

peligro.forEach((n, i) => {
  const ptsPalabras = n.palabras >= 500 ? 20 : (n.palabras >= 350 ? 10 : 0);
  const ptsFuentes = n.fuentes_atribuidas > 0 ? 15 : 0;
  const ptsCitas = n.citas > 0 ? 15 : 0;

  let falta = 50 - n.score;
  let acciones = [];

  if (n.palabras < 500) {
    const extra = 500 - n.palabras;
    const ptsGanados = ptsPalabras === 10 ? 10 : 20;
    if (ptsGanados >= falta) acciones.push(`AGREGAR ${extra} palabras (contexto historico o datos)`);
    else acciones.push(`AGREGAR ${extra} palabras`);
  }
  if (n.densidad < 3.0) acciones.push(`AGREGAR datos concretos para subir densidad de ${n.densidad} a 3.0`);
  if (n.fuentes_atribuidas === 0) acciones.push('AGREGAR fuente atribuida: "Segun [nombre], [cargo]..." = +15 pts');
  if (n.citas === 0) acciones.push('AGREGAR cita textual entre comillas = +15 pts');
  if (n.transiciones_ia > 0) acciones.push(`ELIMINAR ${n.transiciones_ia} transicion(es) robotica(s)`);

  out += `${i + 1}. [${n.score}/100] ${n.titulo}\n`;
  out += `   Palabras: ${n.palabras} | Densidad: ${n.densidad} | Fuentes: ${n.fuentes_atribuidas} | Citas: ${n.citas}\n`;
  out += `   FALTAN ${falta} puntos. Acciones minimas:\n`;
  acciones.forEach(a => { out += `   -> ${a}\n`; });
  out += '\n';
});

writeFileSync('g:/RESPALDO/informate-nicaragua-final/reporte-correcciones.md', out, 'utf8');
console.log('Reporte generado: reporte-correcciones.md');
console.log(`${peligro.length} noticias en peligro.`);
