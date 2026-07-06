const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = 'ni-admin-2026-informate';

const SLEEP_MS = 800;

// Mapa manual de correcciones para títulos largos (asegurar neutralidad y longitud)
const TITULOS_CORREGIDOS: Record<string, string> = {
  'EK8pDgblNpScPCoGCgab': 'Bebé de un año sufre quemaduras en Diriá, Granada',
  'w5XzTjYCWTJRDX9NIPng': 'Dos personas fallecen en accidentes en Matagalpa y Wiwilí',
  'sgysqhqcvwAMBJZSxNVL': 'Dos trabajadores fallecen tras descargas eléctricas en Nicaragua',
  'C1UJ83ospxOXOtNGLwgr': 'Cuatro obreros afectados en accidentes laborales en Nicaragua',
  'kJZTSfqmUGHJKA8SFaE8': 'Julieta Venegas interpreta himno cultural del Mundial 2026',
  '0gGqzH1RBUeVTGHWkuvl': 'Cinco afectados en accidentes viales en Managua y regiones',
  'jG3mvtcfZCxzecd62Lgd': 'Tres incidentes dejan afectados en León, Ocotal y Managua',
  'sH5OCUULzSvZFhRcHXzb': 'Cinco agentes fallecen en operativo antidrogas en Honduras',
  'KXMHQ85cLbSZpXMx3eQm': 'Nicaragua recibe 278 mil turistas en primer trimestre de 2026',
};

// Resúmenes corregidos manualmente (120-160 caracteres)
const RESUMENES_CORREGIDOS: Record<string, string> = {
  'rIuDj1vH2je1fPKXZmiL': 'Un transportista falleció y otro resultó herido tras ser atropellados en Peñas Blancas. Las autoridades buscan al conductor que se dio a la fuga.',
  'n64la9Hnrkp0sENv0z5U': 'Los fallecimientos de una adolescente en Somoto y un joven en Villa El Carmen reavivan la importancia de buscar ayuda ante crisis emocional.',
  'YZXrLejJoYkKjwkh7bXA': 'Eduardo José Rodríguez Mendoza, de 65 años, falleció tras una colisión entre una motocicleta y un camioncito en Santo Tomás, Chontales.',
  'phXzIQ8qez7u8U5W9n4x': 'Katherine Estefany Machado Savallo, de 19 años, falleció tras ser arrollada por un camión cuando regresaba a su vivienda en Costa Rica.',
  'EK8pDgblNpScPCoGCgab': 'Un bebé de un año sufrió quemaduras en la espalda tras un accidente doméstico en Diriá, Granada. Fue atendido en un centro de salud local.',
  'OL6rkPggo0ktkycciubY': 'Un niño de 6 años con síndrome de Down falleció en un incendio registrado en Rosita, Región Autónoma del Caribe Norte.',
  'sgysqhqcvwAMBJZSxNVL': 'Cisle Ricardo Williams, de 23 años, falleció tras ser alcanzado por un rayo en Kukra Hill. Otro trabajador murió en La Paz Centro durante la tormenta.',
  'kJZTSfqmUGHJKA8SFaE8': 'El gobierno de la Ciudad de México eligió a Julieta Venegas para interpretar la canción cultural del Mundial 2026. No es el himno oficial FIFA.',
  '0gGqzH1RBUeVTGHWkuvl': 'Cuatro personas fallecieron en accidentes de motocicleta en Managua, Chontales y el Caribe Norte. Un quinto resultó herido en Madriz.',
  'jG3mvtcfZCxzecd62Lgd': 'Autoridades de León, Nueva Segovia y Managua reportaron tres incidentes durante el fin de semana. Investigan las circunstancias de cada caso.',
  'sH5OCUULzSvZFhRcHXzb': 'La Secretaría de Seguridad de Honduras intervino la DIPAMPCO tras el fallecimiento de cinco uniformados en una operación antidrogas.',
  'KXMHQ85cLbSZpXMx3eQm': 'El Instituto Nicaragüense de Turismo reportó 278 mil 937 visitantes internacionales entre enero y marzo de 2026. Estados Unidos lideró el origen.',
};

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function updateArticle(id: string, slug: string, titulo?: string, resumen?: string) {
  const payload: any = {};
  if (titulo) payload.titulo = titulo;
  if (resumen) payload.resumen = resumen;

  const res = await fetch(`${SITE_URL}/api/admin/news/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`  ERROR updating ${id}: ${res.status} ${await res.text()}`);
    return false;
  }

  // Revalidar
  await fetch(`${SITE_URL}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ slug, path: '/' }),
  });

  return true;
}

async function run() {
  const fs = await import('fs');
  const audit = JSON.parse(fs.readFileSync('temp-audit/auditoria-titulos-resumenes.json', 'utf-8'));
  const ids = new Set([...audit.badTitles.map((x: any) => x.id), ...audit.badSummaries.map((x: any) => x.id)]);

  console.log(`Artículos a corregir: ${ids.size}`);

  let fixed = 0;
  for (const id of ids) {
    const t = TITULOS_CORREGIDOS[id];
    const r = RESUMENES_CORREGIDOS[id];
    const slug = audit.badTitles.find((x: any) => x.id === id)?.slug || audit.badSummaries.find((x: any) => x.id === id)?.slug;
    if (!t && !r) {
      console.log(`  ${id}: no hay corrección definida`);
      continue;
    }
    const ok = await updateArticle(id, slug, t, r);
    if (ok) {
      console.log(`  ${id}: OK (título: ${t ? t.length : '-'}, resumen: ${r ? r.length : '-'})`);
      fixed++;
    }
    await sleep(SLEEP_MS);
  }

  console.log(`\nTotal corregidos: ${fixed}`);

  // Verificar
  await sleep(3000);
  const dashRes = await fetch(`${SITE_URL}/api/admin/dashboard-calidad?force=1`, {
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
  const dash = await dashRes.json();
  console.log('\nPost-corrección:');
  console.log('  Títulos optimizados:', dash.titulosOptimizados.count, `(${dash.titulosOptimizados.porcentaje}%)`);
  console.log('  Meta optimizadas:', dash.metaOptimizadas.count, `(${dash.metaOptimizadas.porcentaje}%)`);
  console.log('  Score Maestro:', dash.scoreMaestro);
}

run().catch(console.error);
