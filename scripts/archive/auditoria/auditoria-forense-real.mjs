/**
 * auditoria-forense-real.mjs
 * INVESTIGACIÓN PROFUNDA DOCUMENTO POR DOCUMENTO.
 * No asume nada, analiza la data real de Firestore.
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: './.env.local' });

function initDb() {
  if (getApps().length > 0) return getFirestore(getApp());
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }
  if (privateKeyRaw && projectId && clientEmail) {
    const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return getFirestore();
  }
  console.error('ERROR: No se encontraron credenciales Firebase en .env.local');
  process.exit(1);
}

const db = initDb();

function contarPalabras(html) {
  if (!html) return 0;
  const texto = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return texto.split(' ').filter(w => w.length > 1).length;
}

function analizar8Criterios(n) {
  const contenido = n.contenido || '';
  const titulo = n.titulo || '';
  const resumen = n.resumen || '';
  const metaDesc = n.metaDescription || n.metaDescripcion || '';
  
  const words = contarPalabras(contenido);
  const hasH2 = /<h2/i.test(contenido);
  const hasStrong = /<strong|<b>/i.test(contenido) || /\d+/.test(contenido);
  const hasCitations = /según|de acuerdo a|expresó|dijo|informó|fuente|citó|cita|reportó|comunicó/i.test(contenido);
  const hasLead = (n.resumen || '').length > 80;
  const titleOk = titulo.length >= 40 && titulo.length <= 90;
  const metaOk = metaDesc.length >= 120;
  const imageOk = !!(n.imagen || n.imagenDestacada);

  const score = [words >= 300, hasH2, hasStrong, hasCitations, hasLead, titleOk, metaOk, imageOk].filter(Boolean).length;
  
  return {
    score,
    criterios: {
      palabras: words >= 300 ? '✅' : `❌ (${words})`,
      h2: hasH2 ? '✅' : '❌',
      negritas_o_numeros: hasStrong ? '✅' : '❌',
      citaciones: hasCitations ? '✅' : '❌',
      lead_largo: hasLead ? '✅' : '❌',
      titulo_seo: titleOk ? '✅' : `❌ (${titulo.length})`,
      meta_desc: metaOk ? '✅' : `❌ (${metaDesc.length})`,
      imagen: imageOk ? '✅' : '❌'
    }
  };
}

async function main() {
  console.log('🕵️‍♂️ INICIANDO AUDITORÍA FORENSE DE DATOS...\n');
  const snap = await db.collection('noticias').get();
  const total = snap.size;
  console.log(`Analizando ${total} documentos...\n`);

  const resultados = [];
  const duplicados = new Map();
  
  let totalPalabras = 0;
  let fallos = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const audit = analizar8Criterios(data);
    const words = contarPalabras(data.contenido);
    totalPalabras += words;

    // Detectar duplicados por título
    const tituloLower = (data.titulo || '').toLowerCase().trim();
    if (duplicados.has(tituloLower)) {
      duplicados.get(tituloLower).push(data.slug || doc.id);
    } else {
      duplicados.set(tituloLower, [data.slug || doc.id]);
    }

    if (audit.score < 8) fallos++;

    resultados.push({
      id: doc.id,
      slug: data.slug || doc.id,
      titulo: data.titulo,
      nivel_actual: data.nivel || 'bronce',
      puntuacion_forense: audit.score,
      detalles: audit.criterios,
      palabras: words
    });
  }

  // Generar Reporte de Fallos Críticos
  const fallosCriticos = resultados.filter(r => r.puntuacion_forense <= 4);
  const duplicadosReales = Array.from(duplicados.entries()).filter(([t, slugs]) => slugs.length > 1);

  const reporte = {
    resumen: {
      total_documentos: total,
      promedio_palabras: Math.round(totalPalabras / total),
      noticias_perfectas_8_8: resultados.filter(r => r.puntuacion_forense === 8).length,
      noticias_con_fallos: fallos,
      duplicados_detectados: duplicadosReales.length
    },
    fallos_criticos: fallosCriticos,
    duplicados: duplicadosReales
  };

  writeFileSync('REPORTE_FORENSE_DETALLADO.json', JSON.stringify(reporte, null, 2));

  console.log('📊 RESULTADOS DE LA AUTOPSIA DE DATOS:');
  console.log(`──────────────────────────────────────────────`);
  console.log(`Total Documentos:      ${total}`);
  console.log(`Promedio Palabras:     ${reporte.resumen.promedio_palabras}`);
  console.log(`Noticias 8/8 (Perfectas): ${reporte.resumen.noticias_perfectas_8_8}`);
  console.log(`Noticias con Fallos:   ${fallos}`);
  console.log(`──────────────────────────────────────────────\n`);

  if (duplicadosReales.length > 0) {
    console.log('⚠️  ALERTA DE CANIBALIZACIÓN (Duplicados):');
    duplicadosReales.forEach(([titulo, slugs]) => {
      console.log(`   - "${titulo.substring(0, 50)}..."`);
      console.log(`     Slugs: ${slugs.join(' | ')}`);
    });
    console.log('');
  }

  if (fallosCriticos.length > 0) {
    console.log('🚨 FALLOS CRÍTICOS (Menos de 4 criterios):');
    fallosCriticos.forEach(f => {
      console.log(`   - [${f.puntuacion_forense}/8] ${f.titulo.substring(0, 60)}`);
      console.log(`     Slug: ${f.slug}`);
      console.log(`     Falla en: ${Object.entries(f.detalles).filter(([k,v]) => v.includes('❌')).map(([k]) => k).join(', ')}\n`);
    });
  }

  console.log('Reporte completo guardado en: REPORTE_FORENSE_DETALLADO.json');
  process.exit(0);
}

main().catch(console.error);
