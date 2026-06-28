/**
 * Limpieza masiva de noticias con bucles de IA
 * - Elimina secciones duplicadas exactas (H2s + párrafos repetidos)
 * - Elimina citas genéricas repetidas al final
 * - Actualiza Firestore
 * - Re-ejecuta análisis forense para confirmar
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Citas genéricas a eliminar
const CITAS_GENERICAS = [
  /De acuerdo con reportes locales verificados por este medio[\s\S]*?coinciden con la cronología de los hechos\.?/gi,
  /En relación a lo ocurrido, especialistas señalaron[\s\S]*?comprender su impacto\.?/gi,
  /Fuentes cercanas al lugar de los hechos confirmaron[\s\S]*?nota periodística\.?/gi,
  /Un vocero local manifestó respecto a la situación[\s\S]*?manera oportuna a la ciudadanía\.?/gi,
];

// Patrones de secciones a deduplicar
const SECCIONES_BUCLE = [
  /Contexto de seguridad en la zona/i,
  /Protocolos de respuesta institucional/i,
  /Recursos útiles y prevención/i,
  /Consejos de prevención/i,
  /Autoridades mantienen investigaciones/i,
];

function limpiarContenido(contenido) {
  let limpio = contenido;

  // 1. Eliminar citas genéricas repetidas
  for (const regex of CITAS_GENERICAS) {
    limpio = limpio.replace(regex, '');
  }

  // 2. Deduplicar párrafos idénticos sueltos (sin sección)
  let parrafos = limpio.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  const parrafoVisto = new Set();
  const parrafosUnicos = [];
  for (const p of parrafos) {
    const key = p.toLowerCase().replace(/\s+/g, ' ').substring(0, 250);
    if (!parrafoVisto.has(key)) {
      parrafoVisto.add(key);
      parrafosUnicos.push(p);
    }
  }
  limpio = parrafosUnicos.join('\n\n');

  // 3. Deduplicar líneas repetidas 3+ veces dispersas
  const lineas = limpio.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const lineaCounts = new Map();
  for (const l of lineas) {
    const key = l.toLowerCase().replace(/\s+/g, ' ').substring(0, 200);
    lineaCounts.set(key, (lineaCounts.get(key) || 0) + 1);
  }
  const lineasUnicas = [];
  const lineaYaUsada = new Set();
  for (const l of lineas) {
    const key = l.toLowerCase().replace(/\s+/g, ' ').substring(0, 200);
    // Si la línea se repite más de 2 veces en todo el texto, solo la dejamos una vez
    if ((lineaCounts.get(key) || 0) > 2) {
      if (lineaYaUsada.has(key)) continue;
      lineaYaUsada.add(key);
    }
    lineasUnicas.push(l);
  }

  return lineasUnicas.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function verificarLimpieza(contenido) {
  const problemas = [];
  const textoLimpio = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const lineas = textoLimpio.split(/[.!?]/).map(l => l.trim().toLowerCase()).filter(l => l.length > 10);
  const lineaCounts = new Map();
  for (const l of lineas) lineaCounts.set(l, (lineaCounts.get(l) || 0) + 1);
  const dupLineas = Array.from(lineaCounts.entries()).filter(([, c]) => c > 2);
  if (dupLineas.length > 0) {
    const topDup = dupLineas.sort((a, b) => b[1] - a[1]).slice(0, 3);
    for (const [texto, count] of topDup) {
      problemas.push(`Línea repetida ${count}x: "${texto.substring(0, 60)}..."`);
    }
  }

  const h2s = (contenido.match(/<h2[^>]*>(.*?)<\/h2>/gi) || []);
  const h2Texts = h2s.map(h => {
    const m = h.match(/<h2[^>]*>(.*?)<\/h2>/i);
    return m ? m[1].trim().toLowerCase().replace(/\s+/g, ' ') : '';
  }).filter(t => t.length > 0);
  const h2Counts = new Map();
  for (const t of h2Texts) h2Counts.set(t, (h2Counts.get(t) || 0) + 1);
  const dupH2s = Array.from(h2Counts.entries()).filter(([, c]) => c > 1);
  if (dupH2s.length > 0) {
    problemas.push(`H2s repetidos: ${dupH2s.map(([t, c]) => '"' + t + '" (' + c + 'x)').join(', ')}`);
  }

  const palabras = textoLimpio.split(' ').filter(p => p.length > 0).length;
  return { problemas, palabras };
}

async function limpiarNoticia(docId) {
  const docRef = db.collection('noticias').doc(docId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return { ok: false, error: 'No existe' };

  const data = docSnap.data();
  const contenidoOriginal = data.contenido || '';
  const contenidoLimpio = limpiarContenido(contenidoOriginal);

  const palabrasAntes = contenidoOriginal.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
  const verificacion = verificarLimpieza(contenidoLimpio);

  // Actualizar Firestore
  await docRef.update({
    contenido: contenidoLimpio,
    actualizadoEn: new Date(),
    notaLimpieza: 'Eliminados bloques duplicados de IA y citas genéricas repetidas',
  });

  return {
    ok: true,
    titulo: data.titulo,
    slug: data.slug,
    palabrasAntes,
    palabrasDespues: verificacion.palabras,
    reduccion: palabrasAntes - verificacion.palabras,
    problemasRestantes: verificacion.problemas.length,
    problemas: verificacion.problemas.slice(0, 3),
  };
}

async function main() {
  // Cargar reporte
  const reporte = JSON.parse(readFileSync('auditoria-basura-ia.json', 'utf8'));
  const criticas = reporte.noticias.filter(n => n.gravedad === 'CRITICA');

  console.log(`🧹 Limpiando ${criticas.length} noticias CRÍTICAS...\n`);

  const resultados = [];
  for (const n of criticas) {
    try {
      const res = await limpiarNoticia(n.id);
      resultados.push(res);
      console.log(`${res.ok ? '✅' : '❌'} ${n.titulo}`);
      console.log(`   Palabras: ${res.palabrasAntes} → ${res.palabrasDespues} (eliminadas: ${res.reduccion})`);
      if (res.problemasRestantes > 0) {
        console.log(`   ⚠️  Problemas restantes: ${res.problemasRestantes}`);
        for (const p of res.problemas) console.log(`      - ${p}`);
      } else {
        console.log(`   ✅ Sin problemas detectados`);
      }
      console.log(`   URL: https://nicaraguainformate.com/noticia/${n.slug}\n`);
    } catch (err) {
      console.log(`❌ ERROR en ${n.titulo}: ${err.message}\n`);
      resultados.push({ ok: false, titulo: n.titulo, error: err.message });
    }
  }

  const exitosas = resultados.filter(r => r.ok);
  const limpias = resultados.filter(r => r.ok && r.problemasRestantes === 0);
  const conRestos = resultados.filter(r => r.ok && r.problemasRestantes > 0);
  const fallidas = resultados.filter(r => !r.ok);

  console.log('\n=== RESUMEN ===');
  console.log(`Total procesadas: ${resultados.length}`);
  console.log(`Exitosas: ${exitosas.length}`);
  console.log(`  ✅ 100% limpias: ${limpias.length}`);
  console.log(`  ⚠️  con restos: ${conRestos.length}`);
  console.log(`❌ Fallidas: ${fallidas.length}`);
  console.log(`Total palabras eliminadas: ${exitosas.reduce((s, r) => s + r.reduccion, 0)}`);

  // Guardar log
  const fs = await import('fs');
  fs.writeFileSync('limpieza-basura-ia-log.json', JSON.stringify({
    fecha: new Date().toISOString(),
    resultados,
    resumen: { total: resultados.length, exitosas: exitosas.length, limpias: limpias.length, conRestos: conRestos.length, fallidas: fallidas.length },
  }, null, 2));

  console.log('\n💾 Log guardado en: limpieza-basura-ia-log.json');
  console.log('\n🔄 Próximo paso: Re-ejecutar análisis forense individual desde el panel para confirmar niveles.');
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
