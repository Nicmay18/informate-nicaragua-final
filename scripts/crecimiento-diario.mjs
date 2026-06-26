// scripts/crecimiento-diario.mjs
// Ejecutar: node scripts/crecimiento-diario.mjs
// Genera el reporte de crecimiento llamando al API local o de producción

const BASE_URL = process.env.BASE_URL || 'https://nicaraguainformate.com';

async function main() {
  console.log('🚀 Generando reporte de crecimiento...');
  console.log(`🌐 URL: ${BASE_URL}/api/admin/crecimiento`);

  try {
    const res = await fetch(`${BASE_URL}/api/admin/crecimiento`, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    console.log('\n📑 Inventario:');
    console.log(`  Noticias existentes: ${data.noticiasExistentes}`);
    console.log(`  Fecha: ${data.fechaLocal} (${data.diaSemana})`);

    console.log('\n🔥 Tendencias:');
    data.trendingTopics.forEach(t => {
      console.log(`  ${t.demanda === 'Muy Alta' ? '🔴' : t.demanda === 'Alta' ? '🟠' : '🟡'} ${t.tema}`);
    });

    console.log('\n🕵️ Gaps principales:');
    data.gaps.slice(0, 3).forEach((g, i) => {
      console.log(`  #${i + 1} ${g.oportunidad} [${g.impacto}]`);
    });

    if (data.tareaHoy) {
      console.log(`\n✅ TAREA HOY (${data.tareaHoy.dia}): ${data.tareaHoy.tarea}`);
    }

    console.log(`\n✍️ Tema del día: ${data.temaDelDia}`);
    console.log('\n💾 Reporte guardado en Firestore (reportes_crecimiento/ultimo)');
    console.log('✅ Listo');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

main();
