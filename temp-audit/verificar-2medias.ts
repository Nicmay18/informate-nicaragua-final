const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = 'ni-admin-2026-informate';

const IDS = [
  { id: 'jG3mvtcfZCxzecd62Lgd', slug: 'tres-hechos-violentos-dejan-afectados-en-leon-ocotal-y-managua' },
  { id: 'sgysqhqcvwAMBJZSxNVL', slug: 'dos-trabajadores-fallecen-tras-descargas-electricas-en-kukra-hill-y-la-paz-centro' },
];

const ADJETIVOS = ['tragico','terrible','impactante','conmociono','devastador','horrible','alarmante','desgarrador','lamentable','dramatico','critico','escalofriante','espeluznante','increible','inimaginable','indignante','escandaloso','vergonzoso','aterrador','mortifero','sangriento','brutal','salvaje','violento','agresivo','tragedia','fatal','horror','asesinato','muerto','muertos','muerta','muertas'];

async function run() {
  const res = await fetch(`${SITE_URL}/api/admin/news`, {
    headers: { 'x-admin-token': ADMIN_TOKEN, 'cache-control': 'no-cache' },
  });
  const d = await res.json();
  const news = Array.isArray(d) ? d : (d.news || []);

  for (const { id, slug } of IDS) {
    const n = news.find((x: any) => x.id === id || x.slug === slug);
    if (!n) { console.log(`NOT FOUND: ${id} / ${slug}`); continue; }
    const contenido = (n.contenido || '').toLowerCase();
    const adj = ADJETIVOS.filter(a => contenido.includes(a));
    const recursos = /118|128|115|133|denunciar|emergencia|prevencion/.test(contenido);
    console.log(`\n${n.titulo}`);
    console.log(`  ID: ${n.id} | Palabras: ${contenido.replace(/<[^>]*>/g, ' ').split(/\s+/).filter((w: string) => w.length > 0).length}`);
    console.log(`  Adjetivos: ${adj.length > 0 ? adj.join(', ') : 'NINGUNO'}`);
    console.log(`  Recursos útiles: ${recursos ? 'SI' : 'NO'}`);
    console.log(`  Categoría: ${n.categoria || 'N/A'}`);
    const chunk = contenido.replace(/<[^>]*>/g, ' ').substring(0, 200);
    console.log(`  Inicio: "${chunk}..."`);
  }
}
run().catch(console.error);
