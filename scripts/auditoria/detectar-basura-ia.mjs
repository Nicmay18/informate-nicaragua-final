/**
 * Auditoría masiva: detectar noticias con patrones de basura de IA
 * - H2s repetidos exactos
 - Citas genéricas repetidas
 - Contenido en bucle (párrafos idénticos)
 - Cierres genéricos múltiples
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Patrones de basura a detectar
const PATRONES_BASURA = {
  // H2s que se repiten (los más comunes en bucle de IA)
  h2_bucle: [
    /contexto de seguridad/i,
    /protocolos de respuesta/i,
    /recursos útiles/i,
    /consejos de prevención/i,
    /autoridades mantienen investigaciones/i,
  ],
  // Citas genéricas repetidas sin atribución real
  citas_genericas: [
    /de acuerdo con reportes locales verificados por este medio/i,
    /en relación a lo ocurrido, especialistas señalaron/i,
    /un vocero local manifestó respecto a la situación/i,
    /fuentes cercanas al lugar de los hechos confirmaron/i,
    /es fundamental analizar estos eventos bajo una perspectiva integral/i,
    /mantenemos un monitoreo constante para informar de manera oportuna/i,
  ],
  // Cierres genéricos
  cierres_genericos: [
    /las autoridades mantienen (abiertas )?las investigaciones/i,
    /se espera que.*conforme avancen las diligencias/i,
    /hasta el momento no hay detenidos/i,
    /las investigaciones contin[uú]an/i,
    /autoridades investigan/i,
  ],
  // Transiciones de IA
  transiciones_ia: [
    /en conclusión/i,
    /es importante destacar/i,
    /resulta fundamental/i,
    /no cabe duda/i,
    /para concluir/i,
    /en resumen/i,
    /finalmente/i,
  ],
};

function detectarProblemas(noticia) {
  const problemas = [];
  const contenido = noticia.contenido || '';
  const titulo = noticia.titulo || '';

  // 1. H2s repetidos (con tags HTML)
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

  // 1b. Líneas de texto plano repetidas (sin tags HTML) — patrón de bucle de IA
  const textoLimpio = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const lineas = textoLimpio.split(/[.!?]/).map(l => l.trim().toLowerCase()).filter(l => l.length > 10);
  const lineaCounts = new Map();
  for (const l of lineas) lineaCounts.set(l, (lineaCounts.get(l) || 0) + 1);
  const dupLineas = Array.from(lineaCounts.entries()).filter(([, c]) => c > 2); // más de 2 repeticiones
  if (dupLineas.length > 0) {
    const topDup = dupLineas.sort((a, b) => b[1] - a[1]).slice(0, 3);
    for (const [texto, count] of topDup) {
      problemas.push(`Línea repetida ${count}x: "${texto.substring(0, 60)}..."`);
    }
  }

  // 2. H2s de bucle conocidos (en HTML o texto plano)
  for (const regex of PATRONES_BASURA.h2_bucle) {
    const matchesHtml = h2Texts.filter(t => regex.test(t));
    const matchesTexto = (contenido.match(regex) || []);
    if (matchesHtml.length > 1) {
      problemas.push(`H2 de bucle IA: "${matchesHtml[0]}" aparece ${matchesHtml.length} veces`);
    } else if (matchesTexto.length > 1) {
      problemas.push(`Texto de bucle IA repetido ${matchesTexto.length}x: "${matchesTexto[0].substring(0, 50)}..."`);
    }
  }

  // 3. Citas genéricas repetidas
  for (const regex of PATRONES_BASURA.citas_genericas) {
    const count = (contenido.match(regex) || []).length;
    if (count > 1) {
      problemas.push(`Cita genérica repetida ${count}x: "${contenido.match(regex)[0].substring(0, 50)}..."`);
    } else if (count === 1) {
      problemas.push(`Cita genérica detectada: "${contenido.match(regex)[0].substring(0, 50)}..."`);
    }
  }

  // 4. Cierres genéricos
  for (const regex of PATRONES_BASURA.cierres_genericos) {
    const count = (contenido.match(regex) || []).length;
    if (count > 1) {
      problemas.push(`Cierre genérico repetido ${count}x`);
    } else if (count === 1) {
      problemas.push(`Cierre genérico detectado`);
    }
  }

  // 5. Transiciones de IA
  for (const regex of PATRONES_BASURA.transiciones_ia) {
    const count = (contenido.match(regex) || []).length;
    if (count > 0) {
      problemas.push(`Transición IA: "${contenido.match(regex)[0]}" (${count}x)`);
    }
  }

  // 6. Palabras sensibles
  const palabrasSensibleRegex = /\b(muere|murió|fallecidos|asesinato|homicidio|sicario|ejecutado|decapitado|descuartizado|violento|siniestro|fatal|calcinado|drogas|narcotráfico|cartel|narco|masacre|ejecución)\b/gi;
  const sensibles = [...(titulo.match(palabrasSensibleRegex) || []), ...(contenido.match(palabrasSensibleRegex) || [])];
  if (sensibles.length > 0) {
    problemas.push(`Palabras sensibles: ${[...new Set(sensibles)].join(', ')}`);
  }

  // 7. Contenido muy corto o muy largo con baja densidad de datos
  const textoPlano = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(' ').filter(p => p.length > 0).length;
  if (palabras < 350) {
    problemas.push(`Muy corta: ${palabras} palabras (mínimo 350)`);
  }

  return problemas;
}

async function auditarNoticias() {
  console.log('🔍 Iniciando auditoría de basura de IA...\n');

  const snapshot = await db.collection('noticias')
    .where('publicado', '==', true)
    .get();

  const afectadas = [];
  let total = 0;

  for (const doc of snapshot.docs) {
    total++;
    const noticia = { id: doc.id, ...doc.data() };
    const problemas = detectarProblemas(noticia);

    if (problemas.length > 0) {
      afectadas.push({
        id: noticia.id,
        titulo: noticia.titulo,
        slug: noticia.slug,
        fecha: noticia.fecha?.toDate?.()?.toISOString() || noticia.fecha,
        problemas,
        gravedad: problemas.some(p => p.includes('H2s repetidos') || p.includes('bucle') || p.includes('Línea repetida')) ? 'CRITICA' :
                  problemas.some(p => p.includes('genérica')) ? 'ALTA' : 'MEDIA',
      });
    }
  }

  // Ordenar por gravedad
  afectadas.sort((a, b) => {
    const orden = { CRITICA: 0, ALTA: 1, MEDIA: 2 };
    return orden[a.gravedad] - orden[b.gravedad];
  });

  console.log(`📊 RESULTADOS: ${afectadas.length} de ${total} noticias afectadas (${((afectadas.length/total)*100).toFixed(1)}%)\n`);

  // Resumen por gravedad
  const critica = afectadas.filter(a => a.gravedad === 'CRITICA').length;
  const alta = afectadas.filter(a => a.gravedad === 'ALTA').length;
  const media = afectadas.filter(a => a.gravedad === 'MEDIA').length;
  console.log(`   🔴 CRÍTICA (H2s en bucle/repetidos): ${critica}`);
  console.log(`   🟠 ALTA (citas/cierres genéricos): ${alta}`);
  console.log(`   🟡 MEDIA (otros problemas): ${media}\n`);

  // Detalle de las más graves
  console.log('=== NOTICIAS CRÍTICAS (requieren reescritura urgente) ===\n');
  for (const n of afectadas.filter(a => a.gravedad === 'CRITICA').slice(0, 20)) {
    console.log(`🚨 ${n.titulo}`);
    console.log(`   URL: https://nicaraguainformate.com/noticia/${n.slug}`);
    console.log(`   Problemas:`);
    for (const p of n.problemas) console.log(`      - ${p}`);
    console.log('');
  }

  // Guardar reporte completo
  const fs = await import('fs');
  const reporte = {
    fecha: new Date().toISOString(),
    totalNoticias: total,
    afectadas: afectadas.length,
    porGravedad: { critica, alta, media },
    noticias: afectadas,
  };
  fs.writeFileSync('auditoria-basura-ia.json', JSON.stringify(reporte, null, 2));
  console.log(`💾 Reporte guardado en: auditoria-basura-ia.json`);
  console.log(`\n✅ Próximo paso: Revisar las ${critica} noticias CRÍTICAS y reescribirlas.`);
}

auditarNoticias().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
