import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('./backup-noticias-2026-06-14.json', 'utf8'));

const n = data.find(x => (x.titulo || '').toLowerCase().includes('cinco fallecidos') && (x.titulo || '').toLowerCase().includes('accidentes viales'));
if (!n) {
  console.log('No encontrada');
  process.exit(1);
}

console.log('Título:', n.titulo);
console.log('Slug:', n.slug);
console.log('ID:', n.id);

// Exactamente los 8 criterios del script de diagnóstico
const texto = n.contenido || '';
const palabras = texto.trim().split(/\s+/).filter(w => w.length > 0).length;
const parrafos = texto.split(/\n+/).filter(p => p.trim().length > 20);
const lead = parrafos[0] || '';
const palabrasLead = lead.trim().split(/\s+/).filter(w => w.length > 0).length;
const tieneH2 = /<h2[^>]*>/i.test(texto);
const tieneStrong = /<strong>/i.test(texto) || /<b>/i.test(texto);
const tieneDatos = /\d/.test(texto);
const citas = (texto.match(/["\u201c][^"\u201d]{8,}["\u201d]/g) || []).length;
const atribuciones = /inform[oó]|confirm[oó]|declar[oó]|precis[oó]|señal[oó]|indic[oó]|dijo|explic[oó]|manifest[oó]|afirm[oó]|agreg[oó]|asegur[oó]|destac[oó]|mencion[oó]|aclar[oó]|coment[oó]|expres[oó]|anunc[ió]|revel[oó]/i.test(texto);
const blockquotes = (texto.match(/<blockquote>/g) || []).length;
const passCitas = citas >= 1 || atribuciones || blockquotes >= 1;
const tituloOK = (n.titulo || '').length >= 50 && (n.titulo || '').length <= 70;
const metaOK = (n.resumen || '').length >= 150 && (n.resumen || '').length <= 170;
const tieneImagen = n.imagenDestacada && n.imagenDestacada.length > 5;

console.log('\n--- Diagnóstico local ---');
console.log('Palabras:', palabras);
console.log('Lead palabras:', palabrasLead);
console.log('H2:', tieneH2);
console.log('Strong:', tieneStrong, '| Datos:', tieneDatos);
console.log('Citas:', citas, '| Atribuciones:', atribuciones, '| Blockquotes:', blockquotes, '| PassCitas:', passCitas);
console.log('Título len:', (n.titulo || '').length, '| OK:', tituloOK);
console.log('Meta len:', (n.resumen || '').length, '| OK:', metaOK);
console.log('Imagen:', tieneImagen);

const c1 = palabras >= 500;
const c2 = palabrasLead >= 35;
const c3 = tieneH2;
const c4 = tieneStrong || tieneDatos;
const c5 = passCitas;
const c6 = tituloOK;
const c7 = metaOK;
const c8 = tieneImagen;

const aprobados = [c1, c2, c3, c4, c5, c6, c7, c8].filter(Boolean).length;
let nivel;
if (aprobados >= 7) nivel = 'ORO';
else if (aprobados >= 5) nivel = 'PLATA';
else nivel = 'BRONCE';

console.log('\nAprobados:', aprobados, '/8');
console.log('Nivel local:', nivel);

if (nivel === 'BRONCE') {
  console.log('\nFALLAN:');
  if (!c1) console.log('  - contenido (palabras:', palabras, ')');
  if (!c2) console.log('  - lead (', palabrasLead, ' palabras)');
  if (!c3) console.log('  - h2');
  if (!c4) console.log('  - strong/datos');
  if (!c5) console.log('  - citas/atribucion');
  if (!c6) console.log('  - titulo (', (n.titulo || '').length, ' chars)');
  if (!c7) console.log('  - meta (', (n.resumen || '').length, ' chars)');
  if (!c8) console.log('  - imagen');
}

process.exit(0);
