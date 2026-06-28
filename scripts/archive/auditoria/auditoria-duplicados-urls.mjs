import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const noticias = JSON.parse(readFileSync(path.join(__dirname, 'backup-noticias-2026-06-14.json'), 'utf8'));

console.log('══════════════════════════════════════════════════════════════════');
console.log('  AUDITORÍA: Duplicados, ORO peligrosos y links rotos');
console.log('══════════════════════════════════════════════════════════════════\n');

// ── 1. Detectar duplicados por título normalizado ──
const porTitulo = new Map();
for (const n of noticias) {
  const t = (n.titulo || '').toLowerCase().trim().replace(/\s+/g, ' ');
  if (!t) continue;
  if (!porTitulo.has(t)) porTitulo.set(t, []);
  porTitulo.get(t).push(n);
}

const duplicados = [...porTitulo.values()].filter(arr => arr.length > 1);
console.log(`📌 DUPLICADOS EXACTOS por título: ${duplicados.length} grupos, ${duplicados.reduce((s,a)=>s+a.length,0)} noticias\n`);
for (const grupo of duplicados) {
  console.log(`  Título: ${grupo[0].titulo.substring(0,60)}`);
  for (const n of grupo) {
    const slug = n.slug || 'SIN-SLUG';
    const estado = n.estado || n.nivel || '?';
    console.log(`    → ID:${n.id?.slice(-8)} | slug: ${slug.substring(0,55)} | estado:${estado}`);
  }
  console.log('');
}

// ── 2. Detectar noticias con slugs sospechosos (patrón de regeneración) ──
// Buscar títulos similares con slugs DIFERENTES (posible regeneración post-restauración)
const porTituloSim = new Map();
for (const n of noticias) {
  // Normalizar título quitando puntuación y palabras comunes
  const t = (n.titulo || '').toLowerCase().replace(/[^a-z0-9áéíóúñ\s]/g, '').replace(/\s+/g, ' ').trim();
  // Clave sin palabras comunes de longitud variable
  const key = t.replace(/\b(en|de|la|el|los|las|un|una|por|con|para|y|o|a|del|al|que|se|su|no|trás|tras|fallece|muere|mueren|muerto|personas|persona|nicaragua|nicaragüense|nicaraguense|nicaraguenses)\b/g, '').trim().substring(0,40);
  if (key.length < 15) continue;
  if (!porTituloSim.has(key)) porTituloSim.set(key, []);
  porTituloSim.get(key).push(n);
}

const similares = [...porTituloSim.values()].filter(arr => arr.length > 1);
console.log(`\n📌 SIMILARES con diferentes slugs (posible regeneración): ${similares.length} grupos\n`);
for (const grupo of similares.slice(0, 20)) {
  const slugs = new Set(grupo.map(n => n.slug));
  if (slugs.size <= 1) continue; // mismo slug = no es duplicado
  console.log(`  Grupo: ${grupo[0].titulo.substring(0,55)}`);
  for (const n of grupo) {
    const slug = n.slug || 'SIN-SLUG';
    const estado = n.estado || n.nivel || '?';
    const palabras = (n.contenido || '').split(/\s+/).filter(w => w.length > 0).length;
    console.log(`    → ID:${n.id?.slice(-8)} | ${slug.substring(0,50)} | ${estado} | ${palabras} palabras`);
  }
  console.log('');
}

// ── 3. Noticias "ORO peligrosas": ORO pero con poco contenido o sin atribución ──
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

const evaluadas = noticias.map(n => ({ ...n, ...validar8Criterios(n) }));

// "ORO peligrosas": noticias que el backup dice ORO (o parece ORO) pero con problemas
// El usuario menciona que hay ORO con links rotos = duplicados donde uno es ORO y otro BRONCE/PLATA
const oro = evaluadas.filter(n => n.nivel === 'ORO');
const bronce = evaluadas.filter(n => n.nivel === 'BRONCE');

console.log(`\n══════════════════════════════════════════════════════════════════`);
console.log(`  RESUMEN POR NIVEL (8 criterios)`);
console.log(`══════════════════════════════════════════════════════════════════`);
console.log(`  ORO:   ${oro.length}`);
console.log(`  PLATA: ${evaluadas.filter(n => n.nivel === 'PLATA').length}`);
console.log(`  BRONCE:${bronce.length}`);

// Detectar ORO que comparten contenido con BRONCE/PLATA (duplicados de nivel mixto)
const oroConDuplicado = [];
for (const o of oro) {
  const t = (o.titulo || '').toLowerCase().replace(/[^a-z0-9áéíóúñ\s]/g, '').replace(/\s+/g, ' ').trim();
  const key = t.replace(/\b(en|de|la|el|los|las|un|una|por|con|para|y|o|a|del|al|que|se|su|no|trás|tras|fallece|muere|mueren|muerto|personas|persona|nicaragua|nicaragüense|nicaraguense|nicaraguenses)\b/g, '').trim().substring(0,40);
  const matches = evaluadas.filter(x => x.id !== o.id && x.titulo && x.titulo.toLowerCase().replace(/[^a-z0-9áéíóúñ\s]/g, '').replace(/\s+/g, ' ').trim().replace(/\b(en|de|la|el|los|las|un|una|por|con|para|y|o|a|del|al|que|se|su|no|trás|tras|fallece|muere|mueren|muerto|personas|persona|nicaragua|nicaragüense|nicaraguense|nicaraguenses)\b/g, '').trim().substring(0,40) === key);
  if (matches.length > 0) {
    oroConDuplicado.push({ oro: o, duplicados: matches });
  }
}

console.log(`\n📌 ORO con DUPLICADOS de menor nivel: ${oroConDuplicado.length}`);
for (const item of oroConDuplicado) {
  console.log(`\n  ORO:  ${item.oro.titulo.substring(0,60)} (${item.oro.id?.slice(-8)})`);
  for (const d of item.duplicados) {
    console.log(`    ↳ ${d.nivel}: ${d.titulo.substring(0,60)} (${d.id?.slice(-8)}) slug:${d.slug?.substring(0,45)}`);
  }
}

// Buscar específicamente el ejemplo del usuario
console.log(`\n══════════════════════════════════════════════════════════════════`);
console.log(`  BÚSQUEDA ESPECÍFICA: "wisconsin"`);
console.log(`══════════════════════════════════════════════════════════════════`);
const wisconsin = noticias.filter(n => (n.titulo || '').toLowerCase().includes('wisconsin') || (n.slug || '').toLowerCase().includes('wisconsin'));
for (const n of wisconsin) {
  const v = validar8Criterios(n);
  console.log(`  ${n.titulo.substring(0,65)}`);
  console.log(`    ID: ${n.id}`);
  console.log(`    Slug: ${n.slug}`);
  console.log(`    Nivel 8c: ${v.nivel} (${v.aprobados}/8) | ${v.palabras} palabras`);
  console.log('');
}

// Búsqueda de "jinotega" / "jinotegana" / "rancho"
const jinotega = noticias.filter(n => (n.titulo || '').toLowerCase().includes('jinotega') || (n.slug || '').toLowerCase().includes('jinotega') || (n.titulo || '').toLowerCase().includes('jinotegana'));
console.log(`\n  BÚSQUEDA: "jinotega/jinotegana" (${jinotega.length} resultados):`);
for (const n of jinotega) {
  console.log(`    ${n.titulo.substring(0,60)} | slug: ${n.slug}`);
}

process.exit(0);
