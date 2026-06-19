#!/usr/bin/env node
// validar-oro-masivo.mjs — Valida TODAS las noticias contra criterios ORO

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try {
    const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

// Replicar lógica del validador ORO
function validarORO(contenido) {
  const texto = contenido || '';
  const textoSinHtml = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const textoLower = textoSinHtml.toLowerCase();
  
  const checks = [];
  const palabras = textoSinHtml.split(/\s+/).filter(w => w.length > 0).length;
  
  // 1. Extensión
  checks.push({
    nombre: 'Extensión',
    estado: palabras >= 500 ? 'PASS' : palabras >= 350 ? 'WARN' : 'FAIL',
    valor: palabras,
    requerido: '>=500'
  });
  
  // 2. Lead (primer párrafo)
  const todosParrafos = texto.match(/<p>(.*?)<\/p>/g) || [];
  let leadPalabras = 0;
  for (const p of todosParrafos) {
    const pTexto = p.replace(/<[^>]*>/g, '').trim();
    const count = pTexto.split(/\s+/).filter(w => w.length > 0).length;
    if (count > 3 && leadPalabras === 0) { leadPalabras = count; }
  }
  checks.push({
    nombre: 'Lead informativo',
    estado: leadPalabras >= 35 && leadPalabras <= 50 ? 'PASS' : leadPalabras >= 20 ? 'WARN' : 'FAIL',
    valor: leadPalabras,
    requerido: '35-50 palabras'
  });
  
  // 3. Relleno emocional
  const adjetivos = ['tr[áa]gico', 'terrible', 'impactante', 'conmocion[oó]', 'devastador', 
    'horrible', 'alarmante', 'desgarrador', 'lamentable', 'dram[áa]tico', 'escalofriante',
    'espeluznante', 'incre[ií]ble', 'inimaginable', 'indignante', 'escandaloso', 'vergonzoso',
    'aterrador', 'mort[ií]fero', 'sangriento', 'brutal', 'salvaje', 'violento'];
  let emocionalCount = 0;
  adjetivos.forEach(a => {
    const regex = new RegExp(`\\b${a}[a-z]*\\b`, 'gi');
    const matches = textoLower.match(regex);
    if (matches) emocionalCount += matches.length;
  });
  checks.push({
    nombre: 'Relleno emocional',
    estado: emocionalCount <= 2 ? 'PASS' : emocionalCount <= 4 ? 'WARN' : 'FAIL',
    valor: emocionalCount,
    requerido: '<=2'
  });
  
  // 4. Transiciones IA
  const transicionesIA = ['asimismo', 'por otro lado', 'en ese sentido', 'cabe señalar',
    'resulta fundamental', 'se espera que', 'continúan las investigaciones',
    'en el contexto de', 'por su parte', 'de igual manera'];
  let iaCount = 0;
  transicionesIA.forEach(t => {
    const regex = new RegExp(t.replace(/\s/g, '\\s+'), 'gi');
    const matches = textoLower.match(regex);
    if (matches) iaCount += matches.length;
  });
  checks.push({
    nombre: 'Transiciones IA',
    estado: iaCount <= 2 ? 'PASS' : iaCount <= 4 ? 'WARN' : 'FAIL',
    valor: iaCount,
    requerido: '<=2'
  });
  
  // 5. Blockquotes
  const blockquotes = (texto.match(/<blockquote>/gi) || []).length;
  checks.push({
    nombre: 'Blockquotes',
    estado: blockquotes >= 1 ? 'PASS' : blockquotes >= 1 ? 'WARN' : 'FAIL',
    valor: blockquotes,
    requerido: '>=1'
  });
  
  // 6. H2
  const h2s = (texto.match(/<h2>/gi) || []).length;
  // Fallback: detectar subtítulos en texto plano
  let h2Fallback = 0;
  const lineas = texto.split(/[\n<]/).map(l => l.replace(/>/g, '').trim());
  for (const l of lineas) {
    if (/^(hechos principales|declaraciones|desarrollo|antecedentes|contexto|detalles|respuesta|reacciones|impacto|consecuencias|medidas|investigaci[oó]n|estad[ií]sticas|marco legal|sanciones)/i.test(l)) {
      h2Fallback++;
    }
  }
  const totalH2 = Math.max(h2s, h2Fallback);
  checks.push({
    nombre: 'Estructura (h2)',
    estado: totalH2 >= 1 ? 'PASS' : totalH2 >= 1 ? 'WARN' : 'FAIL',
    valor: totalH2,
    requerido: '>=1'
  });
  
  // 7. Strong tags
  const strongs = (texto.match(/<strong>/gi) || []).length;
  checks.push({
    nombre: 'Strong tags',
    estado: strongs >= 1 ? 'PASS' : 'FAIL',
    valor: strongs,
    requerido: '>=1'
  });
  
  // 8. Fuentes atribuidas
  const tieneCitas = /inform[oó]|confirm[oó]|declar[oó]|precis[oó]|señal[oó]|indic[oó]|dijo|explic[oó]|manifest[oó]|agreg[oó]|asegur[oó]|destac[oó]|mencion[oó]|indic[oó]/.test(texto);
  const tieneBlockquote = blockquotes >= 1;
  const tieneAtribucion = /seg[uú]n\s+(la|el|polic[ií]a|fiscal[ií]a|ministerio|autoridad|instituci[oó]n|portavoz)/.test(textoLower);
  checks.push({
    nombre: 'Fuentes atribuidas',
    estado: tieneCitas || tieneBlockquote || tieneAtribucion ? 'PASS' : 'FAIL',
    valor: tieneCitas ? 'citas' : tieneBlockquote ? 'blockquote' : tieneAtribucion ? 'atribución' : 'ninguna',
    requerido: 'cita/blockquote/atribución'
  });
  
  // Calcular nivel
  const passCount = checks.filter(c => c.estado === 'PASS').length;
  const failCount = checks.filter(c => c.estado === 'FAIL').length;
  const totalChecks = checks.length;
  const porcentaje = (passCount / totalChecks) * 100;
  
  let nivel = 'BRONCE';
  if (porcentaje >= 70 && failCount === 0) nivel = 'ORO';
  else if (porcentaje >= 60) nivel = 'PLATA';
  
  return { checks, nivel, passCount, failCount, porcentaje, palabras };
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();
  
  let oro = 0;
  let plata = 0;
  let bronce = 0;
  const detalle = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const { checks, nivel, passCount, failCount, porcentaje, palabras } = validarORO(data.contenido || '');
    
    if (nivel === 'ORO') oro++;
    else if (nivel === 'PLATA') plata++;
    else bronce++;
    
    detalle.push({
      id: doc.id,
      titulo: (data.titulo || '').slice(0, 50),
      nivel,
      porcentaje: porcentaje.toFixed(1),
      palabras,
      fallos: checks.filter(c => c.estado === 'FAIL').map(c => `${c.nombre}: ${c.valor} (req: ${c.requerido})`),
      warnings: checks.filter(c => c.estado === 'WARN').map(c => `${c.nombre}: ${c.valor}`),
    });
  });
  
  writeFileSync('validacion-oro-reporte.json', JSON.stringify(detalle, null, 2));
  
  console.log(`=== VALIDACIÓN ORO MASIVA ===`);
  console.log(`Total noticias: ${snapshot.size}`);
  console.log(`🥇 ORO: ${oro} (${((oro/snapshot.size)*100).toFixed(1)}%)`);
  console.log(`🥈 PLATA: ${plata} (${((plata/snapshot.size)*100).toFixed(1)}%)`);
  console.log(`🥉 BRONCE: ${bronce} (${((bronce/snapshot.size)*100).toFixed(1)}%)`);
  
  // Top problemas
  const problemas = {};
  detalle.forEach(d => {
    d.fallos.forEach(f => {
      problemas[f] = (problemas[f] || 0) + 1;
    });
  });
  
  console.log(`\n=== TOP PROBLEMAS ===`);
  Object.entries(problemas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([p, n], i) => {
      console.log(`${i+1}. ${p}: ${n} notas`);
    });
  
  // Notas más problemáticas
  console.log(`\n=== NOTAS CON MÁS FALLOS (Top 5) ===`);
  detalle
    .filter(d => d.fallos.length > 0)
    .sort((a, b) => b.fallos.length - a.fallos.length)
    .slice(0, 5)
    .forEach(d => {
      console.log(`[${d.nivel}] ${d.titulo} — ${d.palabras} palabras`);
      d.fallos.forEach(f => console.log(`   ❌ ${f}`));
    });
  
  console.log(`\n📄 Reporte: validacion-oro-reporte.json`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
