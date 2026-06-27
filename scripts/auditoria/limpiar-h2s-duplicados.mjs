/**
 * Limpieza específica: eliminar H2s duplicados exactos + contenido de cada repetición
 * Elimina TODO lo que está entre un H2 duplicado y el siguiente H2 (o fin del texto)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const CITAS_GENERICAS = [
  /De acuerdo con reportes locales verificados por este medio[\s\S]*?coinciden con la cronología de los hechos\.?/gi,
  /En relación a lo ocurrido, especialistas señalaron[\s\S]*?comprender su impacto\.?/gi,
  /Fuentes cercanas al lugar de los hechos confirmaron[\s\S]*?nota periodística\.?/gi,
  /Un vocero local manifestó respecto a la situación[\s\S]*?manera oportuna a la ciudadanía\.?/gi,
];

function eliminarH2sDuplicados(contenido) {
  // 1. Eliminar citas genéricas repetidas
  let limpio = contenido;
  for (const regex of CITAS_GENERICAS) {
    limpio = limpio.replace(regex, '');
  }

  // 2. Parsear secciones entre H2s
  // Usar regex para capturar cada sección: H2 + contenido hasta el siguiente H2
  const regex = /(\u003ch2[^\u003e]*\u003e[\s\S]*?\u003c\/h2\u003e)([\s\S]*?)(?=\u003ch2[^\u003e]*\u003e|$)/gi;
  const secciones = [];
  let m;
  while ((m = regex.exec(limpio)) !== null) {
    secciones.push({ h2: m[1], contenido: m[2] });
  }

  // Si no hay H2s, devolver contenido como está (con citas eliminadas)
  if (secciones.length === 0) return limpio.trim();

  // 3. Deduplicar: mantener solo la primera ocurrencia de cada H2
  const h2Visto = new Set();
  const seccionesUnicas = [];
  for (const sec of secciones) {
    const h2Texto = sec.h2.replace(/\u003c[^\u003e]*\u003e/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!h2Visto.has(h2Texto)) {
      h2Visto.add(h2Texto);
      seccionesUnicas.push(sec);
    }
    // Si ya existe, descartamos toda la sección (H2 + contenido)
  }

  // 4. Reconstruir
  let resultado = seccionesUnicas.map(s => s.h2 + s.contenido).join('');

  // 5. Limpiar espacios múltiples y líneas vacías
  resultado = resultado.replace(/\n{3,}/g, '\n\n').trim();
  
  return resultado;
}

async function limpiarNoticia(docId) {
  const docRef = db.collection('noticias').doc(docId);
  const doc = await docRef.get();
  if (!doc.exists) return null;
  
  const data = doc.data();
  const original = data.contenido || '';
  const limpio = eliminarH2sDuplicados(original);
  
  const palabrasAntes = original.replace(/\u003c[^\u003e]*\u003e/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
  const palabrasDespues = limpio.replace(/\u003c[^\u003e]*\u003e/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
  
  await docRef.update({
    contenido: limpio,
    actualizadoEn: new Date(),
    notaLimpiezaH2: 'Eliminados H2s duplicados exactos y citas genéricas repetidas',
  });
  
  // Verificar
  const h2s = (limpio.match(/\u003ch2[^\u003e]*\u003e(.*?)\u003c\/h2\u003e/gi) || []);
  const h2Texts = h2s.map(h => {
    const m = h.match(/\u003ch2[^\u003e]*\u003e(.*?)\u003c\/h2\u003e/i);
    return m ? m[1].trim().toLowerCase().replace(/\s+/g, ' ') : '';
  }).filter(t => t.length > 0);
  const h2Counts = new Map();
  for (const t of h2Texts) h2Counts.set(t, (h2Counts.get(t) || 0) + 1);
  const dup = Array.from(h2Counts.entries()).filter(([,c]) => c > 1);
  
  return {
    titulo: data.titulo,
    slug: data.slug,
    palabrasAntes,
    palabrasDespues,
    reduccion: palabrasAntes - palabrasDespues,
    h2sTotales: h2s.length,
    h2sDuplicadosRestantes: dup.length,
  };
}

async function main() {
  // Buscar TODAS las noticias, no solo las publicadas
  const snapshot = await db.collection('noticias').get();
  const afectadas = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const contenido = data.contenido || '';
    const h2s = (contenido.match(/\u003ch2[^\u003e]*\u003e(.*?)\u003c\/h2\u003e/gi) || []);
    const h2Texts = h2s.map(h => {
      const m = h.match(/\u003ch2[^\u003e]*\u003e(.*?)\u003c\/h2\u003e/i);
      return m ? m[1].trim().toLowerCase().replace(/\s+/g, ' ') : '';
    }).filter(t => t.length > 0);
    const h2Counts = new Map();
    for (const t of h2Texts) h2Counts.set(t, (h2Counts.get(t) || 0) + 1);
    const dup = Array.from(h2Counts.entries()).filter(([,c]) => c > 1);
    
    if (dup.length > 0) {
      afectadas.push({ id: doc.id, titulo: data.titulo, slug: data.slug, dup });
    }
  }
  
  console.log(`🧹 Encontradas ${afectadas.length} noticias con H2s duplicados\n`);
  
  const resultados = [];
  for (const n of afectadas) {
    try {
      const res = await limpiarNoticia(n.id);
      resultados.push({ ok: true, ...res });
      console.log(`✅ ${res.titulo}`);
      console.log(`   Palabras: ${res.palabrasAntes} → ${res.palabrasDespues} (eliminadas: ${res.reduccion})`);
      console.log(`   H2s: ${res.h2sTotales} | Duplicados restantes: ${res.h2sDuplicadosRestantes}`);
      console.log(`   URL: https://nicaraguainformate.com/noticia/${res.slug}\n`);
    } catch (err) {
      console.log(`❌ ERROR ${n.titulo}: ${err.message}\n`);
      resultados.push({ ok: false, titulo: n.titulo, error: err.message });
    }
  }
  
  const exitosas = resultados.filter(r => r.ok);
  console.log('=== RESUMEN ===');
  console.log(`Total: ${resultados.length} | Exitosas: ${exitosas.length}`);
  console.log(`Palabras eliminadas: ${exitosas.reduce((s, r) => s + r.reduccion, 0)}`);
}

main().catch(console.error);
