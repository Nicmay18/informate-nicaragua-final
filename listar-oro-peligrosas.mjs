import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const actual = JSON.parse(readFileSync(path.join(__dirname, 'backup-noticias-2026-06-14.json'), 'utf8'));

function validar8Criterios(n) {
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
  const criterios = [palabras >= 500, palabrasLead >= 35, tieneH2, tieneStrong || tieneDatos, passCitas, tituloOK, metaOK, tieneImagen];
  const aprobados = criterios.filter(Boolean).length;
  return { nivel: aprobados >= 7 ? 'ORO' : (aprobados >= 5 ? 'PLATA' : 'BRONCE'), aprobados, palabras };
}

function tieneAtribucion(n) {
  const texto = n.contenido || '';
  const tieneBlockquote = /<blockquote>/i.test(texto);
  const tieneCitas = texto.includes('"') && texto.split('"').length > 2;
  const tieneVerbos = /dijo|indic[oó]|manifest[oó]|declar[oó]|confirm[oó]|precis[oó]|explic[oó]|señal[oó]/i.test(texto);
  return tieneBlockquote || tieneCitas || tieneVerbos;
}

const evaluadas = actual.map(n => ({...n, ...validar8Criterios(n)}));
const oro = evaluadas.filter(n => n.nivel === 'ORO');

const oroPeligrosas = oro.filter(n => {
  const atrib = tieneAtribucion(n);
  return n.palabras < 550 || !atrib || (n.titulo||'').length < 45 || (n.titulo||'').length > 75 || (n.resumen||'').length < 140 || (n.resumen||'').length > 180 || !n.imagenDestacada;
});

console.log('══════════════════════════════════════════════════════════════════');
console.log('  ORO PELIGROSAS (' + oroPeligrosas.length + ' de ' + oro.length + ' ORO totales)');
console.log('  Criterio: <550 palabras, sin atribucion, titulo/meta irregular, sin imagen');
console.log('══════════════════════════════════════════════════════════════════\n');

oroPeligrosas.forEach((n,i) => {
  const probs = [];
  if (n.palabras < 550) probs.push('pocas palabras (' + n.palabras + ')');
  if (!tieneAtribucion(n)) probs.push('sin atribucion');
  if ((n.titulo || '').length < 45 || (n.titulo || '').length > 75) probs.push('titulo irregular (' + (n.titulo || '').length + ')');
  if ((n.resumen || '').length < 140 || (n.resumen || '').length > 180) probs.push('meta irregular (' + (n.resumen || '').length + ')');
  if (!n.imagenDestacada) probs.push('sin imagen');
  console.log((i+1) + '. ' + n.titulo.substring(0,65));
  console.log('   slug: ' + (n.slug||'').substring(0,55));
  console.log('   Problemas: ' + probs.join(', '));
  console.log('');
});

process.exit(0);
