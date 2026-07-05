const slugs = [
  'bertha-calderon-estrena-equipos-de-diagnostico-avanzado',
  'ia-medica-en-2026-diagnosticos-mas-certeros-que-medicos',
  'comerciante-fallece-tras-altercado-en-terminal-de-rosita',
  'medio-millon-participa-en-vigilia-del-papa-en-madrid',
  'dos-hombres-mueren-por-descargas-electricas-en-managua',
  'brigada-medica-realiza-cirugia-cardiacas-gratuitas-en-hospital-de-leon',
  'disminucion-de-lluvias-afecta-cultivos-y-reservas-de-agua-en-nicaragua',
  'tiktok-bajo-la-lupa-por-efectos-en-jovenes-nicaraguenses',
  'inauguraran-hospital-pediatrico-las-segovias-en-esteli-este-18-de-mayo',
];

async function run() {
  const res = await fetch('https://nicaraguainformate.com/api/admin/news', {
    headers: {
      'x-admin-token': 'ni-admin-2026-informate',
      'cache-control': 'no-cache',
    },
  });
  const d = await res.json();
  const news = Array.isArray(d) ? d : (d.news || []);
  const ids: string[] = [];
  for (const s of slugs) {
    const n = news.find((x: any) => x.slug === s);
    if (n) {
      console.log(`  ${n.id} | ${s} | ${(n.contenido || '').length} chars`);
      ids.push(n.id);
    } else {
      console.log(`  NOT FOUND | ${s}`);
    }
  }
  console.log('\nIDs array:', JSON.stringify(ids));
  console.log('Total news:', news.length);
}
run().catch(console.error);
