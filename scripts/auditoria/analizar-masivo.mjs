import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function analizarNoticia(data) {
  const payload = {
    titulo: data.titulo || '',
    contenido: data.contenido || '',
    resumen: data.resumen || '',
    categoria: data.categoria || 'General',
    autor: data.autor || '',
    fecha: data.fecha?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    slug: data.slug || '',
    imagenDestacada: data.imagenDestacada || data.imagen || '',
    palabrasClave: data.palabrasClave || [],
  };

  const res = await fetch('http://localhost:3001/api/admin/analizar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return await res.json();
}

async function main() {
  const snapshot = await db.collection('noticias').get();
  const noticias = [];
  for (const doc of snapshot.docs) {
    noticias.push({ id: doc.id, data: doc.data() });
  }

  console.log(`🔬 Analizando ${noticias.length} noticias...\n`);

  const resultados = [];
  let procesadas = 0;

  for (const n of noticias) {
    procesadas++;
    try {
      const analisis = await analizarNoticia(n.data);

      // Guardar resultado en Firestore
      await db.collection('noticias').doc(n.id).update({
        puntuacion: analisis.puntuacion,
        nivel: analisis.nivel,
        aprobado: analisis.aprobado,
        aiRiskScore: analisis.aiRiskScore,
        aiRiskLevel: analisis.aiRiskLevel,
        aiRiskIssues: analisis.aiRiskIssues || [],
        palabrasSensiblesDetectadas: analisis.palabrasSensiblesDetectadas || [],
        cierreGenerico: analisis.cierreGenerico || false,
        aiMetrics: analisis.aiMetrics || null,
        accionesRequeridas: analisis.accionesRequeridas || [],
        metadataSugerida: analisis.metadataSugerida || {},
        actualizadoEn: new Date(),
      });

      resultados.push({
        id: n.id,
        titulo: n.data.titulo,
        slug: n.data.slug,
        nivel: analisis.nivel,
        puntuacion: analisis.puntuacion,
        aprobado: analisis.aprobado,
        aiRiskLevel: analisis.aiRiskLevel,
        aiMetrics: analisis.aiMetrics,
      });

      if (procesadas % 10 === 0) {
        console.log(`  ... ${procesadas}/${noticias.length} procesadas`);
      }
    } catch (err) {
      console.log(`❌ ERROR ${n.data.titulo}: ${err.message}`);
      resultados.push({ id: n.id, titulo: n.data.titulo, error: err.message });
    }
  }

  // Reporte
  const niveles = { FORENSE: 0, ORO: 0, PLATA: 0, BRONCE: 0, RECHAZADO: 0 };
  for (const r of resultados) {
    if (r.nivel) niveles[r.nivel] = (niveles[r.nivel] || 0) + 1;
  }

  console.log('\n=== RESULTADO FORENSE MASIVO ===');
  console.log(`Total: ${resultados.length}`);
  console.log(`  🏆 FORENSE: ${niveles.FORENSE}`);
  console.log(`  🥇 ORO: ${niveles.ORO}`);
  console.log(`  🥈 PLATA: ${niveles.PLATA}`);
  console.log(`  🥉 BRONCE: ${niveles.BRONCE}`);
  console.log(`  🚫 RECHAZADO: ${niveles.RECHAZADO}`);

  // Guardar reporte
  const fs = await import('fs');
  fs.writeFileSync('analisis-forense-masivo.json', JSON.stringify({
    fecha: new Date().toISOString(),
    resumen: niveles,
    resultados,
  }, null, 2));

  console.log('\n💾 Reporte guardado: analisis-forense-masivo.json');
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
