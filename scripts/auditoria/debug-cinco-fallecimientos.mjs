import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('./backup-noticias-2026-06-14.json', 'utf8'));

const n = data.find(x => (x.titulo || '').toLowerCase().includes('cinco fallecimientos'));
if (!n) {
  console.log('No encontrada en backup');
  process.exit(1);
}

console.log('Título en BACKUP:', n.titulo);
console.log('Slug:', n.slug);
console.log('ID:', n.id);
console.log('Resumen:', (n.resumen || '').substring(0, 80));
console.log('Imagen:', n.imagenDestacada ? 'SÍ (' + n.imagenDestacada.substring(0, 50) + '...)' : 'NO');
console.log('');

const texto = n.contenido || '';
const palabras = texto.trim().split(/\s+/).filter(w => w.length > 0).length;
const parrafos = texto.split(/\n+/).filter(p => p.trim().length > 20);
const lead = parrafos[0] || '';
const palabrasLead = lead.trim().split(/\s+/).filter(w => w.length > 0).length;
const tieneH2 = /<h2[^>]*>/i.test(texto);
const tieneStrong = /<strong>/i.test(texto) || /<b>/i.test(texto);
const tieneDatos = /\d/.test(texto);
const tieneCitas = texto.includes('"') && (texto.split('"').length > 2);
const atribuciones = /dijo|indic[oó]|manifest[oó]|declar[oó]|confirm[oó]|precis[oó]|explic[oó]|señal[oó]/i.test(texto);
const blockquotes = /<blockquote>/i.test(texto);
const passCitas = tieneCitas || atribuciones || blockquotes;
const tituloOK = (n.titulo || '').length >= 50 && (n.titulo || '').length <= 70;
const metaOK = (n.resumen || '').length >= 150 && (n.resumen || '').length <= 170;
const tieneImagen = n.imagenDestacada && n.imagenDestacada.length > 5;

console.log('--- 8 CRITERIOS (evaluación local del backup) ---');
console.log('1. Contenido ≥500 palabras:', palabras, palabras >= 500 ? '✅' : '❌');
console.log('2. Lead ≥35 palabras:', palabrasLead, palabrasLead >= 35 ? '✅' : '❌');
console.log('3. H2:', tieneH2 ? '✅' : '❌');
console.log('4. Strong/datos:', (tieneStrong || tieneDatos) ? '✅' : '❌', '(strong=' + tieneStrong + ', datos=' + tieneDatos + ')');
console.log('5. Citas/atribución:', passCitas ? '✅' : '❌', '(citas=' + tieneCitas + ', atrib=' + atribuciones + ', bq=' + blockquotes + ')');
console.log('6. Título 50-70 chars:', (n.titulo || '').length, tituloOK ? '✅' : '❌');
console.log('7. Meta 150-170 chars:', (n.resumen || '').length, metaOK ? '✅' : '❌');
console.log('8. Imagen:', tieneImagen ? '✅' : '❌');

const aprobados = [
  palabras >= 500,
  palabrasLead >= 35,
  tieneH2,
  tieneStrong || tieneDatos,
  passCitas,
  tituloOK,
  metaOK,
  tieneImagen,
].filter(Boolean).length;

let nivel;
if (aprobados >= 7) nivel = 'ORO';
else if (aprobados >= 5) nivel = 'PLATA';
else nivel = 'BRONCE';

console.log('\nResultado:', aprobados, '/8 →', nivel);

if (nivel === 'BRONCE') {
  console.log('\n❌ FALLAN:');
  if (palabras < 500) console.log('   - Contenido:', palabras, 'palabras (necesita 500)');
  if (palabrasLead < 35) console.log('   - Lead:', palabrasLead, 'palabras (necesita 35)');
  if (!tieneH2) console.log('   - Sin H2');
  if (!tieneStrong && !tieneDatos) console.log('   - Sin <strong> ni datos numéricos');
  if (!passCitas) console.log('   - Sin citas ni atribución');
  if (!tituloOK) console.log('   - Título:', (n.titulo || '').length, 'chars (necesita 50-70)');
  if (!metaOK) console.log('   - Meta:', (n.resumen || '').length, 'chars (necesita 150-170)');
  if (!tieneImagen) console.log('   - Sin imagen destacada');
}

process.exit(0);
