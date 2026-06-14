#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(rootDir, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

function contarPalabras(texto) {
  return texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function stripHtml(texto) {
  return texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// PATRONES IA a eliminar (frases que suenan a relleno generado)
const PATRONES_IA = [
  { regex: /\ben conclusi[oó]n[,;:.]?\s*(?:se puede afirmar que |resulta claro que |cabe destacar que )?/gi, repl: '' },
  { regex: /\ben resumen[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes importante destacar que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bvale la pena mencionar que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes vital[,;:.]?\s*/gi, repl: '' },
  { regex: /\bresulta fundamental[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes indiscutible que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bno cabe duda de que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bresulta evidente que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bresulta innegable que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bcabe señalar que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bconviene destacar que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bno hay duda de que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes innegable que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bresulta claro que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes fundamental[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes crucial[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes esencial[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes pertinente[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes oportuno[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben el contexto de[^.]*\.?/gi, repl: '' },
  { regex: /\ben el marco de[^.]*\.?/gi, repl: '' },
  { regex: /\ben términos de[^.]*\.?/gi, repl: '' },
  { regex: /\bdesde el punto de vista de[^.]*\.?/gi, repl: '' },
  { regex: /\ben este sentido[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben ese sentido[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben dicho sentido[,;:.]?\s*/gi, repl: '' },
  { regex: /\ba este respecto[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpor su parte[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpor otro lado[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpor otra parte[,;:.]?\s*/gi, repl: '' },
  { regex: /\bde igual manera[,;:.]?\s*/gi, repl: '' },
  { regex: /\bde manera similar[,;:.]?\s*/gi, repl: '' },
  { regex: /\bde forma similar[,;:.]?\s*/gi, repl: '' },
  { regex: /\basimismo[,;:.]?\s*/gi, repl: '' },
  { regex: /\bdel mismo modo[,;:.]?\s*/gi, repl: '' },
  { regex: /\bigualmente[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpor lo tanto[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben consecuencia[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpor consiguiente[,;:.]?\s*/gi, repl: '' },
  { regex: /\bde ahí que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpor ende[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes por ello que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpor esta razón[,;:.]?\s*/gi, repl: '' },
  { regex: /\bdebido a esto[,;:.]?\s*/gi, repl: '' },
  { regex: /\ba causa de lo anterior[,;:.]?\s*/gi, repl: '' },
  { regex: /\bno obstante[,;:.]?\s*/gi, repl: '' },
  { regex: /\bsin embargo[,;:.]?\s*/gi, repl: '' },
  { regex: /\ba pesar de[^.]*\.?/gi, repl: '' },
  { regex: /\baun cuando[^.]*\.?/gi, repl: '' },
  { regex: /\bpor el contrario[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben contraste con[^.]*\.?/gi, repl: '' },
  { regex: /\bes de destacar que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes de resaltar que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes de señalar que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bconviene resaltar que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bconviene señalar que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes relevante que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes significativo que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes notorio que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes manifiesto que[,;:.]?\s*/gi, repl: '' },
  { regex: /\besto demuestra que[,;:.]?\s*/gi, repl: '' },
  { regex: /\besto prueba que[,;:.]?\s*/gi, repl: '' },
  { regex: /\besto confirma que[,;:.]?\s*/gi, repl: '' },
  { regex: /\besto evidencia que[,;:.]?\s*/gi, repl: '' },
  { regex: /\blo anterior[,;:.]?\s*/gi, repl: '' },
  { regex: /\blo mencionado[,;:.]?\s*/gi, repl: '' },
  { regex: /\blo expuesto[,;:.]?\s*/gi, repl: '' },
  { regex: /\blo señalado[,;:.]?\s*/gi, repl: '' },
  { regex: /\blo dicho[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben definitiva[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben última instancia[,;:.]?\s*/gi, repl: '' },
  { regex: /\bal final del d[ií]a[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben el fondo[,;:.]?\s*/gi, repl: '' },
  { regex: /\blo cierto es que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bla realidad es que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bel hecho es que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bla verdad es que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpodemos concluir que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bse puede concluir que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bse concluye que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bconcluimos que[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben síntesis[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpara concluir[,;:.]?\s*/gi, repl: '' },
  { regex: /\bcomo conclusi[oó]n[,;:.]?\s*/gi, repl: '' },
  { regex: /\ba modo de conclusi[oó]n[,;:.]?\s*/gi, repl: '' },
  { regex: /\ba modo de cierre[,;:.]?\s*/gi, repl: '' },
  { regex: /\bcomo cierre[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpara cerrar[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpara finalizar[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpara terminar[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben resumen final[,;:.]?\s*/gi, repl: '' },
  { regex: /\bresumiendo[,;:.]?\s*/gi, repl: '' },
  { regex: /\besperamos que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bse espera que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bse conf[ií]a en que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bse tiene la esperanza de que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bes de esperar que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bcabe esperar que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bresulta esperable que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bseg[uú]n fuentes consultadas[,;:.]?\s*/gi, repl: '' },
  { regex: /\bde acuerdo con informaci[oó]n preliminar[,;:.]?\s*/gi, repl: '' },
  { regex: /\bno se descarta que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bse estima que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bse proyecta que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bse anticipa que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bse prev[eé] que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bla informaci[oó]n disponible sugiere que[,;:.]?\s*/gi, repl: '' },
  { regex: /\blos expertos coinciden en que[,;:.]?\s*/gi, repl: '' },
  { regex: /\bseg[uú]n los analistas[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben un contexto de[^.]*\.?/gi, repl: '' },
  { regex: /\bfrente a este escenario[,;:.]?\s*/gi, repl: '' },
  { regex: /\bante esta situaci[oó]n[,;:.]?\s*/gi, repl: '' },
  { regex: /\bante este panorama[,;:.]?\s*/gi, repl: '' },
  { regex: /\bfrente a este panorama[,;:.]?\s*/gi, repl: '' },
  { regex: /\bante lo expuesto[,;:.]?\s*/gi, repl: '' },
  { regex: /\bcomo consecuencia de lo anterior[,;:.]?\s*/gi, repl: '' },
  { regex: /\bcomo resultado de lo expuesto[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben base a lo anterior[,;:.]?\s*/gi, repl: '' },
  { regex: /\bderivado de lo expuesto[,;:.]?\s*/gi, repl: '' },
  { regex: /\ba partir de lo señalado[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben funci[oó]n de lo expuesto[,;:.]?\s*/gi, repl: '' },
  { regex: /\bde acuerdo con lo anterior[,;:.]?\s*/gi, repl: '' },
  { regex: /\bcon base en lo expuesto[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpor lo expuesto[,;:.]?\s*/gi, repl: '' },
  { regex: /\bpor todo lo expuesto[,;:.]?\s*/gi, repl: '' },
  { regex: /\bante todo lo anterior[,;:.]?\s*/gi, repl: '' },
  { regex: /\bconsiderando lo anterior[,;:.]?\s*/gi, repl: '' },
  { regex: /\bteniendo en cuenta lo anterior[,;:.]?\s*/gi, repl: '' },
  { regex: /\bdado lo anterior[,;:.]?\s*/gi, repl: '' },
  { regex: /\bfrente a lo expuesto[,;:.]?\s*/gi, repl: '' },
  { regex: /\bante lo mencionado[,;:.]?\s*/gi, repl: '' },
  { regex: /\bde conformidad con lo expuesto[,;:.]?\s*/gi, repl: '' },
  { regex: /\ben concordancia con lo anterior[,;:.]?\s*/gi, repl: '' },
  { regex: /\bcomo parte de[^.]*\.?/gi, repl: '' },
  { regex: /\ben el [aá]mbito de[^.]*\.?/gi, repl: '' },
  { regex: /\bcon relaci[oó]n a[^.]*\.?/gi, repl: '' },
  { regex: /\brespecto a[^.]*\.?/gi, repl: '' },
  { regex: /\ben cuanto a[^.]*\.?/gi, repl: '' },
  { regex: /\bsobre la base de[^.]*\.?/gi, repl: '' },
  { regex: /\ben virtud de[^.]*\.?/gi, repl: '' },
  { regex: /\ba trav[eé]s de[^.]*\.?/gi, repl: '' },
  { regex: /\bmediante el uso de[^.]*\.?/gi, repl: '' },
  { regex: /\bpor medio de[^.]*\.?/gi, repl: '' },
  { regex: /\ba trav[eé]s del an[áa]lisis de[^.]*\.?/gi, repl: '' },
  { regex: /\ben funci[oó]n del an[áa]lisis de[^.]*\.?/gi, repl: '' },
  { regex: /\bcon el objetivo de[^.]*\.?/gi, repl: '' },
  { regex: /\bcon la finalidad de[^.]*\.?/gi, repl: '' },
  { regex: /\bcon el prop[oó]sito de[^.]*\.?/gi, repl: '' },
  { regex: /\bcon miras a[^.]*\.?/gi, repl: '' },
  { regex: /\ba fin de[^.]*\.?/gi, repl: '' },
  { regex: /\bpara fines de[^.]*\.?/gi, repl: '' },
  { regex: /\ben aras de[^.]*\.?/gi, repl: '' },
  { regex: /\bcon el fin de[^.]*\.?/gi, repl: '' },
];

// Leyes genéricas sin fuente - bloques a eliminar
const LEYES_GENERICAS = [
  /\b(?:seg[úu]n el|conforme al|de acuerdo con el)\s+(?:C[oó]digo Penal|C[oó]digo Civil|C[oó]digo de Familia|C[oó]digo Procesal Penal|C[oó]digo Laboral|Ley \d{1,4}|Decreto \d{1,4})\s*[,;:]?\s*(?:el delito de|la figura de|la conducta de|la acci[oó]n de)?\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:el|la)\s+(?:C[oó]digo Penal|C[oó]digo Civil|Ley \d{1,4}|Decreto \d{1,4})\s+(?:establece|dispone|contempla|regula|señala|indica|estipula|determina)\s*[^.]{0,300}\.(?:\s*<\/p>)?/gi,
  /\b(?:seg[úu]n\s+la\s+Ley\s+\d{1,4}[^,]{0,100},?\s*(?:el delito|la pena|la sanci[oó]n|la multa|la prisi[oó]n|la condena)\s*(?:de|por)\s*[^.]{0,200}\.(?:\s*<\/p>)?)/gi,
  /\b(?:el art[ií]culo\s+\d{1,3}\s+del\s+C[oó]digo Penal)\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:la normativa\s+(?:penal|legal|jur[ií]dica|vigente))\s*[^.]{0,150}\.(?:\s*<\/p>)?/gi,
  /\b(?:la legislaci[oó]n\s+(?:vigente|aplicable|correspondiente))\s*[^.]{0,150}\.(?:\s*<\/p>)?/gi,
  /\b(?:seg[úu]n\s+la\s+legislaci[oó]n\s+nacional)\s*[^.]{0,200}\.(?:\s*<\/p>)?/gi,
  /\b(?:el marco legal)\s*[^.]{0,150}\.(?:\s*<\/p>)?/gi,
  /\b(?:el ordenamiento jur[ií]dico)\s*[^.]{0,150}\.(?:\s*<\/p>)?/gi,
];

function limpiarPatronesIA(contenido) {
  let limpio = contenido;
  let totalReemplazos = 0;
  for (const { regex, repl } of PATRONES_IA) {
    const antes = limpio;
    limpio = limpio.replace(regex, repl);
    if (limpio !== antes) totalReemplazos++;
  }
  // Limpiar espacios dobles y triples
  limpio = limpio.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><');
  return { contenido: limpio, reemplazos: totalReemplazos };
}

function limpiarLeyesGenericas(contenido) {
  let limpio = contenido;
  let totalReemplazos = 0;
  for (const regex of LEYES_GENERICAS) {
    const antes = limpio;
    limpio = limpio.replace(regex, '');
    if (limpio !== antes) totalReemplazos++;
  }
  return { contenido: limpio, reemplazos: totalReemplazos };
}

function limpiarFechasFuturas(contenido) {
  // Reemplazar años 2027-2035 con "próximos años" o simplemente eliminar
  let limpio = contenido;
  limpio = limpio.replace(/\b(202[7-9]|203[0-5])\b/g, 'próximos años');
  limpio = limpio.replace(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(202[7-9]|203[0-5])/gi, (match) => match.replace(/202[7-9]|203[0-5]/, 'próximos años'));
  return limpio;
}

function generarMetaDescription(titulo, resumen, contenido) {
  const texto = stripHtml(resumen || contenido || '');
  const desc = texto.substring(0, 155).trim();
  return desc || titulo;
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  let limpiadas = 0;
  let metaGenerados = 0;
  const reporte = [];
  const aunCortas = [];

  for (const doc of docs) {
    let contenido = doc.contenido || '';
    let cambios = [];
    let modificado = false;

    // 1. Limpiar patrones IA
    const resultadoIA = limpiarPatronesIA(contenido);
    if (resultadoIA.reemplazos > 0) {
      contenido = resultadoIA.contenido;
      cambios.push(`${resultadoIA.reemplazos} patrones IA eliminados`);
      modificado = true;
    }

    // 2. Limpiar leyes genéricas
    const resultadoLeyes = limpiarLeyesGenericas(contenido);
    if (resultadoLeyes.reemplazos > 0) {
      contenido = resultadoLeyes.contenido;
      cambios.push(`${resultadoLeyes.reemplazos} leyes genéricas eliminadas`);
      modificado = true;
    }

    // 3. Limpiar fechas futuras
    const contenidoSinFechas = limpiarFechasFuturas(contenido);
    if (contenidoSinFechas !== contenido) {
      contenido = contenidoSinFechas;
      cambios.push('fechas futuras eliminadas');
      modificado = true;
    }

    // 4. Generar meta description si falta
    let metaDesc = doc.metaDescription || doc.metaDescripcion || '';
    if (!metaDesc || metaDesc.length < 20) {
      metaDesc = generarMetaDescription(doc.titulo || '', doc.resumen || '', contenido);
      cambios.push('meta description generada');
      metaGenerados++;
      modificado = true;
    }

    // Guardar cambios
    if (modificado) {
      await db.collection('noticias').doc(doc.id).update({
        contenido,
        metaDescription: metaDesc,
        metaDescripcion: metaDesc,
        pulidaForense: true,
        fechaPulida: new Date().toISOString(),
      });
      limpiadas++;
    }

    // Verificar si sigue corta
    const palabras = contarPalabras(contenido);
    if (palabras < 500) {
      aunCortas.push({ id: doc.id, titulo: doc.titulo, palabras, cambios: cambios.join(', ') });
    }

    if (modificado) {
      reporte.push({ id: doc.id, titulo: doc.titulo, cambios: cambios.join(', ') });
    }
  }

  console.log(`\n🧹 PULIDO FORENSE MASIVO`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`Total noticias analizadas: ${docs.length}`);
  console.log(`Noticias modificadas: ${limpiadas}`);
  console.log(`Meta descriptions generadas: ${metaGenerados}`);
  console.log(`Noticias que siguen cortas (<500 palabras): ${aunCortas.length}`);
  console.log(`═══════════════════════════════════════════════════`);

  if (reporte.length > 0) {
    console.log(`\n📋 PRIMERAS 20 NOTICIAS MODIFICADAS:`);
    reporte.slice(0, 20).forEach((r, i) => {
      console.log(`${i+1}. ${r.titulo}`);
      console.log(`   Cambios: ${r.cambios}`);
    });
  }

  if (aunCortas.length > 0) {
    console.log(`\n⚠️  NOTICIAS QUE SIGUEN CORTAS (${aunCortas.length} — necesitan datos reales para expandir):`);
    aunCortas.slice(0, 20).forEach((n, i) => {
      console.log(`${i+1}. ${n.titulo} (${n.palabras} palabras)`);
    });
  }

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
