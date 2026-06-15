import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const actual = JSON.parse(readFileSync(path.join(__dirname, 'backup-noticias-2026-06-14.json'), 'utf8'));
const pre = JSON.parse(readFileSync(path.join(__dirname, 'backup-pre-limpieza-2026-06-14.json'), 'utf8'));

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
  const nivel = aprobados >= 7 ? 'ORO' : (aprobados >= 5 ? 'PLATA' : 'BRONCE');
  const faltantes = [];
  if (!criterios[0]) faltantes.push('contenido');
  if (!criterios[1]) faltantes.push('lead');
  if (!criterios[2]) faltantes.push('h2');
  if (!criterios[3]) faltantes.push('strong');
  if (!criterios[4]) faltantes.push('citas');
  if (!criterios[5]) faltantes.push('titulo');
  if (!criterios[6]) faltantes.push('meta');
  if (!criterios[7]) faltantes.push('imagen');
  return { nivel, aprobados, faltantes, palabras };
}

console.log('══════════════════════════════════════════════════════════════════');
console.log('  AUDITORÍA COMPLETA: Links rotos + ORO peligrosos + BRONCE');
console.log('══════════════════════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════════
// 1. NOTICIAS PERDIDAS (Links rotos)
// ═══════════════════════════════════════════════════════════════
const actualIds = new Set(actual.map(n => n.id));
const preIds = new Set(pre.map(n => n.id));
const perdidas = pre.filter(n => !actualIds.has(n.id));
const nuevas = actual.filter(n => !preIds.has(n.id));

console.log('📌 NOTICIAS PERDIDAS (estaban en pre-limpieza, NO en backup actual):');
console.log(`   Total: ${perdidas.length}\n`);
for (const n of perdidas) {
  console.log(`   • ${n.titulo}`);
  console.log(`     Slug: ${n.slug}`);
  console.log(`     URL: https://nicaraguainformate.com/noticias/${n.slug}`);
  console.log('');
}

// Buscar en actual si hay "reemplazos" (mismo título, diferente slug/ID)
console.log('\n📌 POSIBLES REEMPLAZOS EN BASE ACTUAL (mismo título, diferente ID):');
const actualPorTitulo = new Map();
for (const n of actual) {
  const key = (n.titulo || '').toLowerCase().trim();
  if (!actualPorTitulo.has(key)) actualPorTitulo.set(key, []);
  actualPorTitulo.get(key).push(n);
}
const prePorTitulo = new Map();
for (const n of pre) {
  const key = (n.titulo || '').toLowerCase().trim();
  if (!prePorTitulo.has(key)) prePorTitulo.set(key, []);
  prePorTitulo.get(key).push(n);
}

let reemplazos = 0;
for (const [titulo, arrPre] of prePorTitulo) {
  const arrAct = actualPorTitulo.get(titulo);
  if (!arrAct) {
    // Título desaparecido completamente
    continue;
  }
  if (arrAct.length > 0 && arrPre.some(p => !actualIds.has(p.id))) {
    const idsPre = arrPre.map(p => p.id);
    const idsAct = arrAct.map(a => a.id);
    const idsPerdidos = idsPre.filter(id => !actualIds.has(id));
    if (idsPerdidos.length > 0) {
      reemplazos++;
      console.log(`\n   Título: ${titulo.substring(0,60)}`);
      console.log(`   PERDIDO:  slug=${arrPre.find(p=>!actualIds.has(p.id))?.slug}`);
      console.log(`   ACTUAL:   slug=${arrAct[0].slug}`);
    }
  }
}
if (reemplazos === 0) console.log('   No se detectaron reemplazos exactos por título.\n');

// ═══════════════════════════════════════════════════════════════
// 2. ORO "PELIGROSAS" (ORO pero con problemas críticos)
// ═══════════════════════════════════════════════════════════════
const evalActual = actual.map(n => ({ ...n, ...validar8Criterios(n) }));
const oro = evalActual.filter(n => n.nivel === 'ORO');
const bronce = evalActual.filter(n => n.nivel === 'BRONCE');

// ORO pero que el backend original marcaría como peligro (puntaje bajo en algunos checks)
// Consideramos "peligrosas" las ORO que:
// - Tienen < 550 palabras (muy justo)
// - No tienen atribuciones/citas claras
// - Tienen título muy corto o muy largo
// - No tienen imagen
const oroPeligrosas = oro.filter(n => {
  const tieneAtribucion = /<blockquote>/i.test(n.contenido) || /["\u201c][^"\u201d]{10,}["\u201d]/i.test(n.contenido) || /dijo|indic[oó]|manifest[oó]|declar[oó]|confirm[oó]/i.test(n.contenido);
  const problema =
    n.palabras < 550 ||
    !tieneAtribucion ||
    (n.titulo || '').length < 45 || (n.titulo || '').length > 75 ||
    (n.resumen || '').length < 140 || (n.resumen || '').length > 180 ||
    !n.imagenDestacada;
  return problema;
});

console.log('\n══════════════════════════════════════════════════════════════════');
console.log(`  🟠 ORO PELIGROSAS (${oroPeligrosas.length} de ${oro.length} ORO totales)`);
console.log('  Criterio: <550 palabras, sin atribución, título/meta irregular, sin imagen');
console.log('══════════════════════════════════════════════════════════════════');
for (const n of oroPeligrosas) {
  const probs = [];
  const tieneAtribucion = /<blockquote>/i.test(n.contenido) || /["\u201c][^"\u201d]{10,}["\u201d]/i.test(n.contenido) || /dijo|indic[oó]|manifest[oó]|declar[oó]|confirm[oó]/i.test(n.contenido);
  if (n.palabras < 550) probs.push('pocas palabras (' + n.palabras + ')');
  if (!tieneAtribucion) probs.push('sin atribución');
  if ((n.titulo || '').length < 45 || (n.titulo || '').length > 75) probs.push('título irregular (' + (n.titulo || '').length + ')');
  if ((n.resumen || '').length < 140 || (n.resumen || '').length > 180) probs.push('meta irregular (' + (n.resumen || '').length + ')');
  if (!n.imagenDestacada) probs.push('sin imagen');
  console.log(`\n   • ${n.titulo.substring(0,65)}`);
  console.log(`     ID: ${n.id?.slice(-8)} | slug: ${(n.slug || '').substring(0,50)}`);
  console.log(`     Problemas: ${probs.join(', ')}`);
}

// ═══════════════════════════════════════════════════════════════
// 3. BRONCE (backup actual)
// ═══════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════════════════');
console.log(`  🟤 BRONCE (${bronce.length} noticias)`);
console.log('══════════════════════════════════════════════════════════════════');
for (const n of bronce) {
  console.log(`\n   • ${n.titulo.substring(0,65)}`);
  console.log(`     ID: ${n.id?.slice(-8)} | slug: ${(n.slug || '').substring(0,50)}`);
  console.log(`     ${n.aprobados}/8 criterios | Faltan: ${n.faltantes.join(', ')} | ${n.palabras} palabras`);
}

// ═══════════════════════════════════════════════════════════════
// 4. Duplicados de slugs entre pre y actual (mismo slug, diferente ID)
// ═══════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════════════════');
console.log('  DUPLICADOS DE SLUG (mismo slug, diferente ID)');
console.log('══════════════════════════════════════════════════════════════════');
const slugPreMap = new Map();
for (const n of pre) {
  if (n.slug) {
    if (!slugPreMap.has(n.slug)) slugPreMap.set(n.slug, []);
    slugPreMap.get(n.slug).push({ id: n.id, titulo: n.titulo });
  }
}
const slugActMap = new Map();
for (const n of actual) {
  if (n.slug) {
    if (!slugActMap.has(n.slug)) slugActMap.set(n.slug, []);
    slugActMap.get(n.slug).push({ id: n.id, titulo: n.titulo });
  }
}

let dupSlug = 0;
for (const [slug, arrPre] of slugPreMap) {
  const arrAct = slugActMap.get(slug);
  if (arrAct) {
    const idsPre = arrPre.map(x=>x.id);
    const idsAct = arrAct.map(x=>x.id);
    const diff = idsPre.filter(id => !idsAct.includes(id)).length + idsAct.filter(id => !idsPre.includes(id)).length;
    if (diff > 0) {
      dupSlug++;
      console.log(`\n   Slug: ${slug}`);
      console.log(`   Pre:  ${arrPre.map(x=>x.id.slice(-8)).join(', ')}`);
      console.log(`   Act:  ${arrAct.map(x=>x.id.slice(-8)).join(', ')}`);
    }
  }
}
if (dupSlug === 0) console.log('   Ningún slug duplicado entre backups.\n');

process.exit(0);
